import { Bot, Database, Network } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/store'

const sampleContexts = [
  { id: 'node-1', label: '장비 A', type: 'node' as const },
  { id: 'row-42', label: '공정 데이터 #42', type: 'row' as const },
]

function App() {
  const { selectedContext, setSelectedContext, clearSelectedContext } = useWorkspaceStore()

  return (
    <main className="h-screen bg-muted/40 p-4">
      <div className="mb-3 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        Phase 1: 레이아웃 + Zustand 컨텍스트 아키텍처
      </div>

      <PanelGroup direction="horizontal" className="h-[calc(100%-56px)] overflow-hidden rounded-lg border bg-background">
        <Panel defaultSize={66} minSize={45}>
          <section className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b p-3 font-semibold">
              <Database className="h-4 w-4" /> Workspace
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="rounded-lg border p-4">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <Network className="h-4 w-4" /> 선택 컨텍스트 시뮬레이터
                </p>
                <div className="flex flex-wrap gap-2">
                  {sampleContexts.map((context) => (
                    <Button
                      key={context.id}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedContext({
                          ...context,
                          metadata: { source: 'phase-1-demo' },
                        })
                      }
                    >
                      {context.label} 선택
                    </Button>
                  ))}
                  <Button size="sm" onClick={clearSelectedContext}>
                    선택 초기화
                  </Button>
                </div>
              </div>

              <div className="flex-1 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Graph / Table 컴포넌트가 들어갈 영역 (Phase 2)
              </div>
            </div>
          </section>
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
            </div>
          </section>
        </Panel>
      </PanelGroup>
    </main>
  )
}

export default App
