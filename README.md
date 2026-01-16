# Solarized

A solar panel placement tool that finds optimal locations within a given radius.

## Screenshots

| Phoenix, AZ (High Solar) | Denver, CO (Mountain Terrain) |
|--------------------------|-------------------------------|
| ![Phoenix](./screenshots/phoenix.png) | ![Denver](./screenshots/denver.png) |

## Usage

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Leaflet / react-leaflet
- Zustand

## How It Works

Solarized calculates daily solar energy potential (kWh/m²/day) for hundreds of candidate locations, then ranks them by output. It combines real-world irradiance data, terrain elevation analysis, and shading penalties to find optimal sites.

### Irradiance Data (NASA POWER API)

Irradiance values are fetched from NASA's Prediction Of Worldwide Energy Resources (POWER) API:

**API Endpoint**:
```
https://power.larc.nasa.gov/api/temporal/climatology/point
```

**Parameter**: `ALLSKY_SFC_SW_DWN` — All-Sky Surface Shortwave Downward Irradiance

This provides monthly climatological averages of solar radiation reaching the Earth's surface, accounting for:
- Atmospheric absorption
- Cloud cover patterns
- Seasonal variations

The monthly values are averaged to produce a representative daily irradiance in **kWh/m²/day**. If the API is unavailable, a fallback value of 5.0 kWh/m²/day (approximate global average) is used.

### Elevation Data (Open-Meteo API)

Terrain elevation is fetched from the Open-Meteo Elevation API:

**API Endpoint**:
```
https://api.open-meteo.com/v1/elevation
```

Elevations are retrieved in batch for all candidate grid points, enabling efficient terrain analysis. The API returns elevation in **meters above sea level**.

### Grid Point Generation

Candidate locations are distributed across the search radius using:

**Latitude conversion**: 1° ≈ 111 km  
**Longitude conversion**: 1° ≈ 111 × cos(latitude) km

Points are sampled uniformly within a circular area using:
```
r = radius × √(random)
θ = 2π × random
```

### Shading Penalty Calculation

Terrain shading is estimated by analyzing elevation differences between neighboring points:

**Obstruction Angle**:
```
θ = atan2(elevation_diff, distance)
```
where distance is calculated using the Haversine formula.

**Penalty per neighbor**:
```
penalty = min(0.1, θ / (π/4) × 0.1)
```

**Total shading penalty**: Capped at 30% maximum reduction.

### Final Score

Each location receives a score combining irradiance and shading:

```
score = irradiance × (1 - shading_penalty)
```

Results are ranked by score and filtered to ensure minimum spacing (0.3 km) between recommended sites. The top 5 locations are returned with their coordinates and estimated **kWh/m²/day** output.

## References

- Kasten, F. and Young, A.T. (1989). Revised optical air mass tables and approximation formula.
- Duffie, J.A. and Beckman, W.A. (2013). Solar Engineering of Thermal Processes.
