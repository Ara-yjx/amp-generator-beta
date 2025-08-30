import { AT } from "../data/ampTypes";
import { Table } from '@arco-design/web-react';
import { IconDragDotVertical } from '@arco-design/web-react/icon';
import { arrayMove, SortableContainer, SortableElement, SortableHandle, SortEvent } from 'react-sortable-hoc';


export default function FreeformLayersEditor({
  elements,
  setElements,
  selectedElementUids,
  setSelectedElementUids
}: {
  elements: AT.FreeformLayout.ElementDisplayItem[];
  setElements: (elements: AT.FreeformLayout.ElementDisplayItem[]) => void;
  selectedElementUids: number[];
  setSelectedElementUids: (uids: number[]) => void;
}) {
  // const [data, setData] = useState(() => range(50).map(i => ({ key: `${i}`, name: `Layer ${i + 1}` })));

  const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMove([...elements], oldIndex, newIndex).filter((el) => !!el);
      setElements(newData);
    }
  }
  return (
    <DragAndDropTree
      value={elements.map((el, index) => ({ key: `${el.uid}`, name: `${el.name}` }))}
      onSortEnd={onSortEnd}
      renderCell={String}
      selectedRowKeys={selectedElementUids.map(String)}
      onSelectedRowKeysChange={keys => setSelectedElementUids(keys.map(k => typeof k === 'string' ? parseInt(k) : k))}
      onClickRow={(row, rowIndex) => {
        console.log('onClickRow', row, rowIndex);
        setSelectedElementUids([typeof row.key === 'string' ? parseInt(row.key) : row.key]);
      }}
    />
  );
}


///////////////////////////// Below is an independent tree component


const DragHandle = SortableHandle(() => (
  <IconDragDotVertical
    style={{
      cursor: 'move',
      color: '#555',
    }}
  />
));
const SortableWrapper = SortableContainer((props: any) => {
  return <tbody {...props} />;
});
const SortableItem = SortableElement((props: any) => {
  return <tr {...props} />;
});

/**
 * Supported features:
 * - Tree structure (start with 1 layer)
 * - Drop indicator for tree structure
 * - Inform inner component about drag state
 * - onChange emit diff+full 
 */
type DragAndDropTreeData = { name: string, key: string }[];
interface DragAndDropTreeProps {
  value: DragAndDropTreeData; // tree root's children
  // onChange: (newValue: TreeData) => void;
  renderCell: (cellData: any, rowIndex: number) => React.ReactNode;
  selectedRowKeys: string[]; // controlled selected keys
  onSelectedRowKeysChange: (keys: string[]) => void;
  onSortEnd?: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
  onClickRow: (row: any, rowIndex: number) => void;
}

function DragAndDropTree<T>({ value, onSortEnd, renderCell, selectedRowKeys, onSelectedRowKeysChange, onClickRow }: DragAndDropTreeProps) {
  const DraggableContainer = (props: any) => (
    <SortableWrapper
      useDragHandle
      onSortStart={(payload, e) => e.preventDefault()} // prevent text selection
      onSortEnd={onSortEnd}
      helperContainer={() => document.querySelector('.arco-drag-table-container-2 table tbody')}
      updateBeforeSortStart={({ node }) => {
        const tds = node.querySelectorAll('td');
        tds.forEach((td) => {
          td.style.width = td.clientWidth + 'px';
        });
      }}
      {...props}
    />
  );

  const DraggableRow = (props: any) => {
    const { record, index, ...rest } = props;
    return <SortableItem index={index} {...rest} />;
  };

  return (
    <Table
      className='arco-drag-table-container-2'
      showHeader={false}
      pagination={false}
      components={{
        header: {
          operations: ({ selectionNode, expandNode }) => [
            {
              node: <th />,
              width: 20,
            },
            // {
            //   name: 'expandNode',
            //   node: expandNode,
            // },
            {
              name: 'selectionNode',
              node: selectionNode,
            },
          ],
        },
        body: {
          operations: ({ selectionNode, expandNode }) => [
            {
              node: (
                <td>
                  <div className='arco-table-cell'>
                    <DragHandle />
                  </div>
                </td>
              ),
              width: 20,
            },
            // {
            //   name: 'expandNode',
            //   node: expandNode,
            // },
            {
              name: 'selectionNode',
              node: selectionNode,
            },
          ],
          tbody: DraggableContainer,
          row: DraggableRow,
        },
      }}
      // @ts-ignore
      data={value}
      columns={[{
        title: 'Name',
        dataIndex: 'name',
        render: renderCell,
      }]}
      onRow={(record, index) => ({
        onClick: () => onClickRow(record, index)
      })}
      rowSelection={{
        // type: 'checkbox',
        type: 'radio',
        checkStrictly: false,
        selectedRowKeys: selectedRowKeys,
        onChange: (selectedRowKeys, selectedRows) => {
          console.log('onChange', selectedRowKeys, selectedRows);
          onSelectedRowKeysChange(selectedRowKeys.map(String));
        },
        onSelect: (selected, record, selectedRows) => {
          console.log('onSelect:', selected, record, selectedRows);
        },
        columnWidth: 20,
      }}

    />
  );
}