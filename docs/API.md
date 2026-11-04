# AgroToken REST API

Start backend and browse `http://localhost:8000/docs` for interactive Swagger schemas.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status and model mode |
| GET | `/api/bootstrap?farmer_id=1` | Dashboard, farmer, farms, ledger, wallet, products |
| POST | `/api/farms` | Register demo farm |
| PUT | `/api/farms/{id}` | Edit demo farm |
| GET | `/api/weather?lat=33.8076&lon=10.8451` | Open-Meteo forecast or **labeled** fallback |
| POST | `/api/estimate` | FAO-56-style water estimate, optional reward preview |
| POST | `/api/proofs` | Mint AGT with simulated source, per farm/week |
| POST | `/api/orders` | Spend AGT and update demo marketplace stock |
| POST | `/api/transfers` | Transfer AGT between demo users |
| GET | `/api/ledger` | Blocks + chain integrity summary |
| GET | `/api/ledger/verify` | Recompute chain hashes and links |
| POST | `/api/chat` | Meta Muse (when configured) or labeled local demo |
| POST | `/api/demo/reset` | Reset local seeded demo (disabled if DEMO_MODE=false) |

Example POST `/api/estimate`:

```json
{"farm_id": 1, "eto_mm_day": 4.3, "rain_mm": 4.0, "days": 7}
```

Example POST `/api/proofs`:

```json
{
  "farm_id": 1,
  "eto_mm_day": 4.3,
  "rain_mm": 4.0,
  "days": 7,
  "actual_m3": 500,
  "period_key": "2026-W45",
  "data_source": "demo_sensor"
}
```

The exact eligible reading depends on crop, stage, area and forecast. Obtain the reference/recommended values from `/api/estimate` and choose a volume between the lower screening threshold and reference, as illustrated in the UI. The server will reject under-threshold and duplicate-week requests.

All endpoints are publicly writable within this local demo (except one permission gate on reset). **This is intentional for the hackathon demonstration, not production security.**
