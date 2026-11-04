# AgroToken 🌱 — A kind of Bitcoin for farmers

**A working hackathon MVP of Proof of Water Savings.** Farmers can estimate their irrigation needs, enter **simulated** water-meter readings, earn demo AgroTokens (AGT), send them to other demo farmers, redeem them in a virtual agricultural marketplace, and inspect the verifiable SHA-256 hash-linked transaction history.

> **Important:** This repository is a **prototype**, not an actual cryptocurrency, decentralized blockchain, financial product, verified water-credit scheme, or a certified irrigation planning system. The demo's sensor readings, rewards, products, wallet identities, and initial history are simulated. The cryptographic hash chain detects local record modifications; it does not authenticate water readings or stop the entire database from being rewritten by its administrator.

## 🚀 Quick start — simplest method (no Node.js / npm)

Requires **Python 3.10+** and internet only to install dependencies once.

### Windows / PowerShell

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Linux / macOS

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000/**. This is the fully functional **zero-build** dashboard, so you do **not** need npm or a Meta API key to try the app.

- API docs (Swagger): **http://localhost:8000/docs**
- The standalone dashboard consumes the same actual SQLite/FastAPI backend as the optional React frontend.
- Change demo farmers from the top-right dropdown.
- Click **Reset demo** in the left sidebar to restore seeded data.

Alternative: run `run_demo_windows.bat` (Windows) or `bash run_demo_linux.sh` (Linux/macOS); both install the Python dependencies and start the demo.

## 🖥️ Optional React + Vite + Tailwind frontend

If you want to develop the designed React frontend and have Node.js 20+ and npm:

```bash
# Terminal A
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal B
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173/**. Vite proxies `/api` requests to FastAPI on port 8000.

Build React for production: `cd frontend && npm run build`. The zero-build interface at `:8000` is the recommended out-of-the-box hackathon demo because it needs no JavaScript toolchain or external CDN.

## ✨ Features

| Feature | What works in the MVP |
| --- | --- |
| Multi-farm profiles | Djerba, Marrakech, Punjab examples; create and edit crops, areas, irrigation, coordinates |
| Weather | **Open-Meteo** live 7-day ETo and rainfall; explicitly labeled manual/offline fallback |
| Irrigation calculation | FAO-56-inspired `ETc = ETo × Kc`, effective rain, efficiency adjustment |
| Proof of Water Savings | Demo water-meter volume, screening floor, one mint per farm/ISO week |
| AGT wallet | Persistent balances in SQLite, mint, peer transfer, order redemption |
| AgroMarketplace | 6 illustrative supply listings and atomic wallet/stock updates |
| Ledger | SHA-256 chained block records; `/api/ledger/verify` rechecks integrity |
| AgroAI | Real **Meta Model API / Muse Spark** chat if key available; otherwise clearly labeled local rule-based demo |
| API | FastAPI routes, Pydantic validation, Swagger UI |
| Automated testing | Pytest covers calculation, mint, duplicate prevention, oversaving, purchases, transfers, tampering, chat and weather fallback |

## 🧪 Demo flow (2–3 minutes)

1. Open `http://localhost:8000` and show the **Overview**.
2. Go to **Water Calculator**, select **Djerba Olive Grove**, click **Load live weather** (or manually adjust sample ETo and rainfall), then **Calculate needs**.
3. Go to **Proof of Savings**, adjust the **simulated meter** volume so it is between the suggested lower safety-screening bound and the conventional reference. Choose the current ISO week and **Mint demo AGT**.
4. Open **AgroWallet** to see the balance, optionally send a few AGT to another demo farmer.
5. Open **Marketplace** and redeem a product using AGT.
6. Open **Blockchain Ledger**, see the mint/transfer/redemption events and press **Verify hashes**.
7. In **AgroAI Assistant**, ask how the irrigation needs are calculated. Without a key it explicitly labels its responses **LOCAL DEMO**.

If you already claimed this week for that farm, change the ISO week or reset the demo.

## 🤖 Optional Meta Muse chat

The Meta API key must be supplied **only to the backend**, never placed inside React / HTML / GitHub.

```powershell
# Windows PowerShell, in backend/
$env:MODEL_API_KEY="YOUR_KEY_HERE"
$env:META_MODEL="muse-spark-1.3"
python -m uvicorn main:app --reload --port 8000
```

```bash
# Linux/macOS, in backend/
export MODEL_API_KEY='YOUR_KEY_HERE'
export META_MODEL='muse-spark-1.3'
python3 -m uvicorn main:app --reload --port 8000
```

The backend calls `POST https://api.meta.ai/v1/chat/completions`, using Bearer authentication and `model=muse-spark-1.3`. If the key is missing, the assistant **does not pretend to be Meta AI**; it uses local educational responses. If the remote API fails, it displays an error rather than silently claiming a real result.

Documentation: https://dev.meta.ai/docs/cookbook/quickstart-chat-completions

## 🌦️ Weather + agronomy: method and limitations

Open-Meteo forecast endpoint: https://open-meteo.com/en/docs

For a farm with area `A` hectares, reference evapotranspiration `ETo` in mm/day, crop coefficient `Kc`, and period `d` days:

```text
ETc_mm = ETo_mm_day * Kc * d
Effective_rain_mm = min(ETc_mm, rain_mm * soil_infiltration_factor)
Net_irrigation_m3 = max(0, ETc_mm - Effective_rain_mm) * A_hectares * 10
Recommended_m3 = Net_irrigation_m3 / irrigation_method_efficiency
Conventional_reference_m3 = Net_irrigation_m3 / 0.55
Simulated_savings_m3 = max(0, Conventional_reference_m3 - simulated_meter_m3)
Demo_AGT_issued = floor(Simulated_savings_m3 * 10), capped per period
```

Prototype Kc, soil factors and efficiency assumptions are in [`backend/agronomy.py`](backend/agronomy.py). This is an **educational** FAO-56-inspired water balance, not a certified agricultural baseline. The conventional reference is an **assumed** inefficiency level, not scientifically measured water waste on the particular farm. The minimum threshold (90% of suggested water) is **only a rough screen**, and cannot guarantee crop health. Real incentives must evaluate yield, crop health, groundwater conditions, rebound effects, additionality and reliable physical sensor evidence.

Actual water saved is **not** necessarily `benchmark − metered volume`; real baselines and independent audits are needed.

## 🪙 Token rules (MVP)

- `AGT_PER_M3 = 10` (10 demo AGT per **simulated** m³ saved relative to illustrative conventional baseline).
- Maximum planned supply: **21,000,000 demo AGT**. The limit is enforced on mint; no Bitcoin halving is implemented.
- Transactions only exist in SQLite on your computer. They are not real blockchain transfers, and tokens have **no real monetary value** or guaranteed redemption.
- One mint per farm per ISO week; a lower-bound screening check refuses suspicious under-irrigation readings.
- Each mint, transfer and redemption is recorded in the local SHA-256-linked ledger.

See [architecture](docs/ARCHITECTURE.md) and [API reference](docs/API.md).

## 🧪 Run tests

```bash
cd backend
python -m pytest -q
```

## 📂 Project layout

```text
agrotoken/
├── README.md
├── .gitignore
├── run_demo_windows.bat
├── run_demo_linux.sh
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── backend/
│   ├── main.py                # FastAPI: farms, weather, rewards, wallet, ledger, Meta chat
│   ├── agronomy.py            # ETo/Kc/water-balance estimates and safety screening
│   ├── database.py            # SQLite initialization, SHA-256 chain, demo data
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/test_api.py
├── frontend/
│   ├── standalone.html        # Zero-build dashboard at :8000
│   ├── standalone.js          # Working vanilla JS client
│   ├── index.html             # Optional React/Vite entry
│   ├── src/App.jsx            # React client and full UI
│   ├── src/styles.css         # Shared styles and Tailwind source
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DEMO_SCRIPT.md
    └── demo-preview.png       # Screenshot if available
```

## ⬆️ Publish to GitHub

1. Create an empty **public** GitHub repository called `agrotoken` in your own account.
2. In the project root:

```bash
git init
git add .
git commit -m "Build AgroToken proof-of-water-savings MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrotoken.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. `.env`, private keys, demo DB files and `node_modules` are excluded via `.gitignore`.

**Deployment warning:** The backend intentionally has **no login/authentication** and an open demo reset endpoint for judges. Do not deploy it publicly as a real token system without authentication, authorization, abuse prevention, key management, signed meter data, and operational security. For a judge's live demo, run locally or put behind an access-controlled preview.

## 🛣️ From prototype to production

1. Replace simulated readings with signed, tamper-resistant smart-meter data.
2. Validate crop models with agronomists, satellite data, measured yields, soil moisture and independent auditing; distinguish verified savings from irrigation reduction that harms production.
3. Authenticate farmers, register real farms and control access to their measurements.
4. Design a token-governance and redemption system with real cooperative/merchant partners; assess applicable regulations country by country.
5. Use an appropriately audited ledger or real blockchain only if decentralization is genuinely necessary.

## Attribution

- Agronomic modeling inspired by FAO-56 crop evapotranspiration methodology; parameter values here are illustrative.
- Open-Meteo weather endpoint for optional live ETo/precipitation data.
- Meta Model API for optional Muse Spark answers when user-supplied API key is available.
- No real transaction, merchant, governmental support or physical conservation claim is implied.

**AgroToken — grow more, waste less.**
