import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Moveable, { OnRender } from 'react-moveable';
import { AT } from '../data/ampTypes';
import { DeepPartial } from '../util/util';
import { useDebounceValue } from 'usehooks-ts';


/**
 * |------>|                     originLeft
 * |--->|                        translateX
 *         |<---|                offsetX
 * [                         ]
 * [    [  x  ]              ]
 * [            x            ]
 * [                         ]
 * [                         ]
 * 
 * originLeft = offsetX + canvasWidth / 2 = translateX + elementWidth / 2
 */


/** Style emitted from Moveable */
type ElementCssStyle = {
  width: number,
  height: number,
  transform: string,
  // w + h + (transform | originLeft + originTop + rotate)
  // either is the necessary and sufficient condition to locate an element
  // But `Moveable.origin` is a measured property of the actual rendered element.
  // We cannot get the updated value in the onChange event as a controlled component
}


/** Required context to transform between MoveableStyle and CanonicalStyle */
type CanvasSize = {
  width: number,
  height: number,
}


export interface FreeformElementControlRef {
  updateRect: () => void;
}

export interface FreeformElementControlProps {
  container: HTMLDivElement | null,
  containerWidth: number,
  containerHeight: number,

  value: AT.FreeformLayout.ElementDisplayItem,
  onPatch: (updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void,
  page: number,

  isFocused: boolean,
  onClick: React.MouseEventHandler,
  scale: number,

  children: React.ReactNode,
}

export const FreeformElementControl = forwardRef<FreeformElementControlRef, FreeformElementControlProps>(
  ({ container, containerWidth, containerHeight, value, onPatch, page, isFocused, onClick, scale, children }, ref) => {

    // Basically, React will only render to create the element
    //   and the position will be updated by Moveable callback (on update) and useEffect (first render + after rounding)
    // This is because 
    //   1) Moveable is designed to be a passive/uncontrolled component
    //   2) avoiding re-rendering can improve performance

    const targetRef = useRef<HTMLDivElement>(null);
    const moveableRef = useRef<Moveable>(null);

    const canvasSize = useMemo(() => ({ width: containerWidth, height: containerHeight }), [containerWidth, containerHeight]);
    const cssStyle = toCssStyle(value.boxStyle, canvasSize);
    const cssStyleMemo = useMemo(() => cssStyle, [cssStyle.width, cssStyle.height, cssStyle.transform]);

    // Keep updated with state style, but not too frequently - onRender callback would handle it during moving, we only update it in useEffect when
    // - first render
    // - canvas resize
    // - scale change (not implemented yet)
    // - input from property panel
    // - after rounding (similar to input from property panel)
    const [cssStyleDebounce] = useDebounceValue(cssStyleMemo, 100, { leading: true, trailing: true });
    useEffect(() => {
      if (targetRef.current) {
        setElementStyle(targetRef.current, cssStyleDebounce);
        isFocused && moveableRef.current?.updateRect();
      }
    }, [moveableRef.current, targetRef.current, canvasSize, isFocused, cssStyleDebounce]);

    // Expose updateRect
    useImperativeHandle(ref, () => {
      return {
        updateRect() {
          moveableRef.current?.updateRect()
        },
      };
    }, []);

    const onRender = useCallback((e: OnRender) => {
      // Moveable is designed to be a passive/uncontrolled component
      // We must first apply the updated style (w/h/transform) from e.cssText
      // And then read the style from target and convert to canonical style
      // Finally, in useEffect, we re-update the target style after rounding
      e.target.style.cssText += e.cssText;
      e.moveable.updateRect();
      const canonicalStyle = toCanonicalStyle({
        width: Number(e.target.style.width.replace('px', '')),
        height: Number(e.target.style.height.replace('px', '')),
        transform: e.target.style.transform ?? '',
      }, canvasSize);
      onPatch({ boxStyle: canonicalStyle }); // todo: debounce this, but the parent callback also needs immutability
    }, [canvasSize, onPatch]);

    return (
      <>
        <div
          ref={targetRef}
          className={`freeform-page-${page}${isFocused ? '' : '-not-focused'}`}
          style={{ position: 'absolute', overflow: 'hidden', cursor: isFocused ? 'move' : undefined }}
          onClick={onClick}
        >
          {children}
        </div>
        {
          isFocused && (
            <Moveable
              ref={moveableRef}
              target={targetRef}
              container={container}
              draggable
              resizable
              rotatable
              origin={true}

              onRender={onRender}

              snappable={true}
              snapRotationDegrees={[0, 90, 180, 270]}
              snapRotationThreshold={5}
              snapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
              verticalGuidelines={[0, containerWidth / 2, containerWidth]}
              horizontalGuidelines={[0, containerHeight / 2, containerHeight]}
              elementSnapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
              // Moveable bug: self would snap to self; would also try to snap to other page's invisible element and fail (no snap at all)
              // Actually, only one element can be used as guideline...
              elementGuidelines={[`.freeform-page-${page}-not-focused`]}
              isDisplaySnapDigit={false} // for simplicity
              isDisplayInnerSnapDigit={false}
            />
          )
        }
      </>
    );
  }
);

export default FreeformElementControl;

function toCanonicalStyle(cssStyle: ElementCssStyle, canvasSize: CanvasSize): AT.FreeformLayout.ElementCanonicalStyle {
  const transform = parseTransform(cssStyle.transform);
  const floatCanonicalStyle = {
    width: cssStyle.width,
    height: cssStyle.height,
    x: cssStyle.width / 2 + transform.translateX - canvasSize.width / 2,
    y: cssStyle.height / 2 + transform.translateY - canvasSize.height / 2,
    rotate: transform.rotate
  }
  const canonicalStyle: AT.FreeformLayout.ElementCanonicalStyle = {
    width: Math.round(floatCanonicalStyle.width),
    height: Math.round(floatCanonicalStyle.height),
    x: Math.round(floatCanonicalStyle.x),
    y: Math.round(floatCanonicalStyle.y),
    rotate: Math.round(floatCanonicalStyle.rotate),
  };
  return canonicalStyle;
}

function toCssStyle(canonicalStyle: AT.FreeformLayout.ElementCanonicalStyle, canvasSize: CanvasSize): ElementCssStyle {
  const translateX = canonicalStyle.x + canvasSize.width / 2 - canonicalStyle.width / 2;
  const translateY = canonicalStyle.y + canvasSize.height / 2 - canonicalStyle.height / 2;
  return {
    width: canonicalStyle.width,
    height: canonicalStyle.height,
    transform: `translate(${translateX}px, ${translateY}px) rotate(${canonicalStyle.rotate}deg)`,
  };
}


/** Parse CSS transform string to object */
function parseTransform(transform: string): { translateX: number, translateY: number, rotate: number } {
  const result = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
  };
  // Match translate(xpx, ypx)
  const translateMatch = transform.match(/translate\(\s*([\d.-]+)px\s*,\s*([\d.-]+)px\s*\)/);
  if (translateMatch) {
    result.translateX = parseFloat(translateMatch[1]);
    result.translateY = parseFloat(translateMatch[2]);
  }
  // rotate(...deg|rad)
  const rotateMatch = transform.match(/rotate\(\s*([-+]?\d*\.?\d+)\s*(deg|rad)\s*\)/);
  if (rotateMatch) {
    const value = parseFloat(rotateMatch[1]);
    const unit = rotateMatch[2];
    result.rotate = unit === 'deg' ? value : value * (180 / Math.PI); // convert radians to degrees
  }
  return result;
}

/** A high-performance helper to set CSS styles on a target element */
function setElementStyle(element: HTMLElement, cssStyle: ElementCssStyle) {
  if (element.style.width !== `${cssStyle.width}px`) element.style.width = `${cssStyle.width}px`;
  if (element.style.height !== `${cssStyle.height}px`) element.style.height = `${cssStyle.height}px`;
  if (element.style.transform !== cssStyle.transform) element.style.transform = cssStyle.transform;
}
