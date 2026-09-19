import { chatroomApiPost } from './management'

type DownloadResponse = { status: 'in_progress' } | { status: 'ready'; download_url: string }

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('Download cancelled or timed out. Please try again.'))
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

export async function waitForBatchDownload(batchId: string, signal: AbortSignal): Promise<string> {
  const deadline = Date.now() + 180000
  let failures = 0
  for (let attempt = 0; Date.now() < deadline; attempt++) {
    if (signal.aborted) throw new Error('Download cancelled')
    const request = new AbortController()
    const cancel = () => request.abort()
    signal.addEventListener('abort', cancel, { once: true })
    const timer = window.setTimeout(cancel, Math.min(15000, deadline - Date.now()))
    try {
      const result = await abortable(chatroomApiPost<DownloadResponse>(
        `/api/downloadAiConversationBatch/${batchId}`, { retry_failed: attempt === 0 }, request.signal,
      ), request.signal)
      if (result.status === 'ready' && result.download_url) return result.download_url
      if (result.status !== 'in_progress') throw new Error('Invalid download response')
      failures = 0
    } catch (error) {
      if (signal.aborted || ++failures >= 3) throw error
    } finally {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
    }
    await new Promise<void>((resolve, reject) => {
      const cancelWait = () => { window.clearTimeout(wait); reject(new Error('Download cancelled')) }
      const wait = window.setTimeout(() => { signal.removeEventListener('abort', cancelWait); resolve() }, Math.min(3000, Math.max(0, deadline - Date.now())))
      signal.addEventListener('abort', cancelWait, { once: true })
      if (signal.aborted) cancelWait()
    })
  }
  throw new Error('Download preparation timed out. Please try again.')
}
