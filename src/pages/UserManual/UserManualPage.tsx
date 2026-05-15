import { Button, Space } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MANUAL_BASE_PATH, MANUAL_CHAPTERS } from '../../config/userManual';

const IFRAME_MIN_HEIGHT = 480;
const IFRAME_TOP_OFFSET = 220;

/** User manual: chapter hub + iframe of static HTML from `public/manual/`. */
export function UserManualPage() {
  const [chapterFile, setChapterFile] = useState(MANUAL_CHAPTERS[0].file);
  const [iframeHeight, setIframeHeight] = useState(
    () => Math.max(IFRAME_MIN_HEIGHT, window.innerHeight - IFRAME_TOP_OFFSET)
  );
  const iframeSrc = useMemo(
    () => `${MANUAL_BASE_PATH}/${chapterFile}`,
    [chapterFile]
  );

  const onChapterChange = useCallback((file: string) => {
    setChapterFile(file);
    setIframeHeight(Math.max(IFRAME_MIN_HEIGHT, window.innerHeight - IFRAME_TOP_OFFSET));
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'spbuilder-manual-resize') return;
      const height = Number(event.data.height);
      if (!Number.isFinite(height) || height <= 0) return;
      const maxHeight = window.innerHeight - IFRAME_TOP_OFFSET;
      setIframeHeight(Math.min(Math.max(height + 16, IFRAME_MIN_HEIGHT), maxHeight));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onIframeLoad = useCallback(() => {
    setIframeHeight(Math.max(IFRAME_MIN_HEIGHT, window.innerHeight - IFRAME_TOP_OFFSET));
  }, []);

  return (
    <div className="user-manual-page">
      <div className="user-manual-page__hub">
        <Space wrap size="small">
          {MANUAL_CHAPTERS.map((chapter) => (
            <Button
              key={chapter.file}
              type={chapter.file === chapterFile ? 'primary' : 'secondary'}
              size="small"
              onClick={() => onChapterChange(chapter.file)}
            >
              {chapter.label}
            </Button>
          ))}
        </Space>
      </div>
      <iframe
        title="SP-Builder user manual"
        className="user-manual-page__frame"
        src={iframeSrc}
        style={{ height: iframeHeight }}
        onLoad={onIframeLoad}
      />
    </div>
  );
}
