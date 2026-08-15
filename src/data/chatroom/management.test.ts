import { apiPostAt } from '../backend';
import { CHATROOM_MANAGEMENT_API_BASE } from './config';
import { chatroomApiPost, unwrapChatroomPayload } from './management';

jest.mock('../backend', () => ({
  apiPostAt: jest.fn(),
}));

const mockedApiPostAt = apiPostAt as jest.MockedFunction<typeof apiPostAt>;

describe('chatroom management adapter', () => {
  beforeEach(() => mockedApiPostAt.mockReset());

  it('uses the configured API, raw shared auth client, and unwraps chatroom envelopes', async () => {
    mockedApiPostAt.mockResolvedValue({
      data: { chatrooms: [{ id: 'scid_1', name: 'Test' }] },
      meta: { code: 200 },
    });

    await expect(chatroomApiPost('/api/getChatrooms')).resolves.toEqual([
      { id: 'scid_1', name: 'Test' },
    ]);
    expect(mockedApiPostAt).toHaveBeenCalledWith(
      CHATROOM_MANAGEMENT_API_BASE,
      '/api/getChatrooms',
      {},
      true,
    );
  });

  it('unwraps single objects and plain data payloads', () => {
    expect(unwrapChatroomPayload({ data: { chatroom: { id: 'scid_1' } } }))
      .toEqual({ id: 'scid_1' });
    expect(unwrapChatroomPayload({ data: { usage: { totals: {} } } }))
      .toEqual({ usage: { totals: {} } });
  });

  it.each([
    new Error('Authentication failed after re-login.'),
    new Error('Forbidden'),
  ])('preserves auth and ownership errors from the shared client', async (error) => {
    mockedApiPostAt.mockRejectedValue(error);
    await expect(chatroomApiPost('/api/getChatroom/scid_other')).rejects.toBe(error);
  });
});
