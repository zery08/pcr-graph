import { create } from 'zustand'

export type GraphNode = {
  id: string
  label: string
  type: 'equipment' | 'process' | 'inspection'
  status: 'normal' | 'warning' | 'critical'
  x: number
  y: number
}

export type ProcessRow = {
  id: string
  process: string
  equipment: string
  temperature: number
  pressure: number
  prediction: '정상' | '주의' | '위험'
}

type SelectedContext = {
  node: GraphNode | null
  rows: ProcessRow[]
}

type WorkspaceStore = {
  selectedNode: GraphNode | null
  selectedRows: ProcessRow[]
  selectedContext: SelectedContext
  setSelectedNode: (node: GraphNode | null) => void
  toggleSelectedRow: (row: ProcessRow) => void
  clearSelectedRows: () => void
  clearAllSelections: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedNode: null,
  selectedRows: [],
  selectedContext: {
    node: null,
    rows: [],
  },
  setSelectedNode: (node) =>
    set((state) => ({
      selectedNode: node,
      selectedContext: {
        ...state.selectedContext,
        node,
      },
    })),
  toggleSelectedRow: (row) =>
    set((state) => {
      const exists = state.selectedRows.some((item) => item.id === row.id)
      const nextRows = exists
        ? state.selectedRows.filter((item) => item.id !== row.id)
        : [...state.selectedRows, row]

      return {
        selectedRows: nextRows,
        selectedContext: {
          ...state.selectedContext,
          rows: nextRows,
        },
      }
    }),
  clearSelectedRows: () =>
    set((state) => ({
      selectedRows: [],
      selectedContext: {
        ...state.selectedContext,
        rows: [],
      },
    })),
  clearAllSelections: () =>
    set({
      selectedNode: null,
      selectedRows: [],
      selectedContext: {
        node: null,
        rows: [],
      },
    }),
}))
