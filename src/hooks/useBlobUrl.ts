import { useRef } from 'react';

/** Create URL for a blob and revoke when unmount */
export function useBlobUrl(blob?: Blob) {
  const urlRef = useRef<string>();
  if (blob) {
    if (urlRef.current !== undefined) {
      URL.revokeObjectURL(urlRef.current);
      console.log('useBlobUrl revoke', urlRef.current)
      urlRef.current = undefined;
    }

    urlRef.current = URL.createObjectURL(blob);
    console.log('useBlobUrl create', urlRef.current)
  }
  return urlRef.current;
}