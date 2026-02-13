import { create } from 'zustand'

export type ContextType = 'node' | 'row'

export type SelectedContext = {
  id: string
  label: string
  type: ContextType
  metadata?: Record<string, string>
}

export type ProcessRow = {
  id: string
  process: string
  equipment: string
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE'
  prediction: number
}

type WorkspaceStore = {
  selectedContext: SelectedContext | null
  selectedNode: SelectedContext | null
  selectedRows: ProcessRow[]
  setSelectedNode: (context: SelectedContext | null) => void
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
