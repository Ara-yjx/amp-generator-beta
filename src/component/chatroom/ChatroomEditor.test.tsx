import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ChatroomEditor from './ChatroomEditor'
import { getChatroom, updateChatroom } from '../../data/chatroom/api'
import { chatroomApiPost } from '../../data/chatroom/management'
import { ChatroomSetting, defaultSettingForMode } from '../../data/chatroom/chatroomSetting'

jest.mock('react-router', () => ({ useParams: () => ({ id: 'room' }) }))
jest.mock('../../data/chatroom/api', () => ({ getChatroom: jest.fn(), updateChatroom: jest.fn() }))
jest.mock('../../data/chatroom/management', () => ({ chatroomApiPost: jest.fn() }))

beforeEach(() => {
  jest.resetAllMocks()
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn().mockImplementation(query => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  })) })
  ;(chatroomApiPost as jest.Mock).mockImplementation(async (path: string) => {
    if (path.includes('Capabilities')) return {
      enabled: true, models: ['global.anthropic.claude-sonnet-4-6'], file_limits: {},
    }
    if (path.includes('getPromptAssets')) return { assets: [] }
    return { batches: [], next_cursor: null }
  })
  ;(updateChatroom as jest.Mock).mockImplementation(async (id, payload) => ({ id, ...payload }))
})

test.each([undefined, false, true])('preserves loaded early-completion policy on save: %s', async configured => {
  const setting: Partial<ChatroomSetting> = defaultSettingForMode('ai_only')
  if (configured === undefined) delete setting.allow_early_completion
  else setting.allow_early_completion = configured
  ;(getChatroom as jest.Mock).mockResolvedValue({ id: 'room', name: 'Existing room', status: 'active', setting })

  render(<ChatroomEditor />)
  const toggle = await screen.findByRole('switch', { name: 'Allow early completion' })
  const expected = configured ?? false
  expect(toggle).toHaveAttribute('aria-checked', String(expected))
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  await waitFor(() => expect(updateChatroom).toHaveBeenCalledWith('room', expect.objectContaining({
    setting: expect.objectContaining({ allow_early_completion: expected }),
  })))

  // A researcher can still explicitly change the loaded policy.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save', exact: true })).not.toHaveClass('arco-btn-loading'))
  fireEvent.click(toggle)
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  await waitFor(() => expect(updateChatroom).toHaveBeenLastCalledWith('room', expect.objectContaining({
    setting: expect.objectContaining({ allow_early_completion: !expected }),
  })))
  if (configured === undefined) expect(setting).not.toHaveProperty('allow_early_completion')
})
