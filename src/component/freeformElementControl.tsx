import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import Moveable from 'react-moveable';
import { AT } from '../data/ampTypes';
import { DeepPartial } from '../util/util';


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

const SNAPPED_ELEMENT_CLASSNAME = 'freeform-moveable-element-snapped';

export interface FreeformElementControlRef {
  updateRect: () => void;
}

export interface FreeformElementControlProps {
  container: HTMLDivElement | null,
  containerWidth: number,
  containerHeight: number,

  value: AT.FreeformLayout.ElementDisplayItem,
  onChange: (updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void,

  isFocused: boolean,
  onClick: React.MouseEventHandler,
  scale: number,

  children: React.ReactNode,
}

export const FreeformElementControl = forwardRef<FreeformElementControlRef, FreeformElementControlProps>(
  ({ container, containerWidth, containerHeight, value, onChange, isFocused, onClick, scale, children }, ref) => {

    // Basically, React will only render to create the element
    //   and the position will be updated by Moveable callback (on update) and useEffect (first render + after rounding)
    // This is because 
    //   1) Moveable is designed to be a passive/uncontrolled component
    //   2) avoiding re-rendering can improve performance

    const targetRef = useRef<HTMLDivElement>(null);
    const moveableRef = useRef<Moveable>(null);

    const canvasSize = { width: containerWidth, height: containerHeight };
    const cssStyle = toCssStyle(value.boxStyle, canvasSize);

    // Expose updateRect
    useImperativeHandle(ref, () => {
      return {
        updateRect() {
          moveableRef.current?.updateRect()
        },
      };
    }, []);

    // Apply style after the first render and after rounding for each update
    useLayoutEffect(() => {
      if (targetRef.current) {
        targetRef.current.style.width = `${cssStyle.width}px`;
        targetRef.current.style.height = `${cssStyle.height}px`;
        targetRef.current.style.transform = cssStyle.transform;
      }
    }, [targetRef.current]);

    // Need to updateRect once get focused
    useEffect(() => {
      isFocused && targetRef.current && moveableRef.current?.updateRect();
    }, [isFocused, targetRef.current, moveableRef.current]);

    return (
      <>
        <div
          ref={targetRef} 
          className={isFocused ? undefined : SNAPPED_ELEMENT_CLASSNAME} // Moveable bug: self will snap to self
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

              onRender={e => {
                // Moveable is designed to be a passive/uncontrolled component
                // We must first apply the updated style (w/h/transform) from e.cssText
                // And then read the style from target and convert to canonical style
                // Finally, we need to re-update the target style after rounding
                e.target.style.cssText += e.cssText;
                const canonicalStyle = toCanonicalStyle({
                  width: Number(e.target.style.width.replace('px', '')),
                  height: Number(e.target.style.height.replace('px', '')),
                  transform: e.target.style.transform ?? '',
                }, canvasSize);
                const roundedCssStyle = toCssStyle(canonicalStyle, canvasSize);
                if (e.target.style.width !== `${roundedCssStyle.width}px`) e.target.style.width = `${roundedCssStyle.width}px`;
                if (e.target.style.height !== `${roundedCssStyle.height}px`) e.target.style.height = `${roundedCssStyle.height}px`;
                if (e.target.style.transform !== roundedCssStyle.transform) e.target.style.transform = roundedCssStyle.transform;
                onChange({ boxStyle: canonicalStyle });
              }}

              onRenderEnd={e => e.moveable.updateRect()} // make sure the rect has no gap due to rounding

              snappable={true}
              snapRotationDegrees={[0, 90, 180, 270]}
              snapRotationThreshold={5}
              snapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
              verticalGuidelines={[0, containerWidth / 2, containerWidth]}
              horizontalGuidelines={[0, containerHeight / 2, containerHeight]}
              elementSnapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
              elementGuidelines={[`.${SNAPPED_ELEMENT_CLASSNAME}`]}
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
