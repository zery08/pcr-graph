import { Bot, Database, Network, Rows3, X } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import { type GraphNode, type ProcessRow, useWorkspaceStore } from '@/store'

const graphNodes: GraphNode[] = [
  { id: 'n1', label: '혼합기 A', type: 'equipment', status: 'normal', x: 90, y: 60 },
  { id: 'n2', label: '가열 공정', type: 'process', status: 'warning', x: 290, y: 60 },
  { id: 'n3', label: '검사 스테이션', type: 'inspection', status: 'critical', x: 490, y: 60 },
  { id: 'n4', label: '포장 라인', type: 'process', status: 'normal', x: 290, y: 180 },
]

const graphEdges = [
  { id: 'e1', source: 'n1', target: 'n2' },
  { id: 'e2', source: 'n2', target: 'n3' },
  { id: 'e3', source: 'n2', target: 'n4' },
]

const tableRows: ProcessRow[] = [
  { id: 'p-101', process: 'Mixing', equipment: '혼합기 A', temperature: 72, pressure: 3.1, prediction: '정상' },
  { id: 'p-102', process: 'Heating', equipment: '히터 B', temperature: 94, pressure: 4.8, prediction: '주의' },
  { id: 'p-103', process: 'Inspection', equipment: '검사기 C', temperature: 81, pressure: 3.8, prediction: '위험' },
  { id: 'p-104', process: 'Packing', equipment: '포장기 D', temperature: 69, pressure: 2.9, prediction: '정상' },
]

const statusColor = {
  normal: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
}

function App() {
  const {
    selectedNode,
    selectedRows,
    selectedContext,
    setSelectedNode,
    toggleSelectedRow,
    clearSelectedRows,
    clearAllSelections,
  } = useWorkspaceStore()

  const isRowSelected = (rowId: string) => selectedRows.some((row) => row.id === rowId)

  return (
    <main className="h-screen bg-muted/40 p-4">
      <div className="mb-3 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        Phase 2: Graph + Table Workspace + Mini Viewer
      </div>

      <PanelGroup direction="horizontal" className="h-[calc(100%-56px)] overflow-hidden rounded-lg border bg-background">
        <Panel defaultSize={68} minSize={50}>
          <section className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b p-3">
              <p className="flex items-center gap-2 font-semibold">
                <Database className="h-4 w-4" /> Data Workspace
              </p>
              <Button size="sm" variant="outline" onClick={clearAllSelections}>
                <X className="mr-1 h-4 w-4" /> 선택 초기화
              </Button>
            </header>

            <div className="grid flex-1 grid-rows-[1fr_1fr_auto] gap-3 p-3">
              <section className="rounded-lg border">
                <header className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
                  <Network className="h-4 w-4" /> Graph Panel
                </header>

                <div className="relative h-full min-h-[210px] overflow-hidden p-3">
                  <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    {graphEdges.map((edge) => {
                      const source = graphNodes.find((node) => node.id === edge.source)
                      const target = graphNodes.find((node) => node.id === edge.target)
                      if (!source || !target) {
                        return null
                      }

                      return (
                        <line
                          key={edge.id}
                          x1={source.x + 55}
                          y1={source.y + 24}
                          x2={target.x + 55}
                          y2={target.y + 24}
                          stroke="hsl(var(--border))"
                          strokeWidth="2"
                        />
                      )
                    })}
                  </svg>

                  {graphNodes.map((node) => {
                    const selected = selectedNode?.id === node.id

                    return (
                      <button
                        key={node.id}
                        type="button"
                        className={`absolute flex w-28 flex-col rounded-md border bg-background px-2 py-1 text-left shadow-sm transition ${
                          selected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'
                        }`}
                        style={{ left: node.x, top: node.y }}
                        onClick={() => setSelectedNode(node)}
                      >
                        <span className="text-xs font-medium">{node.label}</span>
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${statusColor[node.status]}`} />
                          {node.type}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-lg border">
                <header className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
                  <p className="flex items-center gap-2">
                    <Rows3 className="h-4 w-4" /> Table Panel
                  </p>
                  <Button size="sm" variant="outline" onClick={clearSelectedRows}>
                    행 선택 해제
                  </Button>
                </header>

                <div className="max-h-[230px] overflow-auto p-2">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/60 text-left">
                        <th className="w-10 p-2">선택</th>
                        <th className="p-2">Process</th>
                        <th className="p-2">Equipment</th>
                        <th className="p-2">Temp(°C)</th>
                        <th className="p-2">Pressure</th>
                        <th className="p-2">예측</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => {
                        const selected = isRowSelected(row.id)

                        return (
                          <tr key={row.id} className={`border-b ${selected ? 'bg-primary/10' : 'hover:bg-muted/40'}`}>
                            <td className="p-2">
                              <input type="checkbox" checked={selected} onChange={() => toggleSelectedRow(row)} />
                            </td>
                            <td className="p-2">{row.process}</td>
                            <td className="p-2">{row.equipment}</td>
                            <td className="p-2">{row.temperature}</td>
                            <td className="p-2">{row.pressure}</td>
                            <td className="p-2">{row.prediction}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-sm font-medium">선택 데이터 미니 뷰어</p>
                <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div className="rounded border bg-background p-2">
                    <p className="mb-1 font-medium text-foreground">선택 노드</p>
                    {selectedNode ? (
                      <p>
                        {selectedNode.label} ({selectedNode.type})
                      </p>
                    ) : (
                      <p>선택된 노드 없음</p>
                    )}
                  </div>

                  <div className="rounded border bg-background p-2">
                    <p className="mb-1 font-medium text-foreground">선택 행</p>
                    {selectedRows.length ? (
                      <ul className="list-inside list-disc">
                        {selectedRows.map((row) => (
                          <li key={row.id}>
                            {row.id} · {row.process} · {row.prediction}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>선택된 행 없음</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </Panel>

        <PanelResizeHandle className="w-px bg-border" />

        <Panel defaultSize={32} minSize={24}>
          <section className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b p-3 font-semibold">
              <Bot className="h-4 w-4" /> AI Chat
            </header>

            <div className="flex-1 space-y-3 p-4 text-sm">
              <p className="rounded-md border bg-muted/60 p-3">
                Phase 3에서 선택된 컨텍스트가 프롬프트에 자동 주입됩니다.
              </p>
              <pre className="overflow-auto rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(selectedContext, null, 2)}
              </pre>
            </div>
          </section>
        </Panel>
      </PanelGroup>
    </main>
  )
}

export default App
