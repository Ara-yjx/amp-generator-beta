import { waitForBatchDownload } from './downloadBatch'
import { chatroomApiPost } from './management'

jest.mock('./management', () => ({ chatroomApiPost: jest.fn() }))
beforeEach(() => { jest.useFakeTimers(); jest.resetAllMocks() })
afterEach(() => jest.useRealTimers())
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }

test('polls the same download API until ready, restarting failed exports only on click', async () => {
  ;(chatroomApiPost as jest.Mock).mockResolvedValueOnce({ status: 'in_progress' })
    .mockResolvedValueOnce({ status: 'ready', download_url: 'https://example.com/data.zip' })
  const result = waitForBatchDownload('batch', new AbortController().signal)
  await flush(); jest.advanceTimersByTime(3000); await flush()
  await expect(result).resolves.toBe('https://example.com/data.zip')
  expect((chatroomApiPost as jest.Mock).mock.calls.map(c => c.slice(0, 2))).toEqual([
    ['/api/downloadAiConversationBatch/batch', { retry_failed: true }],
    ['/api/downloadAiConversationBatch/batch', { retry_failed: false }],
  ])
})

test('three consecutive failures stop polling and a new click can retry', async () => {
  ;(chatroomApiPost as jest.Mock).mockRejectedValue(new Error('Unavailable'))
  const result = waitForBatchDownload('batch', new AbortController().signal)
  const rejected = expect(result).rejects.toThrow('Unavailable')
  await flush(); jest.advanceTimersByTime(3000); await flush(); jest.advanceTimersByTime(3000); await flush()
  await rejected
  expect(chatroomApiPost).toHaveBeenCalledTimes(3)
  ;(chatroomApiPost as jest.Mock).mockResolvedValue({ status: 'ready', download_url: 'url' })
  await expect(waitForBatchDownload('batch', new AbortController().signal)).resolves.toBe('url')
})

test('in-progress responses are bounded by the overall deadline', async () => {
  ;(chatroomApiPost as jest.Mock).mockResolvedValue({ status: 'in_progress' })
  const result = waitForBatchDownload('batch', new AbortController().signal)
  const rejected = expect(result).rejects.toThrow('timed out')
  for (let i = 0; i < 61; i++) { await flush(); jest.advanceTimersByTime(3000) }
  await rejected
})

test('hung requests time out and leaving the page aborts without further requests', async () => {
  ;(chatroomApiPost as jest.Mock).mockImplementation(() => new Promise(() => {}))
  const controller = new AbortController()
  const result = waitForBatchDownload('batch', controller.signal)
  const rejected = expect(result).rejects.toThrow()
  jest.advanceTimersByTime(15000); await flush()
  controller.abort(); await flush(); await rejected
  jest.advanceTimersByTime(180000)
  expect(chatroomApiPost).toHaveBeenCalledTimes(1)
})
