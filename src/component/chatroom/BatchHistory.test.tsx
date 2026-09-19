import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import BatchHistory from './BatchHistory'
import { chatroomApiPost } from '../../data/chatroom/management'

jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))
const post = chatroomApiPost as jest.Mock
const batch = { batch_job_id: 'batch-1', chatroom_id: 'room', created_at: '2026-09-19T00:00:00Z', batch_count: 3, status: 'completed' }
beforeEach(() => { post.mockReset() })

test('loads room history, paginates, links details, and refreshes from the first page', async () => {
  post.mockResolvedValueOnce({ batches: [batch], next_cursor: 'cursor' })
    .mockResolvedValueOnce({ batches: [{ ...batch, batch_job_id: 'batch-2', status: 'failed' }], next_cursor: null })
    .mockResolvedValueOnce({ batches: [], next_cursor: null })
  render(<BatchHistory roomId="room" />)
  await screen.findByText('completed')
  expect(post).toHaveBeenNthCalledWith(1, '/api/getAiConversationBatches', { chatroom_id: 'room', limit: 20 })
  expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute('href', '#/chatroom/room/ai-batches/batch-1')
  fireEvent.click(screen.getByText('Load more'))
  await screen.findByText('failed')
  expect(post).toHaveBeenNthCalledWith(2, '/api/getAiConversationBatches', { chatroom_id: 'room', limit: 20, cursor: 'cursor' })
  expect(screen.getAllByRole('link', { name: 'View details' })).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
  await screen.findByText('No batches yet.')
  expect(post).toHaveBeenNthCalledWith(3, '/api/getAiConversationBatches', { chatroom_id: 'room', limit: 20 })
})

test('failure remains visible until retry succeeds', async () => {
  post.mockRejectedValueOnce(new Error('Connection failed')).mockResolvedValueOnce({ batches: [batch] })
  render(<BatchHistory roomId="room" />)
  await screen.findByText('Connection failed')
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
  await screen.findByText('completed')
  expect(screen.queryByText('Connection failed')).not.toBeInTheDocument()
})

test('stale room responses are ignored and new runs trigger refresh', async () => {
  let resolve!: (value: unknown) => void
  post.mockReturnValueOnce(new Promise(r => { resolve = r })).mockResolvedValue({ batches: [] })
  const { rerender } = render(<BatchHistory roomId="old" />)
  rerender(<BatchHistory roomId="new" />)
  await screen.findByText('No batches yet.')
  await act(async () => { resolve({ batches: [batch] }) })
  expect(screen.queryByText('completed')).not.toBeInTheDocument()
  await act(async () => { rerender(<BatchHistory roomId="new" revision={1} />) })
  await waitFor(() => expect(post).toHaveBeenCalledTimes(3))
})
