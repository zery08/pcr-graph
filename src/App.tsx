import { FormEvent, useMemo, useState } from 'react'
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
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Bot, Database, Network, Rows3, Send } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { sendChatToLlm, type ChatMessage } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import { type ProcessRow, useWorkspaceStore } from '@/store'

import 'reactflow/dist/style.css'

const graphNodes: Node[] = [
  {
    id: 'equip-a',
    position: { x: 60, y: 80 },
    data: { label: '장비 A' },
    style: { borderRadius: 12, border: '1px solid #16a34a', padding: 10 },
  },
  {
    id: 'equip-b',
    position: { x: 320, y: 80 },
    data: { label: '장비 B' },
    style: { borderRadius: 12, border: '1px solid #2563eb', padding: 10 },
  },
  {
    id: 'qc',
    position: { x: 190, y: 220 },
    data: { label: 'QC Stage' },
    style: { borderRadius: 12, border: '1px solid #9333ea', padding: 10 },
  },
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

function App() {
  const { selectedContext, selectedNode, selectedRows, setSelectedNode, toggleSelectedRow, clearSelections } =
    useWorkspaceStore()
  const [nodes, , onNodesChange] = useNodesState(graphNodes)
  const [edges, , onEdgesChange] = useEdgesState(graphEdges)

  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '선택한 그래프/테이블 데이터를 자동으로 포함해서 질문할 수 있습니다.',
      references: [],
    },
  ])

  const referenceChips = useMemo(() => {
    const chips: string[] = []

    if (selectedNode) {
      chips.push(`노드: ${selectedNode.label}`)
    }

    selectedRows.forEach((row) => {
      chips.push(`행: ${row.id}`)
    })

    return chips
  }, [selectedNode, selectedRows])

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNode({
      id: node.id,
      label: String(node.data.label),
      type: 'node',
      metadata: { source: 'graph-panel' },
    })
  }

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      references: referenceChips,
    }

    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setIsSending(true)

    try {
      const response = await sendChatToLlm({
        question: trimmed,
        context: {
          node: selectedNode,
          rows: selectedRows,
        },
        history: [...messages, userMessage],
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          references: [],
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `요청 처리 중 오류가 발생했습니다: ${message}`,
          references: [],
        },
      ])
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

          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleSelectedRow(rowData)}
              className="h-4 w-4"
              aria-label={`${rowData.id} 선택`}
            />
          )
        },
      }),
      columnHelper.accessor('id', { header: () => 'ID' }),
      columnHelper.accessor('process', { header: () => 'Process' }),
      columnHelper.accessor('equipment', { header: () => 'Equipment' }),
      columnHelper.accessor('status', { header: () => 'Status' }),
      columnHelper.accessor('prediction', {
        header: () => 'Prediction',
        cell: (info) => info.getValue().toFixed(2),
      }),
    ],
    [selectedRows, toggleSelectedRow],
  )

  const table = useReactTable({
    data: processRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <main className="h-screen bg-muted/40 p-4">
      <div className="mb-3 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        Phase 3: AI 채팅 + Context Injection + Reference Chip
      </div>

      <PanelGroup direction="horizontal" className="h-[calc(100%-56px)] overflow-hidden rounded-lg border bg-background">
        <Panel defaultSize={66} minSize={45}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={58} minSize={35}>
              <section className="flex h-full flex-col border-b">
                <header className="flex items-center gap-2 border-b p-3 font-semibold">
                  <Network className="h-4 w-4" /> Graph Panel (React Flow)
                </header>
                <div className="h-full">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    onNodeClick={onNodeClick}
                  >
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
                  <p className="flex items-center gap-2">
                    <Rows3 className="h-4 w-4" /> Table Panel (TanStack Table)
                  </p>
                  <Button size="sm" variant="outline" onClick={clearSelections}>
                    선택 초기화
                  </Button>
                </header>

                <div className="overflow-auto p-3">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b text-left">
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-2 py-2 font-medium">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-muted/40">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-2 py-2">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-px bg-border" />

        <Panel defaultSize={32} minSize={24}>
          <section className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b p-3 font-semibold">
              <Bot className="h-4 w-4" /> AI Chat
            </header>

            <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
              <div className="rounded-md border bg-muted/60 p-3 text-xs text-muted-foreground">
                선택된 데이터는 전송 시 자동으로 prompt context에 포함됩니다.
              </div>

              <div className="flex flex-wrap gap-2">
                {referenceChips.length ? (
                  referenceChips.map((chip) => (
                    <span key={chip} className="rounded-full border bg-background px-2 py-1 text-xs">
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">참조 데이터 없음</span>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-md border bg-background p-3">
                {messages.map((message) => (
                  <article key={message.id} className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{message.role}</p>
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-2 text-sm">{message.content}</p>
                    {!!message.references.length && (
                      <div className="flex flex-wrap gap-2">
                        {message.references.map((ref) => (
                          <span key={`${message.id}-${ref}`} className="rounded-full border bg-background px-2 py-1 text-[11px]">
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <form className="space-y-2" onSubmit={handleSend}>
                <textarea
                  className="h-24 w-full resize-none rounded-md border bg-background p-2 text-sm"
                  placeholder="선택한 노드/행을 기반으로 질문을 입력하세요"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <Button type="submit" className="w-full" disabled={isSending || !question.trim()}>
                  <Send className="mr-2 h-4 w-4" /> {isSending ? '전송 중...' : '질문 전송'}
                </Button>
              </form>

              <div className="rounded-lg border bg-background p-3">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <Database className="h-4 w-4" /> 미니 뷰어
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>선택 노드: {selectedNode?.label ?? '-'}</p>
                  <p>선택 행 수: {selectedRows.length}</p>
                  {!!selectedRows.length && (
                    <ul className="list-inside list-disc">
                      {selectedRows.map((row) => (
                        <li key={row.id}>
                          {row.id} / {row.process} / {row.status}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>현재 selectedContext: {selectedContext ? selectedContext.label : '없음'}</p>
                </div>
              </div>
            </div>
          </section>
        </Panel>
      </PanelGroup>
    </main>
  )
}

export default App
