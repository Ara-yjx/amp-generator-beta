import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Checkbox, Message, Modal, Spin, Tooltip } from '@arco-design/web-react'
import { IconDownload, IconUpload, IconRefresh } from '@arco-design/web-react/icon'
import { chatroomApiPost } from '../../data/chatroom/management'
import { apiUploadAt } from '../../data/backend'
import { CHATROOM_MANAGEMENT_API_BASE } from '../../data/chatroom/config'
import { AiPersonaSetting } from '../../data/chatroom/chatroomSetting'

type Asset = { id: string; original_name: string; byte_size: number; format: string; page_count?: number; created_at?: string }

export function exclusivePersonaAttachments(personas: AiPersonaSetting[], common: string[]): AiPersonaSetting[] {
  const inherited = new Set(common)
  return personas.map(p => (p.prompt_attachment_ids ?? []).some(id => inherited.has(id))
    ? { ...p, prompt_attachment_ids: p.prompt_attachment_ids!.filter(id => !inherited.has(id)) } : p)
}
export type Capabilities = { enabled: boolean; models: string[]; file_limits: Record<string, number>;
  max_effective_files?: number; max_effective_bytes?: number; max_pdf_pages?: number; max_room_files?: number }

export function formatModelOptionLabel(option: { label: string; value: string; supportsPromptCaching?: boolean }, caps?: Capabilities): string {
  return option.label + (option.supportsPromptCaching ? ' (cache✅)' : '')
    + (caps?.enabled && caps.models.includes(option.value) ? ' (attachment✅)' : '')
}

export function attachmentSelectionError(value: string[], otherScopes: string[][], library: Pick<AttachmentLibrary, 'loading' | 'assets' | 'caps'>): string {
  if (library.loading || !library.caps) return ''
  const { caps, assets } = library
  for (const other of otherScopes.length ? otherScopes : [[]]) {
    const ids = [...new Set([...value, ...other])]
    if (ids.length > (caps.max_effective_files ?? 5)) return `Common + persona attachments exceed ${caps.max_effective_files ?? 5} files for an AI.`
    const effective = ids.map(id => assets.find(a => a.id === id))
    if (effective.some(a => !a)) return 'One or more selected attachments are unavailable. Refresh the library or remove them.'
    if (effective.reduce((sum, a) => sum + (a?.byte_size ?? 0), 0) > (caps.max_effective_bytes ?? 10000000)) return 'Common + persona attachments exceed 10 MB for an AI.'
    if (effective.some(a => a?.format === 'pdf' && a.page_count === undefined)) return 'PDF page counts are unavailable. Refresh the attachment library.'
    if (effective.reduce((sum, a) => sum + (a?.format === 'pdf' ? a.page_count ?? 0 : 0), 0) > (caps.max_pdf_pages ?? 10)) return `Common + persona PDFs exceed ${caps.max_pdf_pages ?? 10} pages for an AI.`
  }
  return ''
}

export function attachmentSettingError(common: string[], personas: AiPersonaSetting[], library: AttachmentLibrary): string {
  const scopes = personas.map(p => p.prompt_attachment_ids ?? [])
  if (new Set([...common, ...scopes.flat()]).size > (library.caps?.max_room_files ?? 20)) return 'Select at most 20 distinct attachments across the chatroom.'
  return attachmentSelectionError(common, scopes, library)
}

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

