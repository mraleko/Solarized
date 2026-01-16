import type { Coordinates, SolarResult } from '../types'

const DEG_TO_RAD = Math.PI / 180

async function fetchIrradiance(lat: number, lng: number): Promise<number> {
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`

    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('NASA POWER API error')

        const data = await response.json()
        const monthly = data.properties.parameter.ALLSKY_SFC_SW_DWN

        let sum = 0
        let count = 0
        for (const [key, value] of Object.entries(monthly)) {
            if (key !== 'ANN' && typeof value === 'number' && value > 0) {
                sum += value
                count++
            }
        }

        return count > 0 ? sum / count : 5.0
    } catch {
        return 5.0
    }
}

async function fetchElevations(coords: Coordinates[]): Promise<number[]> {
    const lats = coords.map(c => c.lat).join(',')
    const lngs = coords.map(c => c.lng).join(',')
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`

    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Open-Meteo API error')

        const data = await response.json()
        return data.elevation || coords.map(() => 0)
    } catch {
        return coords.map(() => 0)
    }
}

function calculateShadingPenalty(
    elevation: number,
    neighborElevations: number[],
    neighborDistances: number[]
): number {
    let penalty = 0

    for (let i = 0; i < neighborElevations.length; i++) {
        const elevDiff = neighborElevations[i] - elevation
        if (elevDiff > 0) {
            const dist = neighborDistances[i]
            const angle = Math.atan2(elevDiff, dist * 1000)
            penalty += Math.min(0.1, angle / (Math.PI / 4) * 0.1)
        }
    }

    return Math.min(0.3, penalty)
}

function generateGridPoints(center: Coordinates, radiusKm: number): Coordinates[] {
    const points: Coordinates[] = []
    const count = Math.min(100, Math.max(50, Math.round(radiusKm * radiusKm * 2)))

    const seed = Math.floor(center.lat * 1000 + center.lng * 100 + radiusKm)
    let rng = seed >>> 0
    const random = () => {
        rng = (rng * 1664525 + 1013904223) % 4294967296
        return rng / 4294967296
    }

    for (let i = 0; i < count; i++) {
        const r = radiusKm * Math.sqrt(random())
        const theta = 2 * Math.PI * random()
        const x = r * Math.cos(theta)
        const y = r * Math.sin(theta)

        const latKm = 111
        const lngKm = 111 * Math.cos(center.lat * DEG_TO_RAD)

        points.push({
            lat: center.lat + y / latKm,
            lng: center.lng + x / lngKm
        })
    }

    return points
}

function getDistance(a: Coordinates, b: Coordinates): number {
    const R = 6371
    const dLat = (b.lat - a.lat) * DEG_TO_RAD
    const dLng = (b.lng - a.lng) * DEG_TO_RAD
    const sinLat = Math.sin(dLat / 2)
    const sinLng = Math.sin(dLng / 2)
    const h = sinLat * sinLat + Math.cos(a.lat * DEG_TO_RAD) * Math.cos(b.lat * DEG_TO_RAD) * sinLng * sinLng
    return 2 * R * Math.asin(Math.sqrt(h))
}

export async function analyzeSolarPotential(
    center: Coordinates,
    radiusKm: number,
    onProgress?: (percent: number) => void
): Promise<SolarResult[]> {
    onProgress?.(5)

    const points = generateGridPoints(center, radiusKm)

    onProgress?.(10)
    const irradiance = await fetchIrradiance(center.lat, center.lng)

    onProgress?.(30)
    const batchSize = 100
    const elevations: number[] = []

    for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize)
        const batchElevations = await fetchElevations(batch)
        elevations.push(...batchElevations)
        onProgress?.(30 + Math.round((i / points.length) * 40))
    }

    onProgress?.(70)

    const candidates: { coordinates: Coordinates; score: number; elevation: number }[] = []

    for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const elev = elevations[i]

        const neighbors: number[] = []
        const distances: number[] = []

        for (let j = 0; j < points.length; j++) {
            if (i !== j) {
                const dist = getDistance(point, points[j])
                if (dist < 2) {
                    neighbors.push(elevations[j])
                    distances.push(dist)
                }
            }
        }

        const shadingPenalty = calculateShadingPenalty(elev, neighbors, distances)
        const score = irradiance * (1 - shadingPenalty)

        candidates.push({ coordinates: point, score, elevation: elev })
    }

    onProgress?.(90)

    candidates.sort((a, b) => b.score - a.score)

    const results: SolarResult[] = []
    const minSpacing = 0.3

    for (const candidate of candidates) {
        if (results.length >= 5) break

        const tooClose = results.some(r =>
            getDistance(candidate.coordinates, r.coordinates) < minSpacing
        )

        if (!tooClose) {
            results.push({
                rank: results.length + 1,
                coordinates: candidate.coordinates,
                kwhPerDay: candidate.score
            })
        }
    }

    onProgress?.(100)
    return results
}
