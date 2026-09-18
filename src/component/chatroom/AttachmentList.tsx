import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Checkbox, Message, Modal, Spin, Tooltip } from '@arco-design/web-react'
import { IconAttachment, IconClose, IconDownload, IconUpload, IconUp, IconDown, IconRefresh } from '@arco-design/web-react/icon'
import { chatroomApiPost } from '../../data/chatroom/management'
import { apiUploadAt } from '../../data/backend'
import { CHATROOM_MANAGEMENT_API_BASE } from '../../data/chatroom/config'
import { AiPersonaSetting } from '../../data/chatroom/chatroomSetting'

type Asset = { id: string; original_name: string; byte_size: number; format: string }
type Capabilities = { enabled: boolean; models: string[]; file_limits: Record<string, number> }

export function attachmentModelError(model: string, personas: AiPersonaSetting[], caps?: Capabilities): string {
  if (!caps) return ''
  if (!caps.enabled) return 'Prompt attachments are unavailable on this endpoint.'
  if (!model) return ''
  const unsupported = [...new Set([model, ...personas.map(p => p.model_id || model)].filter(m => !caps.models.includes(m)))]
  if (unsupported.length) {
    return `All chatroom and persona models must support attachments. Unavailable: ${unsupported.join(', ')}.`
  }
  return ''
}

export function useAttachmentLibrary(roomId?: string) {
  const visible = process.env.REACT_APP_CHATROOM_ATTACHMENTS_ENABLED === 'true'
  const [state, setState] = useState<{
    roomId?: string; assets: Asset[]; caps?: Capabilities; error: string; loading: boolean
  }>({ assets: [], error: '', loading: true })
  const generation = useRef(0)
  const refresh = useCallback(async () => {
    if (!visible || !roomId) return
    const current = ++generation.current
    setState(previous => ({ roomId, assets: previous.roomId === roomId ? previous.assets : [],
      caps: previous.roomId === roomId ? previous.caps : undefined, error: '', loading: true }))
    try {
      const capabilities = await chatroomApiPost<Capabilities>('/api/getPromptAttachmentCapabilities')
      if (generation.current !== current) return
      setState(previous => ({ ...previous, caps: capabilities }))
      const result = capabilities.enabled
        ? await chatroomApiPost<{ assets: Asset[] }>('/api/getPromptAssets', { chatroom_id: roomId })
        : { assets: [] }
      if (generation.current === current) {
        setState({ roomId, caps: capabilities, assets: result.assets, error: '', loading: false })
      }
    } catch (e) {
      if (generation.current === current) setState(previous => ({ ...previous, error: (e as Error).message, loading: false }))
    }
  }, [roomId, visible])
  useEffect(() => {
    void refresh()
    return () => { generation.current++ }
  }, [refresh])
  // Never render another room's cached capabilities or assets, even before effects run.
  const current = state.roomId === roomId && visible ? state : { assets: [], caps: undefined, error: '', loading: true }
  return { ...current, loading: !!roomId && visible && current.loading, refresh, roomId, visible }
}

export type AttachmentLibrary = ReturnType<typeof useAttachmentLibrary>