export default function AttachmentList({ value = [], onChange, library, modelError, otherScopes = [[]], inheritedIds = [] }: {
  value?: string[]; onChange?: (value: string[]) => void; library: AttachmentLibrary; modelError: string; otherScopes?: string[][]; inheritedIds?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const latest = useRef({ value, onChange, inheritedIds, roomId: library.roomId })
  latest.current = { value, onChange, inheritedIds, roomId: library.roomId }
  useEffect(() => { setUploadedAssets([]); setOpen(false) }, [library.roomId])
  if (!library.visible) return null
  const busy = library.loading || uploading
  const blocked = busy || !library.caps?.enabled || !!library.error || !!modelError
  const error = library.error || (!library.loading ? modelError : '')
  const assets = [...library.assets, ...uploadedAssets.filter(a => !library.assets.some(x => x.id === a.id))]
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id))
  const selected = [...new Set([...inheritedIds, ...value])]
  const ownSelected = [...new Set(value)].filter(id => !inheritedIds.includes(id))
  const selectionError = attachmentSelectionError(selected, otherScopes, { ...library, assets })
  const name = (id: string) => assets.find(a => a.id === id)?.original_name
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
      if (latest.current.roomId !== library.roomId) return
      const asset = result.data.asset
      setUploadedAssets(current => [...current.filter(a => a.id !== asset.id), asset])
      const current = latest.current
      current.onChange?.([...new Set([...current.value, asset.id])].filter(id => !current.inheritedIds.includes(id)))
      await library.refresh()
    } catch (e) { Message.error((e as Error).message) }
    finally { setUploading(false) }
  }
  return <div style={{ marginTop: 8, minWidth: 0 }}>
    <div style={{ marginBottom: 8, fontWeight: 500 }}>Attachments</div>
    <button type="button" aria-label="Manage attachments" aria-haspopup="dialog" disabled={!library.roomId}
      onClick={() => { setOpen(true); void library.refresh() }}
      style={{ width: '100%', minHeight: 64, padding: '12px 16px', textAlign: 'left', background: '#f7f8fa', border: '1px solid #c9cdd4', borderRadius: 4, color: '#4e5969', cursor: 'pointer', font: 'inherit' }}>
      {ownSelected.length ? [...ownSelected].sort((a, b) => assets.findIndex(x => x.id === a) - assets.findIndex(x => x.id === b))
        .map(id => <span key={id} style={{ display: 'block', overflowWrap: 'anywhere' }}>{name(id)}</span>) : 'Upload attachments'}
    </button>
    {!library.roomId && <div>Save chatroom first.</div>}
    {error && <div role="alert" style={{ color: '#c02338', marginTop: 6, overflowWrap: 'anywhere' }}>{error}</div>}
    {selectionError && <div role="alert" style={{ color: '#c02338', marginTop: 6 }}>{selectionError}</div>}
    {library.error && <Tooltip content="Retry loading attachments"><Button aria-label="Retry loading attachments" icon={<IconRefresh />} onClick={() => void library.refresh()} /></Tooltip>}
    <Modal title="Chatroom attachments" visible={open} onCancel={() => setOpen(false)} footer={null}
      style={{ width: 580, maxWidth: 'calc(100vw - 32px)' }}>
      <Spin loading={library.loading} style={{ width: '100%' }}>
        <div style={{ marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
          {assets.map(asset => <div key={asset.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Checkbox style={{ minWidth: 0, flex: 1 }} checked={selected.includes(asset.id)}
              disabled={blocked || inheritedIds.includes(asset.id) || (!selected.includes(asset.id) && !!attachmentSelectionError([...selected, asset.id], otherScopes, { ...library, assets }))}
              onChange={checked => onChange?.((checked ? [...new Set([...value, asset.id])] : value.filter(id => id !== asset.id)).filter(id => !inheritedIds.includes(id)))}>
              <span style={{ overflowWrap: 'anywhere' }}>{asset.original_name}</span>
            </Checkbox>
            {inheritedIds.includes(asset.id) && <span style={{ color: '#86909c', fontSize: 12 }}>Common</span>}
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{(asset.byte_size / 1000).toFixed(1)} KB</span>
            <Tooltip content="Download"><Button aria-label={`Download ${asset.original_name}`} icon={<IconDownload />} onClick={() => download(asset.id)} /></Tooltip>
          </div>)}
          {!assets.length && !library.loading && !library.error && library.caps?.enabled && <div>No uploaded attachments.</div>}
        </div>
      </Spin>
      <Button style={{ marginTop: 16 }} icon={<IconUpload />} loading={uploading} disabled={blocked} onClick={() => fileInput.current?.click()}>Upload new</Button>
      <input ref={fileInput} type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" style={{ display: 'none' }}
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void upload(file) }} />
      <div style={{ color: '#86909c', fontSize: 12, marginTop: 12 }}>
        Per AI: common + its persona attachments, up to {library.caps?.max_effective_files ?? 5} files,
        {' '}10 MB total and {library.caps?.max_pdf_pages ?? 10} PDF pages. The same library file counts once.
        {' '}Per file: TXT 100 KB, PDF 4.5 MB, PNG/JPEG 3.75 MB. Compress or split larger files.
      </div>
      {error && <div role="alert" style={{ color: '#c02338', marginTop: 8, overflowWrap: 'anywhere' }}>{error}</div>}
      {selectionError && <div role="alert" style={{ color: '#c02338', marginTop: 8 }}>{selectionError}</div>}
      {library.error && <Button icon={<IconRefresh />} onClick={() => void library.refresh()}>Retry</Button>}
    </Modal>
  </div>
}
