import { buildEmbedScript } from './ScriptGenerator';
import { buildPreviewHtml } from './WidgetPreview';
import {
  CHATROOM_RUNTIME_API_BASE,
  CHATROOM_WIDGET_URL,
} from '../../data/chatroom/config';

describe('chatroom embed configuration', () => {
  it('generates a Qualtrics script with the configured runtime and widget URLs', () => {
    const script = buildEmbedScript('scid_123', true);

    expect(script).toContain(`s.src = "${CHATROOM_WIDGET_URL}"`);
    expect(script).toContain(`apiBaseUrl: "${CHATROOM_RUNTIME_API_BASE}"`);
    expect(script).toContain('chatroomId: "scid_123"');
    expect(script).toContain('resumable: true');
  });

  it('only enables the widget participant-ID prompt for resumable rooms', () => {
    const resumable = buildPreviewHtml({
      chatroomId: 'scid_resume',
      resumable: true,
      apiBaseUrl: 'https://runtime.example',
      widgetUrl: 'https://widget.example/chatroom.min.js',
    });
    const ordinary = buildPreviewHtml({
      chatroomId: 'scid_once',
      resumable: false,
      apiBaseUrl: 'https://runtime.example',
      widgetUrl: 'https://widget.example/chatroom.min.js',
    });

    expect(resumable).toContain('"resumable":true');
    expect(ordinary).not.toContain('"resumable":true');
  });
});
