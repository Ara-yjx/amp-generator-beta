import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Table, Tag } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import { chatroomApiPost } from '../../data/chatroom/management'
import { aiConversationBatchRoute } from '../../data/chatroom/routes'

interface BatchSummary {
  batch_job_id: string
  chatroom_id: string
  created_at: string
  batch_count: number
  status: string
}
interface HistoryPage { batches: BatchSummary[]; next_cursor?: string | null }

export default function BatchHistory({ roomId, revision = 0 }: { roomId: string; revision?: number }) {
  const [state, setState] = useState<HistoryPage & { roomId: string; error: string; loading: boolean }>({
    roomId, batches: [], error: '', loading: true,
  })
  const generation = useRef(0)
  const load = useCallback(async (cursor?: string) => {
    const request = ++generation.current
    setState(previous => ({ ...previous, roomId, error: '', loading: true,
      batches: previous.roomId === roomId ? previous.batches : [] }))
    try {
      const page = await chatroomApiPost<HistoryPage>('/api/getAiConversationBatches', {
        chatroom_id: roomId, limit: 20, ...(cursor ? { cursor } : {}),
      })
      if (generation.current !== request) return
      setState(previous => {
        const batches = cursor ? [...previous.batches, ...page.batches] : page.batches
        return { roomId, batches: [...new Map(batches.map(batch => [batch.batch_job_id, batch])).values()],
          next_cursor: page.next_cursor, error: '', loading: false }
      })
    } catch (e) {
      if (generation.current === request) setState(previous => ({ ...previous, loading: false,
        error: e instanceof Error ? e.message : 'Unable to load batch history.' }))
    }
  }, [roomId])
  useEffect(() => {
    void load()
    return () => { generation.current++ }
  }, [load, revision])

  const current = state.roomId === roomId ? state : { batches: [], next_cursor: null, error: '', loading: true }
  const columns: ColumnProps<BatchSummary>[] = [
    { title: 'Time', dataIndex: 'created_at', width: 220, render: value => new Date(value).toLocaleString() },
    { title: 'Conversations', dataIndex: 'batch_count', width: 130 },
    { title: 'Status', dataIndex: 'status', width: 150, render: value => <Tag color={
      value === 'completed' ? 'green' : ['failed', 'timed_out', 'validation_failed'].includes(value) ? 'red' : value === 'partial_failure' ? 'orange' : 'blue'
    }>{String(value).replace(/_/g, ' ')}</Tag> },
    { title: 'Details', width: 120, render: (_, row) => <a
      href={`#${aiConversationBatchRoute(roomId, row.batch_job_id)}`} target="_blank" rel="noopener noreferrer">View details</a> },
  ]
  return <section aria-label="Batch history" style={{ marginTop: 28, borderTop: '1px solid #e5e6eb', paddingTop: 16 }}>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>Batch history</h3>
      <Button icon={<IconRefresh />} loading={current.loading} onClick={() => void load()}>Refresh</Button>
    </div>
    {current.error && <Alert type="error" content={current.error} style={{ marginBottom: 12 }} />}
    <Table rowKey="batch_job_id" columns={columns} data={current.batches} loading={current.loading}
      pagination={false} scroll={{ x: 560 }} noDataElement={current.error ? 'History could not be loaded.' : 'No batches yet.'} />
    {current.next_cursor && <Button style={{ marginTop: 12 }} loading={current.loading}
      onClick={() => void load(current.next_cursor ?? undefined)}>Load more</Button>}
  </section>
}
