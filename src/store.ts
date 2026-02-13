import { create } from 'zustand'

export type ContextSource = 'graph-panel' | 'table-panel'

export type NodeContext = {
  id: string
  label: string
  type: 'node'
  metadata: {
    source: ContextSource
  }
}

export type ProcessRow = {
  id: string
  process: string
  equipment: string
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE'
  prediction: number
}

export type SelectedContext = NodeContext | {
  id: string
  label: string
  type: 'row'
  metadata: {
    source: ContextSource
  }
}

type WorkspaceStore = {
  selectedContext: SelectedContext | null
  selectedNode: NodeContext | null
  selectedRows: ProcessRow[]
  setSelectedNode: (context: NodeContext | null) => void
  toggleSelectedRow: (row: ProcessRow) => void
  clearSelections: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedContext: null,
  selectedNode: null,
  selectedRows: [],
  setSelectedNode: (context) =>
    set(() => ({
      selectedNode: context,
      selectedContext: context,
    })),
  toggleSelectedRow: (row) =>
    set((state) => {
      const exists = state.selectedRows.some((selected) => selected.id === row.id)
      const selectedRows = exists
        ? state.selectedRows.filter((selected) => selected.id !== row.id)
        : [...state.selectedRows, row]

      return {
        selectedRows,
        selectedContext: selectedRows.length
          ? {
              id: selectedRows.map((selected) => selected.id).join(','),
              label: `${selectedRows.length}개 공정 데이터 선택`,
              type: 'row',
              metadata: { source: 'table-panel' },
            }
          : state.selectedNode,
      }
    }),
  clearSelections: () =>
    set(() => ({
      selectedContext: null,
      selectedNode: null,
      selectedRows: [],
    })),
}))
