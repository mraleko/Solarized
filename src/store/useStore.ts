import { create } from 'zustand'
import type { Coordinates, SolarResult } from '../types'

interface AppState {
    center: Coordinates
    radiusKm: number
    results: SolarResult[]
    isAnalyzing: boolean
    progress: number
    isPickingLocation: boolean

    setCenter: (center: Coordinates) => void
    setRadiusKm: (radius: number) => void
    setResults: (results: SolarResult[]) => void
    setIsAnalyzing: (analyzing: boolean) => void
    setProgress: (progress: number) => void
    setIsPickingLocation: (picking: boolean) => void
    clearResults: () => void
}

export const useStore = create<AppState>((set) => ({
    center: { lat: 30.2672, lng: -97.7431 },
    radiusKm: 5,
    results: [],
    isAnalyzing: false,
    progress: 0,
    isPickingLocation: false,

    setCenter: (center) => set({ center }),
    setRadiusKm: (radiusKm) => set({ radiusKm }),
    setResults: (results) => set({ results }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    setProgress: (progress) => set({ progress }),
    setIsPickingLocation: (isPickingLocation) => set({ isPickingLocation }),
    clearResults: () => set({ results: [], progress: 0 })
}))
