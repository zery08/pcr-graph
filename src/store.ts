import { create } from 'zustand'

export type GraphNodeContext = {
  id: string
  label: string
  kind: 'equipment' | 'process' | 'inspection'
  status: 'normal' | 'warning' | 'critical'
  position: {
    x: number
    y: number
  }
}

export type ProcessRow = {
  id: string
  process: string
  equipment: string
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE'
  prediction: number
}

export type SelectedContext = {
  node: GraphNodeContext | null
  rows: ProcessRow[]
}

type WorkspaceStore = {
  selectedContext: SelectedContext
  setSelectedNode: (node: GraphNodeContext | null) => void
  toggleSelectedRow: (row: ProcessRow) => void
  clearSelections: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedContext: {
    node: null,
    rows: [],
  },
  setSelectedNode: (node) =>
    set((state) => ({
      selectedContext: {
        ...state.selectedContext,
        node,
      },
    })),
  toggleSelectedRow: (row) =>
    set((state) => {
      const exists = state.selectedContext.rows.some((selected) => selected.id === row.id)
      const nextRows = exists
        ? state.selectedContext.rows.filter((selected) => selected.id !== row.id)
        : [...state.selectedContext.rows, row]

      return {
        selectedContext: {
          ...state.selectedContext,
          rows: nextRows,
        },
      }
    }),
  clearSelections: () =>
    set(() => ({
      selectedContext: {
        node: null,
        rows: [],
      },
    })),
}))
