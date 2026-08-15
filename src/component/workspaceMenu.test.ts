import { selectedWorkspaceMenu } from './workspaceMenu';

describe('selectedWorkspaceMenu', () => {
  it.each(['/my', '/exp', '/exp/12/edit'])(
    'selects Experiments for %s',
    (pathname) => expect(selectedWorkspaceMenu(pathname)).toBe('experiments'),
  );

  it.each(['/chatroom', '/chatroom/scid_1', '/chatroom/scid_1/usage'])(
    'selects Chatrooms for %s',
    (pathname) => expect(selectedWorkspaceMenu(pathname)).toBe('chatrooms'),
  );

  it('does not force a selection on Teams', () => {
    expect(selectedWorkspaceMenu('/team')).toBeNull();
  });
});