export default function AttachmentList({ value = [], onChange, library, modelError }: {
  value?: string[]; onChange?: (value: string[]) => void; library: AttachmentLibrary; modelError: string
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  if (!library.visible) return null
  const busy = library.loading || uploading
  const blocked = busy || !library.caps?.enabled || !!library.error || !!modelError
  const error = library.error || (!library.loading ? modelError : '')
  const name = (id: string) => library.assets.find(a => a.id === id)?.original_name
    || (library.loading ? 'Loading attachment...' : library.error ? 'Attachment details unavailable' : 'Unavailable attachment')
  const download = async (id: string) => {
    const tab = window.open('about:blank', '_blank')
    if (tab) tab.opener = null
    try {
      const result = await chatroomApiPost<{ url: string }>(`/api/getPromptAssetDownload/${id}`)
      if (tab) tab.location.replace(result.url)
      else Message.error('Allow popups to download the attachment.')
    } catch (e) { tab?.close(); Message.error((e as Error).message) }
  }
  const upload = async (file?: File) => {
    if (!file || !library.roomId || blocked) return
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const limit = library.caps?.file_limits[ext === 'jpg' ? 'jpeg' : ext]
    if (!limit || file.size > limit || file.size === 0) {
      Message.error('Supported limits: TXT 100 KB, PDF 4.5 MB, PNG/JPEG 3.75 MB. Compress or split oversized files.'); return
    }
    setUploading(true)
    const body = new FormData()
    body.append('file', file); body.append('chatroom_id', library.roomId)
    body.append('request_id', crypto.randomUUID())
    try {
      const result = await apiUploadAt<{ asset: Asset }>(CHATROOM_MANAGEMENT_API_BASE, '/api/uploadPromptAsset', body)
      const assetId = result.data.asset.id
      setSelected(current => current.includes(assetId) ? current : [...current, assetId])
      await library.refresh()
    } catch (e) { Message.error((e as Error).message) }
    finally { setUploading(false) }
  }
  const move = (index: number, offset: number) => {
    const next = [...value]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; onChange?.(next)
  }
  return <div style={{ marginTop: 8, minWidth: 0 }}>
    {value.map((id, index) => <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{name(id)}</span>
      <Tooltip content="Move up"><Button aria-label="Move attachment up" icon={<IconUp />} disabled={index === 0} onClick={() => move(index, -1)} /></Tooltip>
      <Tooltip content="Move down"><Button aria-label="Move attachment down" icon={<IconDown />} disabled={index === value.length - 1} onClick={() => move(index, 1)} /></Tooltip>
      <Tooltip content="Download"><Button aria-label="Download attachment" icon={<IconDownload />} onClick={() => download(id)} /></Tooltip>
      <Tooltip content="Remove from prompt"><Button aria-label="Remove attachment from prompt" icon={<IconClose />} onClick={() => onChange?.(value.filter(x => x !== id))} /></Tooltip>
    </div>)}
    <Button icon={<IconAttachment />} onClick={() => { setSelected([...value]); setOpen(true); void library.refresh() }} disabled={!library.roomId}>Add attachment</Button>
    {!library.roomId && <div>Save chatroom first.</div>}
    {error && <div role="alert" style={{ color: '#c02338', marginTop: 6, overflowWrap: 'anywhere' }}>{error}</div>}
    {library.error && <Tooltip content="Retry loading attachments"><Button aria-label="Retry loading attachments" icon={<IconRefresh />} onClick={() => void library.refresh()} /></Tooltip>}
    <Modal title="Chatroom attachments" visible={open} onCancel={() => setOpen(false)} okText="Add selected"
      okButtonProps={{ disabled: blocked || selected.length > 5 || selected.some(id => !library.assets.some(a => a.id === id)) }}
      onOk={() => { onChange?.(selected); setOpen(false) }} style={{ width: 580, maxWidth: 'calc(100vw - 32px)' }}>
      <Button icon={<IconUpload />} loading={uploading} disabled={blocked} onClick={() => fileInput.current?.click()}>Upload new</Button>
      <input ref={fileInput} type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" style={{ display: 'none' }}
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void upload(file) }} />
      <Spin loading={library.loading} style={{ width: '100%' }}>
        <div style={{ marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
          {library.assets.map(asset => <div key={asset.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Checkbox style={{ minWidth: 0, flex: 1 }} checked={selected.includes(asset.id)} disabled={blocked || (!selected.includes(asset.id) && selected.length >= 5)}
              onChange={checked => setSelected(checked ? [...selected, asset.id] : selected.filter(id => id !== asset.id))}>
              <span style={{ overflowWrap: 'anywhere' }}>{asset.original_name}</span>
            </Checkbox>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{(asset.byte_size / 1000).toFixed(1)} KB</span>
            <Tooltip content="Download"><Button aria-label={`Download ${asset.original_name}`} icon={<IconDownload />} onClick={() => download(asset.id)} /></Tooltip>
          </div>)}
          {!library.assets.length && !library.loading && !library.error && library.caps?.enabled && <div>No uploaded attachments.</div>}
        </div>
      </Spin>
      {error && <div role="alert" style={{ color: '#c02338', marginTop: 8, overflowWrap: 'anywhere' }}>{error}</div>}
      {library.error && <Button icon={<IconRefresh />} onClick={() => void library.refresh()}>Retry</Button>}
    </Modal>
  </div>
}
