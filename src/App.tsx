import { useMemo, useState } from 'react'
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
import { Bot, Database, Network, Rows3, Send, X } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import { type GraphNodeContext, type ProcessRow, useWorkspaceStore } from '@/store'

import 'reactflow/dist/style.css'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const graphNodes: Node[] = [
  {
    id: 'equip-a',
    position: { x: 60, y: 80 },
    data: { label: '장비 A', kind: 'equipment', status: 'normal' },
    style: { borderRadius: 12, border: '1px solid #16a34a', padding: 10 },
  },
  {
    id: 'equip-b',
    position: { x: 320, y: 80 },
    data: { label: '장비 B', kind: 'equipment', status: 'warning' },
    style: { borderRadius: 12, border: '1px solid #2563eb', padding: 10 },
  },
  {
    id: 'qc',
    position: { x: 190, y: 220 },
    data: { label: 'QC Stage', kind: 'inspection', status: 'critical' },
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

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini'
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

function App() {
  const { selectedContext, setSelectedNode, toggleSelectedRow, clearSelections } = useWorkspaceStore()
  const selectedNode = selectedContext.node
  const selectedRows = selectedContext.rows

  const [nodes, , onNodesChange] = useNodesState(graphNodes)
  const [edges, , onEdgesChange] = useEdgesState(graphEdges)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 그래프/테이블 컨텍스트를 자동으로 포함해 공정 상태를 분석해드릴게요.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const onNodeClick: NodeMouseHandler = (_, node) => {
    const context: GraphNodeContext = {
      id: node.id,
      label: String(node.data.label),
      kind: node.data.kind as GraphNodeContext['kind'],
      status: node.data.status as GraphNodeContext['status'],
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    }

    setSelectedNode(context)
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

  const buildContextPrompt = () => {
    const nodeContext = selectedNode
      ? {
          id: selectedNode.id,
          label: selectedNode.label,
          kind: selectedNode.kind,
          status: selectedNode.status,
          position: selectedNode.position,
        }
      : null

    const rowContext = selectedRows.map((row) => ({
      id: row.id,
      process: row.process,
      equipment: row.equipment,
      status: row.status,
      prediction: row.prediction,
    }))

    return JSON.stringify(
      {
        selectedNode: nodeContext,
        selectedRows: rowContext,
      },
      null,
      2,
    )
  }

  const requestLlm = async (question: string) => {
    if (!OPENAI_API_KEY) {
      return `LLM API 키가 설정되지 않았습니다.\n\n환경변수 VITE_OPENAI_API_KEY를 추가하면 실제 응답을 받을 수 있습니다.\n\n질문: ${question}`
    }

    const contextPrompt = buildContextPrompt()

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '너는 공정 데이터 분석 도우미다. 사용자가 선택한 노드/테이블 행 컨텍스트를 우선 반영해 간결하게 답변한다.',
          },
          {
            role: 'user',
            content: `다음은 현재 선택된 컨텍스트다:\n${contextPrompt}\n\n사용자 질문:\n${question}`,
          },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API 요청 실패(${response.status}): ${errorText}`)
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    return result.choices?.[0]?.message?.content ?? '모델 응답이 비어 있습니다.'
  }

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const answer = await requestLlm(question)
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-screen bg-muted/40 p-4">
      <div className="mb-3 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        Phase 3: LLM Chat + Context Injection + Reference Chips
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

            <div className="border-b p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Reference Chips</p>
              <div className="flex flex-wrap gap-2">
                {selectedNode && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                    노드: {selectedNode.label}
                  </span>
                )}
                {selectedRows.map((row) => (
                  <span
                    key={row.id}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900"
                  >
                    행: {row.id}
                  </span>
                ))}
                {!selectedNode && selectedRows.length === 0 && (
                  <span className="text-xs text-muted-foreground">선택된 레퍼런스가 없습니다.</span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-auto p-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-md p-3 text-sm ${
                    message.role === 'user' ? 'ml-6 bg-primary/10' : 'mr-6 border bg-muted/40'
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{message.role}</p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {isLoading && <p className="text-xs text-muted-foreground">AI가 컨텍스트를 분석 중입니다...</p>}
            </div>

            <div className="space-y-2 border-t p-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="예: 장비 B의 위험 요소를 설명해줘"
                className="min-h-[90px] w-full resize-none rounded-md border bg-background p-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={isLoading || !input.trim()}>
                  <X className="mr-1 h-4 w-4" /> 지우기
                </Button>
                <Button size="sm" onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="mr-1 h-4 w-4" /> 전송
                </Button>
              </div>
            </div>

            <div className="rounded-lg border-t bg-background p-3">
              <p className="mb-2 flex items-center gap-2 font-medium text-sm">
                <Database className="h-4 w-4" /> 미니 뷰어
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>선택 노드: {selectedNode?.label ?? '-'}</p>
                <p>선택 행 수: {selectedRows.length}</p>
              </div>
            </div>
          </section>
        </Panel>
      </PanelGroup>
    </main>
  )
}

export default App
