export interface Coordinates {
    lat: number
    lng: number
}

export interface SolarResult {
    rank: number
    coordinates: Coordinates
    kwhPerDay: number
}

export interface AnalysisState {
    center: Coordinates
    radiusKm: number
    results: SolarResult[]
    isAnalyzing: boolean
}
