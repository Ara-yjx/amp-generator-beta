import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
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


export interface FreeformElementControlRef {
  updateRect: () => void;
}

export interface FreeformElementControlProps {
  setOriginString?: (originString: any) => void,

  container: HTMLDivElement | null,
  containerWidth: number,
  containerHeight: number,

  field: string,
  page: number,

  value: AT.FreeformLayout.ElementDisplayItem,
  onChange: (updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void,

  isFocused: boolean,
  onClick: React.MouseEventHandler,
  scale: number,

  children: React.ReactNode,
}

export const FreeformElementControl = forwardRef<FreeformElementControlRef, FreeformElementControlProps>(
  ({ container, containerWidth, containerHeight, field, page, value, onChange, isFocused, onClick, scale, children }, ref) => {
    const targetRef = useRef<HTMLDivElement>(null);
    const moveableRef = useRef<Moveable>(null);

    const cssStyle = toCssStyle(value.boxStyle, { width: containerWidth, height: containerHeight });

    // Expose updateRect
    useImperativeHandle(ref, () => {
      return {
        updateRect() {
          moveableRef.current?.updateRect()
        },
      };
    }, []);

    // Need to updateRect once get focused
    useEffect(() => {
      isFocused && targetRef.current && moveableRef.current?.updateRect();
    }, [isFocused, targetRef.current, moveableRef.current, JSON.stringify(cssStyle)]);

    return (
      <>
        <div style={{ position: 'absolute', left: -80, opacity: 0.85 }}>
        </div>
        <div ref={targetRef} style={{
          position: 'absolute',

          width: cssStyle.width,
          height: cssStyle.height,
          transform: cssStyle.transform,
          // zIndex: value.boxStyle.z,

          border: '1px solid black',
          boxSizing: 'border-box',
          backgroundColor: 'lightyellow',

          overflow: 'hidden'
        }}
          onClick={onClick}
        >
          <div style={{ padding: '0 10px' }}>
            {children}
          </div>
        </div>
        {
          isFocused && (
            <Moveable
              ref={moveableRef}
              target={targetRef}
              container={container}
              origin={true}
              draggable={true}
              resizable={true}
              rotatable={true}

              onRender={e => {
                // Need to do this first so that we can then read w/h/transform from target style object
                e.target.style.cssText += e.cssText;

                const canonicalStyle = toCanonicalStyle({
                  width: Number(e.target.style.width.replace('px', '')),
                  height: Number(e.target.style.height.replace('px', '')),
                  transform: e.target.style.transform ?? '',
                }, { width: containerWidth, height: containerHeight });


                onChange({ boxStyle: canonicalStyle });
              }}


              snappable={true}
              // snapGridWidth={20}
              // snapGridHeight={20}
              snapRotationDegrees={[0]}
              snapRotationThreshold={5}
              snapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
              elementSnapDirections={{ "top": true, "left": true, "bottom": true, "right": true, "center": true, "middle": true }}
            // throttle={100}
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
    transform: `translate(${translateX}px, ${translateY}px) rotate(${canonicalStyle.rotate}degree)`,
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

