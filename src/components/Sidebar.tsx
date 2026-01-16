import { useState } from 'react'
import { useStore } from '../store/useStore'
import { analyzeSolarPotential } from '../lib/solar'

export function Sidebar() {
    const {
        center,
        radiusKm,
        results,
        isAnalyzing,
        progress,
        isPickingLocation,
        setCenter,
        setRadiusKm,
        setResults,
        setIsAnalyzing,
        setProgress,
        setIsPickingLocation,
        clearResults
    } = useStore()

    const [inputLat, setInputLat] = useState(center.lat.toString())
    const [inputLng, setInputLng] = useState(center.lng.toString())

    const handleLatChange = (value: string) => {
        setInputLat(value)
        const num = parseFloat(value)
        if (!isNaN(num) && num >= -90 && num <= 90) {
            setCenter({ lat: num, lng: center.lng })
        }
    }

    const handleLngChange = (value: string) => {
        setInputLng(value)
        const num = parseFloat(value)
        if (!isNaN(num) && num >= -180 && num <= 180) {
            setCenter({ lat: center.lat, lng: num })
        }
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setProgress(0)
        clearResults()

        try {
            const results = await analyzeSolarPotential(center, radiusKm, setProgress)
            setResults(results)
        } catch (error) {
            console.error('Analysis failed:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Solarized</h1>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Solar panel placement analysis
                </p>
            </div>

            <div className="sidebar-content">
                <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Latitude</label>
                    <input
                        type="number"
                        className="input"
                        value={inputLat}
                        onChange={(e) => handleLatChange(e.target.value)}
                        step="any"
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Longitude</label>
                    <input
                        type="number"
                        className="input"
                        value={inputLng}
                        onChange={(e) => handleLngChange(e.target.value)}
                        step="any"
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            background: isPickingLocation ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                            color: isPickingLocation ? 'white' : 'var(--color-text)',
                            border: '1px solid var(--color-border)'
                        }}
                        onClick={() => setIsPickingLocation(!isPickingLocation)}
                    >
                        {isPickingLocation ? 'Click on map...' : 'Pick on Map'}
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Radius: {radiusKm} km</label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? `Analyzing... ${progress}%` : 'Analyze'}
                </button>

                {results.length > 0 && (
                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'var(--color-surface-alt)',
                            border: '1px solid var(--color-border)'
                        }}
                        onClick={clearResults}
                    >
                        Clear
                    </button>
                )}

                {results.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                            Top Locations
                        </h3>
                        {results.map((result) => (
                            <div key={result.rank} className="result-card">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="result-rank">{result.rank}</span>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                            {result.kwhPerDay.toFixed(2)} kWh/m²/day
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
