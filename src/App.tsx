import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from 'reactflow'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowUp, Bot, Database, MessageCircleMore, Network, Rows3, User2 } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { sendChatToLlm, type ChatMessage } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import { type ProcessRow, useWorkspaceStore } from '@/store'

import 'reactflow/dist/style.css'

const graphNodes: Node[] = [
  { id: 'equip-a', position: { x: 60, y: 80 }, data: { label: '장비 A' }, style: { borderRadius: 12, border: '1px solid #16a34a', padding: 10 } },
  { id: 'equip-b', position: { x: 320, y: 80 }, data: { label: '장비 B' }, style: { borderRadius: 12, border: '1px solid #2563eb', padding: 10 } },
  { id: 'qc', position: { x: 190, y: 220 }, data: { label: 'QC Stage' }, style: { borderRadius: 12, border: '1px solid #9333ea', padding: 10 } },
]

const graphEdges: Edge[] = [
  { id: 'e-a-b', source: 'equip-a', target: 'equip-b', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-b-qc', source: 'equip-b', target: 'qc', markerEnd: { type: MarkerType.ArrowClosed } },
]

const processRows: ProcessRow[] = [
  { id: 'row-101', process: 'Mixing', equipment: '장비 A', status: 'RUNNING', prediction: 0.93 },
  { id: 'row-102', process: 'Heating', equipment: '장비 B', status: 'IDLE', prediction: 0.81 },
  { id: 'row-103', process: 'Quality Check', equipment: 'QC Stage', status: 'MAINTENANCE', prediction: 0.74 },
]

const columnHelper = createColumnHelper<ProcessRow>()

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const markdownToHtml = (markdown: string) => {
  const escaped = escapeHtml(markdown)

  const withCodeBlock = escaped.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    return `<pre class="my-2 overflow-x-auto rounded-md bg-slate-950 p-2 text-xs text-slate-100"><code>${code.trim()}</code></pre>`
  })

  const withBlockSyntax = withCodeBlock
    .replace(/^###\s+(.*)$/gm, '<h3 class="mt-2 mb-1 text-sm font-semibold">$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2 class="mt-2 mb-1 text-base font-semibold">$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1 class="mt-2 mb-1 text-lg font-semibold">$1</h1>')
    .replace(/^>\s?(.*)$/gm, '<blockquote class="my-2 border-l-2 border-muted-foreground/30 pl-2 text-muted-foreground">$1</blockquote>')

  const withInlineSyntax = withBlockSyntax
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs">$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="underline" href="$2" target="_blank" rel="noreferrer">$1</a>')

  const withLists = withInlineSyntax.replace(/(?:^|\n)-\s+(.*)(?:\n|$)/g, '\n<li>$1</li>\n').replace(/(<li>.*?<\/li>\n?)+/gs, (list) => `<ul class="my-2 list-inside list-disc">${list}</ul>`)

  return withLists.replace(/\n/g, '<br />')
}

