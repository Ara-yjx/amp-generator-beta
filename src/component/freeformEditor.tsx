/**
 * A simple canvas that allows user to drag and drop elements to create a layout.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Divider, Form, Input, InputNumber, Layout, Modal, Space, Tag, Typography } from '@arco-design/web-react';
import { AT, uid as Uid } from '../data/ampTypes';
import { uid } from '../data/uid';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconCopy, IconDelete, IconPlus, IconSave } from '@arco-design/web-react/icon';
import { reverse, set } from 'lodash';
import { ATLayoutItemSrcSelector } from './advancedTimeline';
import { AcceptedKeys } from './acceptedKeys';
import { createPortal } from 'react-dom';
import FreeformElementControl from './freeformElementControl';
import FreeformLayersEditor from './freeformLayersEditor';


// Using "transform" will cause rendering issues

const { Item } = Form;
const { Text, Title } = Typography;
const { Content, Header, Sider } = Layout;

const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 750;

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;



export interface FreeformEditorProps {
  field: string;
  page: number;
}

export default function FreeformEditor({ field, page }: FreeformEditorProps) {
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsFullEditorOpen(true)}>Open Editor</Button>
      {
        createPortal(
          <Modal
            alignCenter
            style={{ width: '100%', height: '100vh', overflowY: 'hidden' }}
            title={`Page #${page + 1}`}
            footer={null}
            visible={isFullEditorOpen}
            onOk={() => setIsFullEditorOpen(false)}
            onCancel={() => setIsFullEditorOpen(false)}
            autoFocus={false}
            focusLock={true}
          // closeIcon={<Button type='primary' size='mini' icon={<IconSave />} />}
          >
            <FreeformFullEditor field={field} page={page} />
          </Modal>,
          document.body
        )
      }
    </div>
  )
}

export interface FreeformFullEditorProps {
  field: string;
  page: number;
}
export function FreeformFullEditor({ field, page }: FreeformFullEditorProps) {
  // Canvas size
  const { form } = useFormContext();
  const canvasWidthWatch = (useWatch(`${field}.width`, form) as number | undefined);
  const canvasHeightWatch = (useWatch(`${field}.height`, form) as number | undefined);
  useEffect(() => {
    if (canvasWidthWatch === undefined && canvasHeightWatch === undefined) {
      form.setFieldsValue({
        [`${field}.width`]: DEFAULT_CANVAS_WIDTH,
        [`${field}.height`]: DEFAULT_CANVAS_HEIGHT,
      });
    }
  }, [canvasWidthWatch, canvasHeightWatch]);
  const canvasWidth = canvasWidthWatch ?? DEFAULT_CANVAS_WIDTH;
  const canvasHeight = canvasHeightWatch ?? DEFAULT_CANVAS_HEIGHT;

  const [originString, setOriginString] = useState<any>();

  const [selectedElementUids, setSelectedElementUids] = useState<Uid[]>([]);


  // Resize editor to fit container
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement>(null)
  // const resize = useDebounceCallback((containerSize: { width?: number }) => {
  //   if (containerSize.width) {
  //     console.log('resize', containerSize.width, canvasWidth);
  //     setScale(Math.min(1, containerSize.width / canvasHeight));
  //   }
  // }, 100);
  // useResizeObserver({
  //   ref,
  //   onResize: resize,
  // });
  // useEffect(() => {
  //   resize({ width: ref.current?.clientWidth });
  // }, [canvasWidth, canvasHeight]);


  // Elements
  // add a layer component-state, so that we can control whether to save the changes
  const [elements, _setElements] = useState<AT.FreeformLayout.ElementDisplayItem[]>([]);
  const setElements = (newElements: AT.FreeformLayout.ElementDisplayItem[]) => {
    console.log('setElements', JSON.stringify(newElements));
    _setElements(newElements);
    // if auto-save
    form.setFieldValue(`${field}.children`, newElements);
  };
  const addElement = (element: AT.FreeformLayout.ElementDisplayItem) => {
    const newElements = [element, ...elements]; // add at top
    setElements(newElements);
  };
  const removeElements = (uids: number[]) => {
    const newElements = elements.filter(e => !uids.includes(e.uid));
    setElements(newElements);
  };
  const cloneElement = (element: AT.FreeformLayout.ElementDisplayItem): AT.FreeformLayout.ElementDisplayItem => {
    const newElement = { ...element, uid: uid(), name: `${element.name} copy` };
    // add to above the original element
    const indexOfCloned = elements.findIndex(e => e.uid === element.uid);
    const newElements = [...elements];
    newElements.splice(indexOfCloned, 0, newElement);
    setElements(newElements);
    return newElement;
  };
  const updateElement = (element: AT.FreeformLayout.ElementDisplayItem, updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => {
    const updatedElement = mergeOverrideArray(element, updates) as AT.FreeformLayout.ElementDisplayItem;
    const newElements = elements.map(e => e.uid === element.uid ? updatedElement : e);
    setElements(newElements);
  };



  // Focus
  const onClickElement = (e: React.MouseEvent<Element, MouseEvent>, element: AT.FreeformLayout.ElementDisplayItem) => {
    setSelectedElementUids([element.uid]);
    e.stopPropagation();
  };
  const selectedElements = elements.filter(e => selectedElementUids.includes(e.uid));
  const selectedElement: AT.FreeformLayout.ElementDisplayItem | null =
    (selectedElements.length === 1 && Object.hasOwn(selectedElements[0], 'displayItem')) ?
      (selectedElements[0] as AT.FreeformLayout.ElementDisplayItem)
      :
      null;
  // TODO: update when we have tree-shape elements
  const selectedElementField = selectedElement ? `${field}.children[${elements.findIndex(e => e.uid === selectedElement.uid)}]` : null;
  const selectedElementControlRef = useRef<{ updateRect: () => void }>(null);

  // Control panel
  const onClickAddElement = () => {
    const newElementUid = uid();
    addElement({
      uid: newElementUid,
      name: `Element ${newElementUid}`,
      boxStyle: {
        x: 0,
        y: 0,
        width: 250,
        height: 250,
        rotate: 0,
      },
      displayItem: {
        displaySrc: ['blank'],
        swap: false,
        bindKeyboard: [],
        mouseClick: false,
        mouseClickAccuratePoint: false,
      },
    });
    // focus on the new element
    setSelectedElementUids([newElementUid]);
  };

  const onClickDeleteElement = () => {
    if (selectedElementUids.length) {
      removeElements(selectedElementUids);
      // Select next element, so that user can click delete repeatedly
      const firstUid = selectedElementUids[0];
      const firstIndex = elements.findIndex(e => e.uid === firstUid);
      const nextElement = elements.slice(firstIndex + 1).find(e => e.uid !== firstUid)
        ?? elements.slice(0, firstIndex).reverse().find(e => e.uid !== firstUid);
      setSelectedElementUids(nextElement ? [nextElement.uid] : []);
    }
  };

  const onClickCloneElement = () => {
    if (selectedElement) {
      const newElement = cloneElement(selectedElement);
      // focus on the new element
      setSelectedElementUids([newElement.uid]);
    }
  }

  const controlPanel = (
    <div>
      <Space>
        <Button icon={<IconPlus />} type='primary' onClick={onClickAddElement} />
        <Button icon={<IconCopy />} onClick={onClickCloneElement} />
        <Button icon={<IconDelete />} status='danger' onClick={onClickDeleteElement} />
        {/* <Button onClick={() => setSelectedElementUids([])}>Clear</Button> */}
      </Space>
    </div>
  );


  const elementDisplayItems: AT.FreeformLayout.ElementDisplayItem[] = elements as AT.FreeformLayout.ElementDisplayItem[];

  // Moveable container
  const moveableContainer = useRef<HTMLDivElement>(null);

  const layoutCanvas = (
    // fixed outer, scaled inner
    <div style={{
      width: canvasWidth * scale,
      height: canvasHeight * scale,
      margin: '0px auto',
    }}>
      <div style={{
        width: `${canvasWidth * scale}px`,
        height: `${canvasHeight * scale}px`,
        // transform: `scale(${scale})`,
        transformOrigin: 'top left',
        border: '1px solid black',
        boxSizing: 'border-box',
        position: 'relative',
      }}
        ref={moveableContainer}
        onClick={() => setSelectedElementUids([])}
      >
        {
          reverse([...elementDisplayItems]) // TODO: upgrade and use native .toReversed()
            .map((element, elementIndex) => (
              <FreeformElementControl
                ref={element.uid === selectedElement?.uid ? selectedElementControlRef : null}
                setOriginString={setOriginString}
                key={element.uid}
                field={`${field}.children[${elementIndex}]`}
                container={moveableContainer.current}
                containerWidth={canvasWidth}
                containerHeight={canvasHeight}
                scale={scale}
                page={0}
                value={element}
                onChange={updates => updateElement(element, updates)}
                isFocused={selectedElementUids.includes(element.uid)}
                onClick={e => onClickElement(e, element)}
              />
            ))
        }
      </div>
    </div>
  );


  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div>
        <Space>
          <Item label='Width' field={`${field}.width`} layout='inline'>
            <InputNumber suffix='px' />
          </Item>
          <Item label='Height' field={`${field}.height`} layout='inline'>
            <InputNumber suffix='px' />
          </Item>
          <Item label='Editor zoom:' layout='inline'>
            <span>{(scale * 100).toFixed(0)}%</span>
          </Item>
        </Space>
      </div>
      {controlPanel}
      <Divider />

      <Layout style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        <Sider style={{ width: 280 }}>
          {/* {elementDisplayItems.map(el => <div>{el.name}</div>)} */}
          <FreeformLayersEditor elements={elements} setElements={setElements} selectedElementUids={selectedElementUids} setSelectedElementUids={setSelectedElementUids} />
        </Sider>
        <Content>{layoutCanvas}</Content>
        <Sider style={{ width: 280, overflowY: 'auto' }}>
          <PropertyPanel page={page} field={selectedElementField} selectedElement={selectedElement} updateElement={updateElement} />
        </Sider>
      </Layout>

    </div>
  );
}


