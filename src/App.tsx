import { useMemo } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
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
import { Bot, Database, Network, Rows3 } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

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

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNode({
      id: node.id,
      label: String(node.data.label),
      type: 'node',
      metadata: { source: 'graph-panel' },
    })
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
        Phase 2: Graph + Table Workspace + 하단 미니 뷰어
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
                  <ReactFlow nodes={graphNodes} edges={graphEdges} fitView onNodeClick={onNodeClick}>
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

        <Panel defaultSize={34} minSize={24}>
          <section className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b p-3 font-semibold">
              <Bot className="h-4 w-4" /> AI Chat
            </header>

            <div className="flex-1 space-y-3 p-4 text-sm">
              <p className="rounded-md border bg-muted/60 p-3">
                선택된 데이터는 Zustand의 <code>selectedContext</code>로 공유됩니다.
              </p>
              <pre className="overflow-auto rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(selectedContext, null, 2) ?? 'null'}
              </pre>

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
