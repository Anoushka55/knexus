'use client'

import { create } from 'zustand'

import { DEFAULT_ROLE_ID, type RoleId } from '@/lib/kpmg-dice/config/roles'

interface UIState {
  /** Which seat the app is being viewed as. */
  activeRoleId: RoleId
  setActiveRole: (roleId: RoleId) => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  searchQuery: string
  setSearchQuery: (query: string) => void

  unreadNotifications: number
  clearNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeRoleId: DEFAULT_ROLE_ID,
  setActiveRole: (activeRoleId) => set({ activeRoleId }),

  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  unreadNotifications: 7,
  clearNotifications: () => set({ unreadNotifications: 0 }),
}))
