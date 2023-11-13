import { useRef } from 'react';

/** Create URL for a blob and revoke when unmount */
export function useBlobUrl() {
  const urlRef = useRef<string>();
  return (blob?: Blob) => {
    if (blob) {
      if (urlRef.current !== undefined) {
        URL.revokeObjectURL(urlRef.current);
        console.debug('useBlobUrl revoke', urlRef.current);
        urlRef.current = undefined;
      }

      urlRef.current = URL.createObjectURL(blob);
      console.debug('useBlobUrl create', urlRef.current);
    }
    return urlRef.current;
  }
}