interface PropertyPanelProps {
  page: number;
  field: string | null;
  selectedElement: AT.FreeformLayout.ElementDisplayItem | null;
  updateElement: (element: AT.FreeformLayout.ElementDisplayItem, updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void;
}

function PropertyPanel({ page, field, selectedElement, updateElement }: PropertyPanelProps) {
  const { form } = useFormContext();
  const thisPageWatch = useWatch(`advancedTimeline.pages[${page}]`, form) as AT.Page;

  if (selectedElement === null || field === null) {
    return null;
  }

  const displayItemField = `${field}.displayItem`;


  return (

    <Space direction='vertical' style={{ width: '100%', padding: 20, boxSizing: 'border-box' }}>

      <Title heading={6}>Name</Title>
      <Input value={selectedElement.name} onChange={v => selectedElement && updateElement(selectedElement, { name: v })} />

      <Divider />

      <Title heading={6}>Layout</Title>
      <Form layout='horizontal' labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} >
        <Item label='Width'>
          <InputNumber value={selectedElement?.boxStyle.width} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { width: v } })} />
        </Item>
        <Item label='Height' >
          <InputNumber value={selectedElement?.boxStyle.height} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { height: v } })} />
        </Item>
        <Item label='x'>
          <InputNumber value={selectedElement?.boxStyle.x} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { x: v } })} />
        </Item>
        <Item label='y'>
          <InputNumber value={selectedElement?.boxStyle.y} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { y: v } })} />
        </Item>
        <Item label='Rotate'>
          <InputNumber value={selectedElement?.boxStyle.rotate} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { rotate: v } })} suffix='°' />
        </Item>
      </Form>

      <Divider />

      <Title heading={6}>Stimuli Item</Title>

      <Item field={`${displayItemField}.displaySrc`} noStyle>
        <ATLayoutItemSrcSelector pageIndex={page} value={selectedElement.displayItem.displaySrc} onChange={v => { console.log('ATLayoutItemSrcSelector', v); updateElement(selectedElement, { displayItem: { displaySrc: v } }) }} />
      </Item>
      {
        thisPageWatch.swap && (
          <Item field={`${displayItemField}.swap`} triggerPropName='checked' noStyle>
            <Checkbox>Swappable</Checkbox>
          </Item>
        )
      }
      {
        thisPageWatch.swap && thisPageWatch.response.keyboard.enabled && (
          <Space>
            <Text>Bind keys</Text>
            <Item field={`${displayItemField}.bindKeyboard`} noStyle>
              <AcceptedKeys />
            </Item>
          </Space>
        )
      }
      {
        thisPageWatch.response.mouseClick.enabled && (
          <Space>
            <Item field={`${displayItemField}.mouseClick`} triggerPropName='checked' noStyle>
              <Checkbox>Clickable</Checkbox>
            </Item>
            <Item field={`${displayItemField}.mouseClickAccuratePoint`} triggerPropName='checked' noStyle>
              <Checkbox>Add accurate point</Checkbox>
            </Item>
          </Space>
        )
      }

    </Space>

  );

}


