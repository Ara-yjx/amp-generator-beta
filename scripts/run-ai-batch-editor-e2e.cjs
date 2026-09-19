const fs = require('fs');
const { chromium } = require('playwright');

function parseAccountFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => line.trim());
  const valueAfter = (label) => {
    const index = lines.indexOf(label);
    return index >= 0 ? lines[index + 1] || '' : '';
  };
  const username = valueAfter('Username');
  const password = valueAfter('Password');
  if (!username || !password) throw new Error('Account file is missing Username or Password');
  return { username, password };
}

async function apiJson(baseUrl, path, token, init = {}) {
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', token);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Management API failed (${response.status})`);
  return payload.data ?? payload;
}

function formInput(page, label) {
  return page.locator('.arco-form-item').filter({ hasText: label }).locator('input').first();
}

async function main() {
  const editorUrl = process.argv[2] || 'http://127.0.0.1:3017/#/chatroom';
  const managementUrl = process.argv[3] || 'https://9wr63is7x6.execute-api.us-east-2.amazonaws.com/live';
  const accountFile = process.argv[4];
  const resultFile = process.argv[5] || '/tmp/stimulize-ai-batch-editor-e2e.json';
  const screenshotPath = process.argv[6] || '/tmp/stimulize-ai-batch-editor-e2e.png';
  if (!accountFile) {
    throw new Error(
      'usage: node run_ai_batch_editor_e2e.cjs <editor-url> <management-url> <account-file> [result-json] [screenshot]',
    );
  }

  const { username, password } = parseAccountFile(accountFile);
  let token;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, acceptDownloads: true });
  const page = await context.newPage();
  const browserErrors = [];
  const httpErrors = [];
  context.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url().split('?')[0] }); });
  let createdChatroom;
  let batchPage;
  for (const target of [page]) {
    target.on('pageerror', (error) => browserErrors.push(error.message));
    target.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
  }

  try {
    const name = `AI Batch Browser E2E ${Date.now().toString(36)}`;
    await page.goto(editorUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByPlaceholder('Enter username').fill(username);
    await page.getByPlaceholder('Enter password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('button', { name: 'Create Chatroom' }).waitFor();
    token = await page.evaluate(() => JSON.parse(localStorage.getItem('stimulize_auth')).token);
    await page.getByRole('button', { name: 'Create Chatroom' }).click();
    await page.getByPlaceholder('Chatroom name').fill(name);
    await page.getByPlaceholder('Chatroom name').press('Enter');
    await page.getByText(name, { exact: true }).waitFor({ timeout: 60000 });

    const list = await apiJson(managementUrl, '/api/getChatrooms', token, { method: 'POST' });
    createdChatroom = list.chatrooms.find((chatroom) => chatroom.name === name);
    if (!createdChatroom) throw new Error('UI-created chatroom was not returned by management API');

    await page.getByText(name, { exact: true }).click();
    await page.getByRole('heading', { name: 'Edit Chatroom' }).waitFor({ timeout: 60000 });
    // Verify the existing human mode remains available and can still save.
    await page.getByRole('button', { name: 'Save, Activate, and Launch Preview' }).waitFor();
    const saveResponse = page.waitForResponse((response) => response.url().includes('/api/updateChatroom/') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    if (!(await saveResponse).ok()) throw new Error('Human chatroom save failed');
    await page.getByText('AI+AI', { exact: true }).click();
    await page.getByText('Start Conversation', { exact: true }).waitFor();

    await formInput(page, 'Max message length').fill('80');
    await formInput(page, 'Max characters').fill('200');
    await formInput(page, 'Max messages').fill('2');
    const topicItem = page.locator('.arco-form-item').filter({ hasText: 'Chatroom topic' });
    await topicItem.locator('textarea').fill('Discuss one small way to improve a study routine.');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const editorRoomUrl = page.url();
    const createdResponse = page.waitForResponse((response) => response.url().includes('/api/createAiConversationBatch')
      && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save & test once' }).click();
    const response = await createdResponse;
    if (!response.ok()) throw new Error('Creating test batch failed');
    const created = (await response.json()).data.batch;
    const detailLink = page.locator(`a[href$="/ai-batches/${created.batch_job_id}"]`);
    await detailLink.waitFor();
    if (page.url() !== editorRoomUrl) throw new Error('Creating a batch unexpectedly navigated away');
    const openedPage = context.waitForEvent('page');
    await detailLink.click();
    batchPage = await openedPage;
    batchPage.on('pageerror', (error) => browserErrors.push(error.message));
    batchPage.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    await batchPage.waitForURL(/\/ai-batches\//, { timeout: 60000 });
    await batchPage.getByRole('heading', { name: 'AI Conversation Batch' }).waitFor({ timeout: 60000 });
    await batchPage.getByText('completed', { exact: true }).first().waitFor({ timeout: 120000 });

    const batchId = batchPage.url().split('/ai-batches/')[1];
    const detail = await apiJson(
      managementUrl,
      `/api/getAiConversationBatch/${batchId}`,
      token,
      { method: 'POST', body: JSON.stringify({ offset: 0, limit: 1 }) },
    );
    const conversation = detail.batch.conversations[0];
    const history = await apiJson(
      managementUrl,
      `/api/getAiConversationHistory/${conversation.conversation_id}`,
      token,
      { method: 'POST', body: JSON.stringify({ limit: 20 }) },
    );
    const messages = history.events.filter((event) => event.type === 'message');
    if (detail.batch.status !== 'completed' || messages.length !== 2) {
      throw new Error(`Expected completed two-turn conversation, got ${detail.batch.status}/${messages.length}`);
    }
    const bodyText = await batchPage.locator('body').innerText();
    for (const message of messages) {
      if (!bodyText.includes(message.content)) {
        throw new Error('Completed history was not visible on the batch page');
      }
    }
    await batchPage.screenshot({ path: screenshotPath, fullPage: true });

    const downloadPromise = batchPage.waitForEvent('download', { timeout: 190000 });
    await batchPage.getByRole('button', { name: 'Download conversation data' }).click();
    const download = await downloadPromise;
    await download.saveAs(`${resultFile}.zip`);
    await batchPage.screenshot({ path: screenshotPath, fullPage: true });

    const result = {
      ok: true,
      chatroom_id: createdChatroom.id,
      batch_job_id: detail.batch.batch_job_id,
      conversation_id: conversation.conversation_id,
      batch_status: detail.batch.status,
      message_count: messages.length,
      browser_errors: browserErrors,
      download_verified: true,
      http_errors: httpErrors,
    };
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    fs.writeFileSync(resultFile, JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      browser_errors: browserErrors,
    }, null, 2));
    throw error;
  } finally {
    if (createdChatroom) {
      await apiJson(
        managementUrl,
        `/api/deleteChatroom/${createdChatroom.id}`,
        token,
        { method: 'POST' },
      ).catch((error) => console.error(`Chatroom cleanup failed: ${error.message}`));
    }
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
