import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/useStore'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapEvents() {
    const { isPickingLocation, setCenter, setIsPickingLocation } = useStore()

    useMapEvents({
        click: (e) => {
            if (isPickingLocation) {
                setCenter({ lat: e.latlng.lat, lng: e.latlng.lng })
                setIsPickingLocation(false)
            }
        }
    })

    return null
}

function MapUpdater() {
    const { center } = useStore()
    const map = useMap()
    const prevCenter = useRef(center)

    useEffect(() => {
        if (prevCenter.current.lat !== center.lat || prevCenter.current.lng !== center.lng) {
            map.setView([center.lat, center.lng])
            prevCenter.current = center
        }
    }, [center, map])

    return null
}

export function Map() {
    const { center, radiusKm, results, isPickingLocation } = useStore()

    const createRankIcon = (rank: number) => L.divIcon({
        className: 'rank-marker',
        html: `<div style="
      width: 24px;
      height: 24px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${rank}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })

    return (
        <div className="map-container">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Circle
                    center={[center.lat, center.lng]}
                    radius={radiusKm * 1000}
                    pathOptions={{
                        color: isPickingLocation ? '#2563eb' : '#666666',
                        fillColor: isPickingLocation ? '#2563eb' : '#666666',
                        fillOpacity: 0.1,
                        weight: 2
                    }}
                />

                <Marker position={[center.lat, center.lng]}>
                    <Popup>
                        <div>
                            <strong>Center</strong><br />
                            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                        </div>
                    </Popup>
                </Marker>

                {results.map((result) => (
                    <Marker
                        key={result.rank}
                        position={[result.coordinates.lat, result.coordinates.lng]}
                        icon={createRankIcon(result.rank)}
                    >
                        <Popup>
                            <div>
                                <strong>#{result.rank}</strong><br />
                                {result.kwhPerDay.toFixed(2)} kWh/m²/day<br />
                                <span style={{ fontSize: '11px', color: '#666' }}>
                                    {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapEvents />
                <MapUpdater />
            </MapContainer>
        </div>
    )
}
