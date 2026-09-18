import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import AttachmentList, { attachmentModelError, useAttachmentLibrary } from './AttachmentList'
import { apiUploadAt } from '../../data/backend'
import { chatroomApiPost } from '../../data/chatroom/management'
import { defaultChatroomSetting, denormalizeForSave } from '../../data/chatroom/chatroomSetting'

jest.mock('../../data/backend', () => ({ apiUploadAt: jest.fn() }))
jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))

const caps = { enabled: true, models: ['supported'], file_limits: { txt: 100000 } }
const persona = { persona: '', internal_name: '', nickname: '', model_id: null, temperature: null }

test('upload selects the new asset, preserves selection, and waits for confirmation', async () => {
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'test-upload' } })
  const assets = [{ id: 'existing', original_name: 'existing.txt', byte_size: 4, format: 'txt' }]
  const uploaded = { id: 'new', original_name: 'new.txt', byte_size: 4, format: 'txt' }
  const onChange = jest.fn()
  const library = { assets, caps, error: '', loading: false, roomId: 'room', visible: true, refresh: jest.fn() }
  const { rerender } = render(<AttachmentList value={['existing']} onChange={onChange} library={library} modelError="" />)
  ;(apiUploadAt as jest.Mock).mockResolvedValue({ data: { asset: uploaded } })
  library.refresh.mockImplementation(async () => {
    rerender(<AttachmentList value={['existing']} onChange={onChange} library={{ ...library, assets: [...assets, uploaded] }} modelError="" />)
  })
  fireEvent.click(screen.getByText('Add attachment'))
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File(['text'], 'new.txt', { type: 'text/plain' })] } })
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'new.txt' })).toBeChecked())
  expect(screen.getByRole('checkbox', { name: 'existing.txt' })).toBeChecked()
  expect(onChange).not.toHaveBeenCalled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add selected' })).toBeEnabled())
  fireEvent.click(screen.getByText('Add selected'))
  expect(onChange).toHaveBeenCalledWith(['existing', 'new'])
})
test('all persona effective models must support files, even unselected ones', () => {
  expect(attachmentModelError('supported', [persona], caps)).toBe('')
  expect(attachmentModelError('supported', [{ ...persona, model_id: 'other' }], caps)).toContain('All chatroom')
  expect(attachmentModelError('other', [], caps)).toContain('All chatroom')
  expect(attachmentModelError('supported', [], undefined)).toBe('')
  expect(attachmentModelError('', [], caps)).toBe('')
  expect(attachmentModelError('supported', [], { ...caps, enabled: false })).toContain('unavailable')
})

test('pending capabilities do not show an error or enable upload/confirmation', () => {
  const library = { assets: [], caps: undefined, loading: true, error: '', roomId: 'room', visible: true, refresh: jest.fn() }
  render(<AttachmentList value={['pending']} library={library} modelError="" />)
  expect(screen.getByText('Loading attachment...')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText('Add attachment'))
  expect(screen.getByRole('button', { name: 'Upload new' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Add selected' })).toBeDisabled()
  expect(screen.queryByText('No uploaded attachments.')).not.toBeInTheDocument()
})

test('request failure is distinct from disabled capabilities and offers retry', () => {
  const refresh = jest.fn()
  const library = { assets: [], caps, loading: false, error: 'Network unavailable', roomId: 'room', visible: true, refresh }
  render(<AttachmentList library={library} modelError="" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading attachments' }))
  expect(refresh).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByText('Add attachment'))
  expect(screen.getByRole('button', { name: 'Upload new' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Add selected' })).toBeDisabled()
  expect(screen.queryByText('No uploaded attachments.')).not.toBeInTheDocument()
})

describe('attachment library loading lifecycle', () => {
  const previousFlag = process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED
  beforeEach(() => {
    process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED = 'true'
    ;(chatroomApiPost as jest.Mock).mockReset()
  })
  afterEach(() => {
    if (previousFlag === undefined) delete process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED
    else process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED = previousFlag
  })

  test('keeps known capabilities on list failure and recovers on retry', async () => {
    ;(chatroomApiPost as jest.Mock).mockResolvedValueOnce(caps).mockRejectedValueOnce(new Error('List failed'))
    const { result } = renderHook(() => useAttachmentLibrary('room'))
    expect(result.current.loading).toBe(true)
    expect(attachmentModelError('supported', [], result.current.caps)).toBe('')
    await waitFor(() => expect(result.current.error).toBe('List failed'))
    expect(result.current.caps).toEqual(caps)
    expect(result.current.loading).toBe(false)
    ;(chatroomApiPost as jest.Mock).mockResolvedValueOnce(caps).mockResolvedValueOnce({ assets: [] })
    await act(async () => { await result.current.refresh() })
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })

  test('late response from the previous room cannot overwrite the current room', async () => {
    let resolveOld!: (value: unknown) => void
    const oldRequest = new Promise(resolve => { resolveOld = resolve })
    ;(chatroomApiPost as jest.Mock).mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(caps).mockResolvedValueOnce({ assets: [] })
    const { result, rerender } = renderHook(({ room }) => useAttachmentLibrary(room), { initialProps: { room: 'old' } })
    rerender({ room: 'new' })
    expect(result.current.caps).toBeUndefined()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { resolveOld({ ...caps, enabled: false }); await oldRequest })
    expect(result.current.roomId).toBe('new')
    expect(result.current.caps).toEqual(caps)
    expect(chatroomApiPost).toHaveBeenCalledTimes(3)
  })
})

test('save preserves room and attachment-only persona references', () => {
  const setting = { ...defaultChatroomSetting(), prompt_attachment_ids: ['shared'],
    ai_personas: [{ ...persona, prompt_attachment_ids: ['personal'] }] }
  const result = denormalizeForSave(setting)
  expect(result.prompt_attachment_ids).toEqual(['shared'])
  expect(result.ai_personas?.[0].prompt_attachment_ids).toEqual(['personal'])
})
