import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AiConversationBatch from './AiConversationBatch'
import { chatroomApiPost } from '../../data/chatroom/management'
import { waitForBatchDownload } from '../../data/chatroom/downloadBatch'
import { Message } from '@arco-design/web-react'

jest.mock('react-router', () => ({ useParams: () => ({ batchId: 'batch' }) }))
jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))
jest.mock('../../data/chatroom/downloadBatch', () => ({ waitForBatchDownload: jest.fn() }))

const batch = {
  batch_job_id: 'batch', chatroom_id: 'room', status: 'timed_out', batch_count: 1,
  completed_count: 0, failed_count: 0, timed_out_count: 1, queued_count: 0,
  running_count: 0, unfinished_count: 0, created_at: '2026-09-19T00:00:00Z',
  deadline_at: 1800000000000, export_status: 'none',
  conversations: [{ conversation_id: 'conversation', batch_index: 0, status: 'running', reconciliation_pending: true }],
  reconciliation_pending: true,
}

afterEach(() => { jest.useRealTimers(); jest.resetAllMocks() })

test('shows recorded usage and estimated cost', async () => {
  ;(chatroomApiPost as jest.Mock).mockResolvedValue({ ...batch, conversations: [],
    reconciliation_pending: false, usage: {
      input_tokens: 1234, output_tokens: 56, estimated_cost_usd: '0.001234', inference_count: 3,
    } })
  await act(async () => { render(<AiConversationBatch />) })
  expect(screen.getByText('1,234')).toBeInTheDocument()
  expect(screen.getByText('56')).toBeInTheDocument()
  expect(screen.getByText('$0.001234')).toBeInTheDocument()
})

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn().mockImplementation((query) => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  })) })
})

test('selected row follows the displayed history by click and keyboard', async () => {
  ;(chatroomApiPost as jest.Mock).mockImplementation(async (path: string) => path.includes('History')
    ? { events: [{ event_key: path, type: 'message', sender: 'AI', content: path, timestamp: 1 }], has_more: false }
    : { ...batch, status: 'completed', reconciliation_pending: false, conversations: [
      { conversation_id: 'first', batch_index: 0, status: 'completed' },
      { conversation_id: 'second', batch_index: 1, status: 'completed' },
    ] })
  render(<AiConversationBatch />)
  await screen.findByText('/api/getAiConversationHistory/first')
  const rows = screen.getAllByRole('row').filter(row => row.hasAttribute('aria-selected'))
  expect(rows[0]).toHaveClass('batch-conversation-selected')
  fireEvent.click(rows[1])
  await screen.findByText('/api/getAiConversationHistory/second')
  expect(rows[1]).toHaveAttribute('aria-selected', 'true')
  expect(rows[0]).not.toHaveClass('batch-conversation-selected')
  fireEvent.keyDown(rows[0], { key: 'Enter' })
  await screen.findByText('/api/getAiConversationHistory/first')
  expect(rows[0]).toHaveAttribute('aria-selected', 'true')
})

test('keeps polling a terminal batch while conversation reconciliation is pending', async () => {
  jest.useFakeTimers()
  let repaired = false
  ;(chatroomApiPost as jest.Mock).mockImplementation(async (path: string) => {
    if (path.includes('History')) return { events: [], has_more: false }
    return repaired ? { ...batch, reconciliation_pending: false,
      conversations: [{ ...batch.conversations[0], status: 'timed_out', reconciliation_pending: false }] } : batch
  })
  await act(async () => { render(<AiConversationBatch />) })
  expect(screen.getByText('Finalizing')).toBeInTheDocument()
  repaired = true
  await act(async () => { jest.advanceTimersByTime(3000) })
  expect(screen.queryByText('Finalizing')).not.toBeInTheDocument()
  expect(screen.getAllByText('timed_out').length).toBeGreaterThan(0)
})

test('reconciliation errors remain visible instead of disappearing as a toast', async () => {
  ;(chatroomApiPost as jest.Mock).mockRejectedValue(new Error('Terminal reconciliation failed; operator action required'))
  await act(async () => { render(<AiConversationBatch />) })
  expect(screen.getByRole('alert')).toHaveTextContent('operator action required')
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
})

test('validation failure displays reason, disables download and stops polling', async () => {
  jest.useFakeTimers()
  ;(chatroomApiPost as jest.Mock).mockResolvedValue({ ...batch, status: 'validation_failed',
    last_error: 'AI-only runs require at least 3 personas', reconciliation_pending: false, conversations: [] })
  await act(async () => { render(<AiConversationBatch />) })
  expect(screen.getByRole('alert')).toHaveTextContent('at least 3 personas')
  expect(screen.getByRole('button', { name: 'Download conversation data' })).toBeDisabled()
  expect(screen.getByRole('link', { name: 'Back to chatroom' })).toHaveAttribute('href', '#/chatroom/room')
  await act(async () => { jest.advanceTimersByTime(10000) })
  expect(chatroomApiPost).toHaveBeenCalledTimes(1)
})

test('download keeps one label, reports failure, then permits retry and automatic download', async () => {
  ;(chatroomApiPost as jest.Mock).mockImplementation(async (path: string) => path.includes('History')
    ? { events: [], has_more: false } : { ...batch, reconciliation_pending: false, conversations: [] })
  const error = jest.spyOn(Message, 'error').mockImplementation(() => () => {})
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  ;(waitForBatchDownload as jest.Mock).mockRejectedValueOnce(new Error('Download timed out'))
    .mockResolvedValueOnce('https://example.com/data.zip')
  render(<AiConversationBatch />)
  const button = await screen.findByRole('button', { name: 'Download conversation data' })
  fireEvent.click(button)
  await waitFor(() => expect(error).toHaveBeenCalledWith('Download timed out'))
  fireEvent.click(button)
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
  expect(waitForBatchDownload).toHaveBeenCalledTimes(2)
  expect(button).toHaveTextContent('Download conversation data')
  expect(screen.getByRole('button', { name: 'Refresh' }).textContent).toBe('')
  error.mockRestore(); click.mockRestore()
})
