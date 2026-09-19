import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import {
  Alert, Button, Descriptions, Message, Space, Spin, Table, Tag, Typography, Tooltip,
} from '@arco-design/web-react'
import { IconArrowLeft, IconDownload, IconRefresh } from '@arco-design/web-react/icon'
import { chatroomDetailRoute } from '../../data/chatroom/routes'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import { chatroomApiPost } from '../../data/chatroom/management'
import { waitForBatchDownload } from '../../data/chatroom/downloadBatch'

const { Paragraph, Text } = Typography
const TERMINAL = new Set(['completed', 'partial_failure', 'failed', 'timed_out', 'validation_failed'])

interface ConversationSummary {
  conversation_id: string
  batch_index: number
  status: string
  message_count?: number
  total_chars?: number
  last_error?: string
  reconciliation_pending?: boolean
}

interface BatchDetail {
  usage?: { input_tokens: number; output_tokens: number; estimated_cost_usd: string; inference_count: number }
  last_error?: string
  batch_job_id: string
  chatroom_id: string
  status: string
  batch_count: number
  queued_count: number
  running_count: number
  unfinished_count: number
  completed_count: number
  failed_count: number
  timed_out_count: number
  created_at: string
  deadline_at: number
  export_status: string
  conversations: ConversationSummary[]
  reconciliation_pending?: boolean
}

interface HistoryEvent {
  event_key: string
  type: string
  sender?: string
  internal_name?: string
  content: string
  timestamp: number
}

interface HistoryResponse {
  events: HistoryEvent[]
  next_after?: string
  has_more: boolean
}

function statusColor(status: string): string {
  if (status === 'completed') return 'green'
  if (status === 'failed' || status === 'timed_out' || status === 'validation_failed') return 'red'
  if (status === 'partial_failure') return 'orange'
  return 'blue'
}

