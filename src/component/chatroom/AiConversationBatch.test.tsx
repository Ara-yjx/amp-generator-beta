import { act, render, screen } from '@testing-library/react'
import AiConversationBatch from './AiConversationBatch'
import { chatroomApiPost } from '../../data/chatroom/management'

jest.mock('react-router', () => ({ useParams: () => ({ batchId: 'batch' }) }))
jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))

const batch = {
  batch_job_id: 'batch', chatroom_id: 'room', status: 'timed_out', batch_count: 1,
  completed_count: 0, failed_count: 0, timed_out_count: 1, queued_count: 0,
  running_count: 0, unfinished_count: 0, created_at: '2026-09-19T00:00:00Z',
  deadline_at: 1800000000000, export_status: 'none',
  conversations: [{ conversation_id: 'conversation', batch_index: 0, status: 'running', reconciliation_pending: true }],
  reconciliation_pending: true,
}

afterEach(() => { jest.useRealTimers(); jest.resetAllMocks() })
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn().mockImplementation((query) => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  })) })
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
