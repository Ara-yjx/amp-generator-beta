import { Button, Divider, Form, Grid, InputNumber, Layout, Modal, Space, Switch, Table, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconCopy, IconDelete, IconEdit, IconPlus } from '@arco-design/web-react/icon';
import { reverse } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AmpTrialHtml, AT, uid as Uid } from '../data/ampTypes';
import { uid } from '../data/uid';
import { DeepPartial, getTrialBackgroundColor } from '../util/util';
import FreeformElementControl from './freeformElementControl';
import FreeformElementInternal, { printDisplaySrc } from './freeformElementInternal';
import FreeformLayersEditor from './freeformLayersEditor';
import FreeformPropertyPanel from './freeformPropertyPanel';
import ATPageResponseConfig from './ATPageResponseConfig';
import { SwapSwitch } from './swapSwitch';


// Using "transform" will cause rendering issues

const { Item } = Form;
const { Content, Sider, Footer, Header } = Layout;
const { Row, Col } = Grid;
const { Text } = Typography;

const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 750;



export interface FreeformEditorProps {
  field: string; // advancedTimeline.pages[${page}].freeformDisplays
  page: number;
}

export default function FreeformEditor({ field, page }: FreeformEditorProps) {
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  const { form } = useFormContext();
  const elementsWatch = useWatch(`${field}.elements`, form) as AT.FreeformLayout.CanvasElementTree | undefined;
  const elementsTableData = elementsWatch?.children?.map(node => ({
    key: node.data?.uid,
    name: node.data?.name,
    displaySrcString: printDisplaySrc(node.data?.displayItem.displaySrc),
  }));

  return (
    <Space align='start'>
      <Button icon={<IconEdit />} type='primary' onClick={() => setIsFullEditorOpen(true)}>Open Editor</Button>
      <div>
        <Table
          data={elementsTableData}
          size='small'
          showHeader={false}
          columns={[{ title: 'Name', dataIndex: 'name' }, { title: 'Display Item', dataIndex: 'displaySrcString' }]}
          scroll={{ y: 200 }}
          pagination={false}
        />
      </div>
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
    </Space>
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
    if (canvasWidthWatch === undefined || canvasHeightWatch === undefined) {
      form.setFieldsValue({
        [`${field}.width`]: DEFAULT_CANVAS_WIDTH,
        [`${field}.height`]: DEFAULT_CANVAS_HEIGHT,
        [`${field}.elements`]: { children: [] } as AT.FreeformLayout.CanvasElementTree,
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
  // Add a layer component-state, so that we can control whether to save the changes
  // Load init values from form
  const elementsWatch = useWatch(`${field}.elements`, form) as AT.FreeformLayout.CanvasElementTree | undefined;
  const [elements, _setElements] = useState<AT.FreeformLayout.ElementDisplayItem[]>(() =>
    elementsWatch?.children?.map(node => node.data).filter((e): e is AT.FreeformLayout.ElementDisplayItem => !!e) ?? []
  );
  const setElements = (newElements: AT.FreeformLayout.ElementDisplayItem[]) => {
    _setElements(newElements);
    // if auto-save
    form.setFieldValue(`${field}.elements.children`, newElements.map(e => ({ data: e })));
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
  const selectedElementField = selectedElement ? `${field}.elements.children[${elements.findIndex(e => e.uid === selectedElement.uid)}].data` : null;
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
  const trialHtmlWatch = useWatch('params.trialHtml', form) as AmpTrialHtml | undefined;

  // Moveable container
  const moveableContainer = useRef<HTMLDivElement>(null);

  const layoutCanvas = (
    // fixed outer, scaled inner
    <div style={{
      width: canvasWidth * scale,
      height: canvasHeight * scale,
      margin: '0px auto',
      backgroundColor: getTrialBackgroundColor(trialHtmlWatch)
    }}>
      <div style={{
        width: `${canvasWidth * scale}px`,
        height: `${canvasHeight * scale}px`,
        // transform: `scale(${scale})`,
        transformOrigin: 'top left',
        border: '1px solid black',
        // marginTop: 20,
        // boxShadow: '0 0 20x 0px rgba(0,0,0,0.6)',
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
                field={`${field}.elements.children[${elementIndex}].data`}
                container={moveableContainer.current}
                containerWidth={canvasWidth}
                containerHeight={canvasHeight}
                scale={scale}
                page={0}
                value={element}
                onChange={updates => updateElement(element, updates)}
                isFocused={selectedElementUids.includes(element.uid)}
                onClick={e => onClickElement(e, element)}
                children={<FreeformElementInternal value={element} />}
              />
            ))
        }
      </div>
    </div>
  );


  return (
    <div ref={ref} style={{ width: '100%' }}>
      <Layout style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        <Header style={{ padding: 10 }}>
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
          {controlPanel}
        </Header >

        <Layout>
          <Sider style={{ width: 280 }}>
            <FreeformLayersEditor elements={elements} setElements={setElements} selectedElementUids={selectedElementUids} setSelectedElementUids={setSelectedElementUids} />
          </Sider>
          <Content style={{ backgroundColor: '#AAA', paddingTop: 20 }}>{layoutCanvas}</Content>
          <Sider style={{ width: 280, overflowY: 'auto' }}>
            <FreeformPropertyPanel page={page} field={selectedElementField} selectedElement={selectedElement} updateElement={updateElement} />
          </Sider>
        </Layout>

        <Footer style={{ maxHeight: 48 }}>
          <Row>
            <Col span={12}>
              <ATPageResponseConfig field={`advancedTimeline.pages[${page}]`} />
            </Col>
            <Col span={12}>
              <SwapSwitch field={`advancedTimeline.pages[${page}].swap`} />
              <Space>
                <Item field={`advancedTimeline.pages[${page}].fitScreen`} triggerPropName='checked' noStyle>
                  <Switch />
                </Item>
                <Text bold>Fit to screen (only in fullscreen mode)</Text>
              </Space>
            </Col>
          </Row>
        </Footer>
      </Layout>

    </div>
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