function App() {
  const { selectedContext, selectedNode, selectedRows, setSelectedNode, toggleSelectedRow, clearSelections } = useWorkspaceStore()
  const [nodes, , onNodesChange] = useNodesState(graphNodes)
  const [edges, , onEdgesChange] = useEdgesState(graphEdges)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: '선택한 그래프/테이블 데이터를 자동으로 포함해서 질문할 수 있습니다.\n\n`markdown`도 지원됩니다.', references: [] },
  ])

  const chatViewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!chatViewportRef.current) return
    chatViewportRef.current.scrollTo({ top: chatViewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  const referenceChips = useMemo(() => {
    const chips: string[] = []
    if (selectedNode) chips.push(`노드: ${selectedNode.label}`)
    selectedRows.forEach((row) => chips.push(`행: ${row.id}`))
    return chips
  }, [selectedNode, selectedRows])

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNode({ id: node.id, label: String(node.data.label), type: 'node', metadata: { source: 'graph-panel' } })
  }

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draftMessage.trim()
    if (!trimmed || isSending) return

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed, references: referenceChips }
    const nextHistory = [...messages, userMessage]

    setMessages(nextHistory)
    setDraftMessage('')
    setIsSending(true)

    try {
      const response = await sendChatToLlm({ context: { node: selectedNode, rows: selectedRows }, history: nextHistory })
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, references: [] }])
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      setMessages((prev) => [...prev, { id: `assistant-error-${Date.now()}`, role: 'assistant', content: `요청 처리 중 오류가 발생했습니다: ${message}`, references: [] }])
    } finally {
      setIsSending(false)
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => '선택',
        cell: ({ row }) => {
          const rowData = row.original
          const checked = selectedRows.some((selected) => selected.id === rowData.id)
          return <input type="checkbox" checked={checked} onChange={() => toggleSelectedRow(rowData)} className="h-4 w-4" aria-label={`${rowData.id} 선택`} />
        },
      }),
      columnHelper.accessor('id', { header: () => 'ID' }),
      columnHelper.accessor('process', { header: () => 'Process' }),
      columnHelper.accessor('equipment', { header: () => 'Equipment' }),
      columnHelper.accessor('status', { header: () => 'Status' }),
      columnHelper.accessor('prediction', { header: () => 'Prediction', cell: (info) => info.getValue().toFixed(2) }),
    ],
    [selectedRows, toggleSelectedRow],
  )

  const table = useReactTable({ data: processRows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <main className="relative h-screen bg-muted/40 p-4">
      <div className="mb-3 rounded-lg border bg-background p-3 text-sm text-muted-foreground">Phase 3: AI 채팅 + Context Injection + Reference Chip</div>

      <PanelGroup direction="horizontal" className="h-[calc(100%-56px)] overflow-hidden rounded-lg border bg-background">
        <Panel defaultSize={66} minSize={45}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={58} minSize={35}>
              <section className="flex h-full flex-col border-b">
                <header className="flex items-center gap-2 border-b p-3 font-semibold"><Network className="h-4 w-4" /> Graph Panel (React Flow)</header>
                <div className="h-full">
                  <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView onNodeClick={onNodeClick}>
                    <MiniMap />
                    <Controls />
                    <Background gap={24} size={1} />
                  </ReactFlow>
                </div>
              </section>
            </Panel>
            <PanelResizeHandle className="h-px bg-border" />
            <Panel defaultSize={42} minSize={28}>
              <section className="flex h-full flex-col">
                <header className="flex items-center justify-between border-b p-3 font-semibold">
                  <p className="flex items-center gap-2"><Rows3 className="h-4 w-4" /> Table Panel (TanStack Table)</p>
                  <Button size="sm" variant="outline" onClick={clearSelections}>선택 초기화</Button>
                </header>
                <div className="overflow-auto p-3">
                  <table className="w-full border-collapse text-sm">
                    <thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id} className="border-b text-left">{headerGroup.headers.map((header) => <th key={header.id} className="px-2 py-2 font-medium">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead>
                    <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b hover:bg-muted/40">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-2 py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </section>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      <div className="pointer-events-none fixed bottom-5 right-5 z-30">
        <Button className="pointer-events-auto rounded-full shadow-xl" onClick={() => setIsChatOpen((prev) => !prev)}>
          <MessageCircleMore className="mr-2 h-4 w-4" /> {isChatOpen ? '채팅 숨기기' : 'AI 채팅 열기'}
        </Button>
      </div>

      {isChatOpen && (
        <aside className="fixed bottom-20 right-5 z-30 flex h-[78vh] w-[420px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <header className="flex items-center gap-2 border-b bg-background p-3 font-semibold"><Bot className="h-4 w-4" /> AI Chat</header>

          <div className="border-b bg-background px-4 py-3">
            <details className="rounded-md border bg-muted/40 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">선택 컨텍스트 디버그 보기</summary>
              <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-2 text-[11px] text-slate-100">
                {JSON.stringify({ selectedNode, selectedRows, selectedContext }, null, 2)}
              </pre>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              {referenceChips.length
                ? referenceChips.map((chip) => <span key={chip} className="rounded-full border bg-background px-2 py-1 text-xs">{chip}</span>)
                : <span className="text-xs text-muted-foreground">참조 데이터 없음</span>}
            </div>
          </div>

          <div ref={chatViewportRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              return (
                <article key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl border px-3 py-2 shadow-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                    <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase opacity-80">{isUser ? <User2 className="h-3 w-3" /> : <Bot className="h-3 w-3" />} {message.role}</p>
                    <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} />
                  </div>
                </article>
              )
            })}
            {isSending && <article className="flex justify-start"><div className="max-w-[88%] rounded-2xl border bg-background px-3 py-2 shadow-sm"><p className="text-sm text-muted-foreground">응답 생성 중...</p></div></article>}
          </div>

          <form className="relative border-t bg-background p-3" onSubmit={handleSend}>
            <textarea
              className="h-20 w-full resize-none rounded-xl border bg-background p-3 pr-14 text-sm"
              placeholder="선택한 노드/행을 기반으로 질문을 입력하세요"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
            />
            <Button type="submit" size="sm" className="absolute bottom-5 right-5 h-9 w-9 rounded-full" disabled={isSending || !draftMessage.trim()} aria-label="질문 전송">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>

          <div className="border-t bg-background p-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="mb-2 flex items-center gap-2 font-medium"><Database className="h-4 w-4" /> 미니 뷰어</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>선택 노드: {selectedNode?.label ?? '-'}</p>
                <p>선택 행 수: {selectedRows.length}</p>
                <p>현재 selectedContext: {selectedContext ? selectedContext.label : '없음'}</p>
              </div>
            </div>
          </div>
        </aside>
      )}
    </main>
  )
}

export default App