export default function AiConversationBatch() {
  const { batchId = '' } = useParams<{ batchId: string }>()
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const downloadRequest = useRef<AbortController | null>(null)
  useEffect(() => {
    setExporting(false)
    return () => { downloadRequest.current?.abort(); downloadRequest.current = null }
  }, [batchId])
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loadError, setLoadError] = useState('')

  const fetchBatch = useCallback(async () => {
    try {
      const value = await chatroomApiPost<BatchDetail>(`/api/getAiConversationBatch/${batchId}`, {
        offset: 0, limit: 100,
      })
      setBatch(value)
      const first = value.conversations?.[0]?.conversation_id
      if (first) setSelectedConversationId((current) => current || first)
      setLoadError('')
      return value
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load batch')
      throw error
    }
  }, [batchId])

  useEffect(() => {
    let cancelled = false
    let timeout: number | undefined
    const poll = async () => {
      if (cancelled) return
      try {
        const value = await fetchBatch()
        if (!cancelled && (!TERMINAL.has(value.status) || value.reconciliation_pending || ['requested', 'building'].includes(value.export_status))) {
          timeout = window.setTimeout(poll, 3000)
        }
      } catch {
        // fetchBatch preserves the error on the page until a successful refresh.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void poll()
    return () => { cancelled = true; window.clearTimeout(timeout) }
  }, [fetchBatch])

  useEffect(() => {
    setEvents([])
  }, [selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return
    let cancelled = false
    let cursor: string | undefined
    let timeout: number | undefined
    const poll = async () => {
      if (cancelled) return
      try {
        const value = await chatroomApiPost<HistoryResponse>(
          `/api/getAiConversationHistory/${selectedConversationId}`,
          {
            after: cursor, limit: 200,
          },
        )
        if (cancelled) return
        if (value.events.length) {
          setEvents((current) => {
            const seen = new Set(current.map((event) => event.event_key))
            return [...current, ...value.events.filter((event) => !seen.has(event.event_key))]
          })
        }
        cursor = value.next_after
      } catch (error: unknown) {
        if (!cancelled) Message.error(error instanceof Error ? error.message : 'Failed to load history')
      }
      if (!cancelled) {
        timeout = window.setTimeout(poll, 2000)
      }
    }
    void poll()
    return () => { cancelled = true; window.clearTimeout(timeout) }
    // Restart only when the selected conversation changes. The local cursor is
    // intentionally owned by this polling loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId])

  const requestExport = async () => {
    if (downloadRequest.current) return
    const request = new AbortController()
    downloadRequest.current = request
    setExporting(true)
    try {
      const url = await waitForBatchDownload(batchId, request.signal)
      if (request.signal.aborted) return
      const link = document.createElement('a')
      link.href = url
      link.download = 'conversation-data.zip'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error: unknown) {
      if (!request.signal.aborted) Message.error(error instanceof Error ? error.message : 'Failed to download conversation data. Please try again.')
    } finally {
      if (downloadRequest.current === request) {
        downloadRequest.current = null
        setExporting(false)
      }
    }
  }

  const columns = useMemo<ColumnProps<ConversationSummary>[]>(() => [
    { title: '#', dataIndex: 'batch_index', width: 70, render: (value) => Number(value) + 1 },
    {
      title: 'Status', dataIndex: 'status', width: 140,
      render: (value, row) => row.reconciliation_pending
        ? <Tag color="orange">Finalizing</Tag>
        : <Tag color={statusColor(String(value))}>{String(value)}</Tag>,
    },
    { title: 'Messages', dataIndex: 'message_count', width: 100 },
    { title: 'Characters', dataIndex: 'total_chars', width: 110 },
    { title: 'Error', dataIndex: 'last_error', ellipsis: true },
  ], [])

  if (loading && !batch) return <Spin style={{ display: 'block', margin: '80px auto' }} />
  if (!batch) return <div style={{ padding: 24 }}>
    <Alert type="error" content={loadError || 'Batch not found'} />
    <Tooltip content="Refresh"><Button aria-label="Refresh" icon={<IconRefresh />} onClick={() => void fetchBatch().catch(() => undefined)} /></Tooltip>
  </div>

  return (
    <div className="chatroom-page" style={{ padding: 24, maxWidth: 1120, margin: '0 auto', textAlign: 'left' }}>
      <Button icon={<IconArrowLeft />} href={`#${chatroomDetailRoute(batch.chatroom_id)}`} style={{ marginBottom: 16 }}>
        Back to chatroom
      </Button>
      {loadError && <Alert type="error" content={loadError} style={{ marginBottom: 16 }} />}
      {batch.status === 'validation_failed' && <Alert type="error" content={batch.last_error || 'Batch validation failed; no conversations were created.'} style={{ marginBottom: 16 }} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>AI Conversation Batch</h2>
          <Text type="secondary">{batch.batch_job_id}</Text>
        </div>
        <Space>
          <Tooltip content="Refresh"><Button aria-label="Refresh" icon={<IconRefresh />} onClick={() => void fetchBatch().catch(() => undefined)} /></Tooltip>
            <Button
              type="primary"
              icon={<IconDownload />}
              loading={exporting}
              disabled={!TERMINAL.has(batch.status) || batch.status === 'validation_failed' || batch.reconciliation_pending}
              onClick={() => void requestExport()}
            >
              Download conversation data
            </Button>
        </Space>
      </div>

      <Descriptions
        style={{ marginTop: 24 }}
        column={{ xs: 1, sm: 2, md: 4 }}
        data={[
          { label: 'Status', value: <Tag color={statusColor(batch.status)}>{batch.status.replace(/_/g, ' ')}</Tag> },
          { label: 'Total', value: batch.batch_count },
          { label: 'Completed', value: batch.completed_count },
          { label: 'Failed', value: batch.failed_count + batch.timed_out_count },
          { label: 'Running', value: batch.running_count },
          { label: 'Queued', value: batch.queued_count },
          { label: 'Started', value: new Date(batch.created_at).toLocaleString() },
          { label: 'Deadline', value: new Date(batch.deadline_at).toLocaleString() },
          { label: 'Input tokens', value: batch.usage?.input_tokens.toLocaleString() ?? 'Unavailable' },
          { label: 'Output tokens', value: batch.usage?.output_tokens.toLocaleString() ?? 'Unavailable' },
          { label: 'Approx. cost (USD)', value: batch.usage ? `$${Number(batch.usage.estimated_cost_usd).toFixed(6)}` : 'Unavailable' },
          { label: 'Recorded inferences', value: batch.usage?.inference_count.toLocaleString() ?? 'Unavailable' },
        ]}
      />

      <Text type="secondary">Recorded usage includes silent and discarded responses. Estimated provider cost, not the final bill; recently completed inferences may take time to appear.</Text>

      <h3 style={{ marginTop: 32 }}>Conversations</h3>
      <Table
        rowKey="conversation_id"
        columns={columns}
        data={batch.conversations}
        pagination={false}
        scroll={{ x: 600 }}
        rowClassName={(record) => record.conversation_id === selectedConversationId ? 'arco-table-tr-checked' : ''}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => setSelectedConversationId(record.conversation_id),
        })}
      />

      <h3 style={{ marginTop: 32 }}>Conversation History</h3>
      {events.length === 0 ? (
        <Text type="secondary">{batch.status === 'validation_failed' ? 'No conversations were created.' : 'Waiting for messages...'}</Text>
      ) : events.map((event) => (
        <div key={event.event_key} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Text bold>{event.type === 'message' ? event.sender : 'System'}</Text>
          {event.internal_name && <Text type="secondary"> ({event.internal_name})</Text>}
          <Paragraph style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{event.content}</Paragraph>
        </div>
      ))}
    </div>
  )
}
