import { defaultChatroomSetting } from './chatroomSetting';
import {
  createChatroom,
  deleteChatroom,
  getChatroom,
  getChatroomUsage,
  listChatrooms,
  updateChatroom,
} from './api';
import { chatroomApiPost } from './management';

jest.mock('./management', () => ({
  chatroomApiPost: jest.fn(),
}));

const mockedPost = chatroomApiPost as jest.MockedFunction<typeof chatroomApiPost>;

describe('chatroom API routes', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPost.mockResolvedValue({} as never);
  });

  it('maps CRUD operations to the backend action routes', async () => {
    const setting = defaultChatroomSetting();

    await listChatrooms();
    await createChatroom('New room', setting);
    await getChatroom('scid_1');
    await updateChatroom('scid_1', { name: 'Renamed', status: 'active', setting });
    await deleteChatroom('scid_1');

    expect(mockedPost.mock.calls).toEqual([
      ['/api/getChatrooms'],
      ['/api/createChatroom', { name: 'New room', setting }],
      ['/api/getChatroom/scid_1'],
      ['/api/updateChatroom/scid_1', { name: 'Renamed', status: 'active', setting }],
      ['/api/deleteChatroom/scid_1'],
    ]);
  });

  it('maps usage periods to the usage action route', async () => {
    await getChatroomUsage('scid_1', 'week');
    expect(mockedPost).toHaveBeenCalledWith('/api/getChatroomUsage/scid_1', { period: 'week' });
  });
});
