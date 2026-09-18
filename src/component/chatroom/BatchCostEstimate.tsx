import { useEffect, useRef, useState } from 'react'
import { Button, Tooltip } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import { chatroomApiPost } from '../../data/chatroom/management'

type Reference = { estimated_cost_usd: string; message_count: number; total_chars: number; inference_count: number }
export default function BatchCostEstimate({ roomId, count, dirty }: { roomId: string; count: number; dirty: boolean }) {
  const [reference, setReference] = useState<Reference | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const version = useRef(0)
  useEffect(() => { version.current++; setReference(null); setError(''); setLoading(false) }, [dirty, roomId])
  if (process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED !== 'true') return null
  const refresh = async () => {
    const current = ++version.current
    setLoading(true)
    try {
      const data = await chatroomApiPost<{ reference: Reference | null }>('/api/getAiConversationCostEstimate', { chatroom_id: roomId })
      if (current === version.current) { setReference(data.reference); setError('') }
    } catch (e) { if (current === version.current) setError((e as Error).message) }
    finally { if (current === version.current) setLoading(false) }
  }
  return <div style={{ marginTop: 16 }}>
    <Tooltip content="Refresh cost estimate"><Button aria-label="Refresh cost estimate" icon={<IconRefresh />} loading={loading} disabled={dirty} onClick={() => void refresh()} /></Tooltip>
    <span style={{ marginLeft: 8 }}>{dirty ? 'Save changes to check a matching reference run.' : reference
      ? `Reference run: $${Number(reference.estimated_cost_usd).toFixed(4)}. Estimated for ${count} new conversations: ~$${(Number(reference.estimated_cost_usd) * count).toFixed(4)}.`
      : 'We recommend running one conversation first to estimate batch cost.'}</span>
    {reference && <div>{reference.message_count} messages, {reference.total_chars} characters, {reference.inference_count} recorded inferences. Approximate provider cost, not a quote or spending limit; actual usage and cache behavior may differ.</div>}
    {error && <div role="alert">{error}</div>}
  </div>
}
