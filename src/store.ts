import { create } from 'zustand'

type ContextType = 'node' | 'row'

type SelectedContext = {
  id: string
  label: string
  type: ContextType
  metadata?: Record<string, string>
}

type WorkspaceStore = {
  selectedContext: SelectedContext | null
  setSelectedContext: (context: SelectedContext) => void
  clearSelectedContext: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  selectedContext: null,
  setSelectedContext: (context) => set({ selectedContext: context }),
  clearSelectedContext: () => set({ selectedContext: null }),
}))