type Plain = Record<string, any>;
const isObj = (x: unknown): x is Plain =>
  x !== null && typeof x === "object" && !Array.isArray(x);
/**
 * Deep-merge `b` into `a` (lodash.merge-like),
 * but arrays are **replaced** (not merged).
 * Returns a new object; `a` and `b` are not mutated.
 */
export function mergeOverrideArray<A extends Plain, B extends Plain>(a: A, b: B): A & B {
  const out: Plain = { ...a };
  for (const key of Object.keys(b)) {
    const aVal = (a as Plain)[key];
    const bVal = b[key];
    if (Array.isArray(bVal)) {
      out[key] = bVal.slice(); // replace arrays
    } else if (isObj(bVal)) {
      out[key] = mergeOverrideArray(isObj(aVal) ? aVal : {}, bVal);
    } else {
      out[key] = bVal; // primitives (incl. undefined) just override
    }
  }
  return out as A & B;
}

// export function flattenElementDisplayItems(tree: AT.FreeformLayout.CanvasElementTree): AT.FreeformLayout.ElementDisplayItem[] {
//   return traverseTreeStrict<never, AT.FreeformLayout.ElementDisplayItem, AT.FreeformLayout.ElementDisplayItem[]>(
//     tree as TreeNode<never, AT.FreeformLayout.ElementDisplayItem>,
//     {
//       onVisitLeaf: data => [data],
//       onVisitBranch: (data, children) => children.flat(),
//     }
//   );
// }
