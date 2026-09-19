import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import AttachmentList, { attachmentModelError, attachmentSelectionError, formatModelOptionLabel, useAttachmentLibrary, exclusivePersonaAttachments } from './AttachmentList'
import { useState } from 'react'
import { Message } from '@arco-design/web-react'
import { apiUploadAt } from '../../data/backend'
import { chatroomApiPost } from '../../data/chatroom/management'
import { defaultChatroomSetting, denormalizeForSave } from '../../data/chatroom/chatroomSetting'

jest.mock('../../data/backend', () => ({ apiUploadAt: jest.fn() }))
jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))

const caps = { enabled: true, models: ['supported'], file_limits: { txt: 100000 } }
const persona = { persona: '', internal_name: '', nickname: '', model_id: null, temperature: null }

test('persona inheritance follows common changes without storing inherited IDs', () => {
  const assets = [
    { id: 'new', original_name: 'new.txt', byte_size: 4, format: 'txt', created_at: '2026-09-19' },
    { id: 'old', original_name: 'old.txt', byte_size: 4, format: 'txt', created_at: '2026-09-18' },
  ]
  const library = { assets, caps, loading: false, error: '', roomId: 'room', visible: true, refresh: jest.fn() }
  const onChange = jest.fn()
  const { rerender } = render(<AttachmentList inheritedIds={['old']} library={library} onChange={onChange} modelError="" />)
  expect(screen.getByRole('button', { name: 'Manage attachments' })).toHaveTextContent('Upload attachments')
  expect(screen.getByRole('button', { name: 'Manage attachments' })).not.toHaveTextContent('old.txt')
  rerender(<AttachmentList value={['old', 'new']} inheritedIds={['old']} library={library} onChange={onChange} modelError="" />)
  expect(screen.getByRole('button', { name: 'Manage attachments' })).toHaveTextContent('new.txt')
  expect(screen.getByRole('button', { name: 'Manage attachments' })).not.toHaveTextContent('old.txt')
  rerender(<AttachmentList inheritedIds={['old']} library={library} onChange={onChange} modelError="" />)
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  expect(screen.getAllByRole('checkbox').map(x => x.parentElement?.textContent)).toEqual(['old.txt', 'new.txt'])
  expect(screen.getByRole('checkbox', { name: 'old.txt' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'old.txt' })).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: 'new.txt' }))
  expect(onChange).toHaveBeenCalledWith(['new'])
  rerender(<AttachmentList value={['new']} inheritedIds={[]} library={library} onChange={onChange} modelError="" />)
  expect(screen.getByRole('checkbox', { name: 'old.txt' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'old.txt' })).toBeEnabled()
  expect(screen.getByRole('checkbox', { name: 'new.txt' })).toBeChecked()
  const original = [{ ...persona, prompt_attachment_ids: ['old', 'new'] }]
  const exclusive = exclusivePersonaAttachments(original, ['old'])
  expect(exclusive[0].prompt_attachment_ids).toEqual(['new'])
  expect(original[0].prompt_attachment_ids).toEqual(['old', 'new'])
  expect(exclusivePersonaAttachments(exclusive, [])[0].prompt_attachment_ids).toEqual(['new'])
})

function ControlledAttachments(props: React.ComponentProps<typeof AttachmentList>) {
  const [value, setValue] = useState(props.value ?? [])
  return <AttachmentList {...props} value={value} onChange={ids => { setValue(ids); props.onChange?.(ids) }} />
}

test('effective limits count shared plus one persona, reusing IDs once', () => {
  const assets = Array.from({ length: 6 }, (_, i) => ({ id: String(i), original_name: `${i}.txt`, byte_size: 1000, format: 'txt' }))
  const library = { assets, caps, loading: false }
  expect(attachmentSelectionError(['0', '1', '2'], [['3', '4', '5']], library)).toContain('5 files')
  expect(attachmentSelectionError(['0', '1', '2'], [['2', '3', '4'], ['2', '3', '4']], library)).toBe('')
  expect(attachmentSelectionError(['0'], [['missing']], library)).toContain('unavailable')
  const pdfs = assets.slice(0, 3).map((a, i) => ({ ...a, format: 'pdf', byte_size: i === 2 ? 2000000 : 4000000, page_count: i === 2 ? 2 : 4 }))
  expect(attachmentSelectionError(['0', '1'], [['2']], { ...library, assets: pdfs })).toBe('')
  pdfs[2].byte_size++
  expect(attachmentSelectionError(['0', '1'], [['2']], { ...library, assets: pdfs })).toContain('10 MB')
  pdfs[2].byte_size--; pdfs[2].page_count++
  expect(attachmentSelectionError(['0', '1'], [['2']], { ...library, assets: pdfs })).toContain('10 pages')
})

test('attachment model badges describe enabled backend capabilities only', () => {
  const option = { label: 'Sonnet', value: 'supported', supportsPromptCaching: true }
  expect(formatModelOptionLabel(option, caps)).toBe('Sonnet (cache✅) (attachment✅)')
  expect(formatModelOptionLabel(option)).toBe('Sonnet (cache✅)')
  expect(formatModelOptionLabel(option, { ...caps, enabled: false })).toBe('Sonnet (cache✅)')
  expect(formatModelOptionLabel({ ...option, value: 'unsupported' }, caps)).not.toContain('attachment✅')
})

