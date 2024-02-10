import React, { type PropsWithChildren, useCallback, useRef, useState } from 'react';
import './bubblyButton.css';

export const BubblyButton: React.FC<PropsWithChildren<{ href?: string, download?: string }>> = ({ href, download, children }) => {

  const ref = useRef<HTMLAnchorElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animateButton = useCallback(() => {
    setIsAnimating(true);
    setTimeout(function () {
      setIsAnimating(false);
    }, 700);
  }, []);

  return (
    <span onClick={animateButton}>
      <a
        className={'bubbly-button' + (isAnimating ? ' animate' : '')}
        href={href}
        download={download}
        ref={ref}
      >
        {children}
      </a>
    </span>
  );
};