test('modal prevents combined overflow while still allowing deselection', async () => {
  const assets = Array.from({ length: 6 }, (_, i) => ({ id: String(i), original_name: `${i}.txt`, byte_size: 1000, format: 'txt' }))
  const library = { assets, caps, loading: false, error: '', roomId: 'room', visible: true, refresh: jest.fn() }
  render(<ControlledAttachments value={['3', '4']} otherScopes={[[ '0', '1', '2' ]]}
    library={library} modelError="" />)
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  expect(screen.getByRole('checkbox', { name: '5.txt' })).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: '4.txt' }))
  expect(screen.getByRole('checkbox', { name: '5.txt' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Add selected' })).not.toBeInTheDocument()
})

test('upload immediately selects the new asset and preserves selection without confirmation', async () => {
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'test-upload' } })
  const assets = [{ id: 'existing', original_name: 'existing.txt', byte_size: 4, format: 'txt' }]
  const uploaded = { id: 'new', original_name: 'new.txt', byte_size: 4, format: 'txt' }
  const onChange = jest.fn()
  const library = { assets, caps, error: '', loading: false, roomId: 'room', visible: true, refresh: jest.fn() }
  render(<ControlledAttachments value={['existing']} onChange={onChange} library={library} modelError="" />)
  ;(apiUploadAt as jest.Mock).mockResolvedValue({ data: { asset: uploaded } })
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File(['text'], 'new.txt', { type: 'text/plain' })] } })
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'new.txt' })).toBeChecked())
  expect(screen.getByRole('checkbox', { name: 'existing.txt' })).toBeChecked()
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

test('multi-upload preserves selections, skips invalid files and continues after a failed request', async () => {
  const error = jest.spyOn(Message, 'error').mockImplementation(() => () => {})
  const library = { assets: [], caps, error: '', loading: false, roomId: 'room', visible: true, refresh: jest.fn() }
  const onChange = jest.fn()
  ;(apiUploadAt as jest.Mock).mockReset().mockImplementation(async (_base, _path, body: FormData) => {
    const file = body.get('file') as File
    if (file.name === 'failed.txt') throw new Error('Upload failed')
    return { data: { asset: { id: file.name, original_name: file.name, byte_size: 4, format: 'txt' } } }
  })
  render(<ControlledAttachments value={['existing']} inheritedIds={['common']} onChange={onChange} library={library} modelError="" />)
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  expect(input.multiple).toBe(true)
  fireEvent.change(input, { target: { files: ['first.txt', 'bad.exe', 'failed.txt', 'last.txt'].map(name => new File(['text'], name)) } })
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'last.txt' })).toBeChecked())
  expect(screen.getByRole('checkbox', { name: 'first.txt' })).toBeChecked()
  expect(onChange).toHaveBeenLastCalledWith(['existing', 'first.txt', 'last.txt'])
  expect(apiUploadAt).toHaveBeenCalledTimes(3)
  expect(error).toHaveBeenCalledWith(expect.stringContaining('bad.exe'))
  expect(error).toHaveBeenCalledWith('failed.txt: Upload failed')
  error.mockRestore()
})

test('switching rooms stops queued uploads and ignores the old response', async () => {
  let resolve!: (value: unknown) => void
  ;(apiUploadAt as jest.Mock).mockReset().mockReturnValue(new Promise(r => { resolve = r }))
  const library = { assets: [], caps, error: '', loading: false, roomId: 'old', visible: true, refresh: jest.fn() }
  const onChange = jest.fn()
  const { rerender } = render(<AttachmentList library={library} onChange={onChange} modelError="" />)
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')] } })
  rerender(<AttachmentList library={{ ...library, roomId: 'new' }} onChange={onChange} modelError="" />)
  await act(async () => { resolve({ data: { asset: { id: 'a', original_name: 'a.txt' } } }) })
  expect(apiUploadAt).toHaveBeenCalledTimes(1)
  expect(onChange).not.toHaveBeenCalled()
})

test('pending capabilities do not show an error or enable upload/confirmation', () => {
  const library = { assets: [], caps: undefined, loading: true, error: '', roomId: 'room', visible: true, refresh: jest.fn() }
  render(<AttachmentList value={['pending']} library={library} modelError="" />)
  expect(screen.getByText('Loading attachment...')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  expect(screen.getByRole('button', { name: 'Upload new' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Add selected' })).not.toBeInTheDocument()
  expect(screen.queryByText('No uploaded attachments.')).not.toBeInTheDocument()
})

test('request failure is distinct from disabled capabilities and offers retry', () => {
  const refresh = jest.fn()
  const library = { assets: [], caps, loading: false, error: 'Network unavailable', roomId: 'room', visible: true, refresh }
  render(<AttachmentList library={library} modelError="" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading attachments' }))
  expect(refresh).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Manage attachments' }))
  expect(screen.getByRole('button', { name: 'Upload new' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Add selected' })).not.toBeInTheDocument()
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
