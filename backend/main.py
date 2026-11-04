"""AgroToken demo API. Start: uvicorn main:app --reload --port 8000"""
import json
import os
import sqlite3
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agronomy import CROPS, EFFICIENCY, SOIL_RAIN_FACTOR, estimate, evaluate
from database import (MAX_SUPPLY, append_block, connect, initialize,
                      rowdict, verify_chain, now)

app = FastAPI(title='AgroToken API', version='1.0.0', description='Proof-of-water-savings demonstration (simulated evidence).')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173',
                                                 'http://localhost:4173', 'http://127.0.0.1:4173'],
                   allow_credentials=False, allow_methods=['*'], allow_headers=['*'])
initialize()


class FarmIn(BaseModel):
    farmer_id: int = Field(ge=1)
    name: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=80)
    country: str = Field(min_length=2, max_length=80)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    area_ha: float = Field(ge=.01, le=10000)
    crop: str
    stage: str
    soil: str
    irrigation: str


class EstimateIn(BaseModel):
    farm_id: int = Field(ge=1)
    eto_mm_day: float = Field(ge=0, le=20)
    rain_mm: float = Field(ge=0, le=1000)
    days: int = Field(default=7, ge=1, le=14)
    actual_m3: float | None = Field(default=None, ge=0, le=10_000_000)


class ProofIn(EstimateIn):
    actual_m3: float = Field(ge=0, le=10_000_000)
    period_key: str = Field(pattern=r'^\d{4}-W(?:0[1-9]|[1-4][0-9]|5[0-3])$')
    data_source: str = Field(default='demo_sensor')


class OrderIn(BaseModel):
    farmer_id: int = Field(ge=1)
    product_id: int = Field(ge=1)
    quantity: int = Field(default=1, ge=1, le=10)


class TransferIn(BaseModel):
    sender_id: int = Field(ge=1)
    recipient_id: int = Field(ge=1)
    amount: int = Field(ge=1, le=100_000)


class ChatIn(BaseModel):
    farmer_id: int = Field(default=1, ge=1)
    message: str = Field(min_length=1, max_length=1000)


def farm_by_id(con, fid):
    farm = rowdict(con.execute('SELECT * FROM farms WHERE id=?', (fid,)).fetchone())
    if not farm:
        raise HTTPException(404, 'Farm not found')
    return farm


def farmer_by_id(con, farmer_id):
    farmer = rowdict(con.execute('SELECT * FROM farmers WHERE id=?', (farmer_id,)).fetchone())
    if not farmer:
        raise HTTPException(404, 'Farmer not found')
    return farmer


def ensure_vocab(farm):
    if (farm.crop not in CROPS or farm.stage not in ('initial', 'mid', 'late') or
            farm.soil not in SOIL_RAIN_FACTOR or farm.irrigation not in EFFICIENCY):
        raise HTTPException(422, 'Invalid crop, stage, soil or irrigation option')


def get_calculation(con, data):
    farm = farm_by_id(con, data.farm_id)
    return farm, estimate(area_ha=farm['area_ha'], crop=farm['crop'], stage=farm['stage'],
                           soil=farm['soil'], irrigation=farm['irrigation'],
                           eto_mm_day=data.eto_mm_day, rain_mm=data.rain_mm, days=data.days)


def get_supply(con):
    minted = con.execute("SELECT COALESCE(SUM(tokens),0) AS n FROM proofs WHERE tokens > 0").fetchone()['n']
    return {'minted': minted, 'max_supply': MAX_SUPPLY, 'remaining': MAX_SUPPLY - minted}


@app.get('/api/health')
def health():
    return {'ok': True, 'mode': 'demo', 'assistant': 'meta' if os.getenv('MODEL_API_KEY') else 'local-demo'}


@app.get('/api/bootstrap')
def bootstrap(farmer_id: int = Query(default=1, ge=1)):
    with connect() as c:
        farmer = farmer_by_id(c, farmer_id)
        farmers = [rowdict(r) for r in c.execute('SELECT * FROM farmers ORDER BY id')]
        farms = [rowdict(r) for r in c.execute('SELECT * FROM farms WHERE farmer_id=? ORDER BY id', (farmer_id,))]
        proofs = [rowdict(r) for r in c.execute('''SELECT p.*,f.name AS farm_name FROM proofs p
                      JOIN farms f ON f.id=p.farm_id WHERE f.farmer_id=? ORDER BY p.id DESC LIMIT 24''',(farmer_id,))]
        products = [rowdict(r) for r in c.execute('SELECT * FROM products ORDER BY id')]
        orders = [rowdict(r) for r in c.execute('''SELECT o.*,p.name AS product_name,p.emoji FROM orders o
                         JOIN products p ON p.id=o.product_id WHERE o.farmer_id=? ORDER BY o.id DESC LIMIT 20''',(farmer_id,))]
        ledger = [format_block(r) for r in c.execute('SELECT * FROM ledger ORDER BY id DESC LIMIT 30')]
        chain = verify_chain(c)
        supply = get_supply(c)
        transfers = [rowdict(r) for r in c.execute('''SELECT * FROM transfers WHERE sender_id=? OR recipient_id=?
                                                      ORDER BY id DESC LIMIT 20''',(farmer_id,farmer_id))]
        return {'farmer':farmer,'farmers':farmers,'farms':farms,'proofs':proofs,'products':products,
                'orders':orders,'ledger':ledger,'chain':chain,'supply':supply,'transfers':transfers,
                'meta_connected':bool(os.getenv('MODEL_API_KEY')),
                'demo_mode':True,'crop_catalog':CROPS}


def format_block(row):
    block = rowdict(row)
    block['payload'] = json.loads(block['payload'])
    return block


@app.post('/api/farms', status_code=201)
def create_farm(data: FarmIn):
    ensure_vocab(data)
    with connect(write=True) as c:
        farmer_by_id(c, data.farmer_id)
        cursor = c.execute('''INSERT INTO farms (farmer_id,name,location,country,lat,lon,area_ha,crop,stage,soil,irrigation)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)''',tuple(data.model_dump().values()))
        return farm_by_id(c, cursor.lastrowid)


@app.put('/api/farms/{farm_id}')
def update_farm(farm_id: int, data: FarmIn):
    ensure_vocab(data)
    with connect(write=True) as c:
        current = farm_by_id(c, farm_id)
        if current['farmer_id'] != data.farmer_id:
            raise HTTPException(403, 'Cannot move a farm between owners')
        vals = data.model_dump()
        c.execute('''UPDATE farms SET name=?,location=?,country=?,lat=?,lon=?,area_ha=?,crop=?,stage=?,soil=?,irrigation=?
                  WHERE id=?''', (vals['name'],vals['location'],vals['country'],vals['lat'],vals['lon'],vals['area_ha'],
                                 vals['crop'],vals['stage'],vals['soil'],vals['irrigation'],farm_id))
        return farm_by_id(c, farm_id)


@app.post('/api/estimate')
def estimate_endpoint(data: EstimateIn):
    with connect() as c:
        farm, cal = get_calculation(c, data)
    result = {'farm': farm, 'calculation': cal}
    if data.actual_m3 is not None:
        result['evaluation'] = evaluate(data.actual_m3, cal)
    return result


@app.post('/api/proofs', status_code=201)
def create_proof(data: ProofIn):
    if data.data_source != 'demo_sensor':
        raise HTTPException(422,'Only SIMULATED meter input supported in this MVP; no real verification connected.')
    with connect(write=True) as c:
        farm, calculation = get_calculation(c, data)
        result = evaluate(data.actual_m3, calculation)
        if not result['eligible']:
            raise HTTPException(422, result['reason'])
        # Ensures a duplicate cannot earn tokens repeatedly for the same farm/week.
        if c.execute('SELECT id FROM proofs WHERE farm_id=? AND period_key=?', (farm['id'],data.period_key)).fetchone():
            raise HTTPException(409, 'A proof already exists for this farm and ISO week. Use another week or reset the demo.')
        supply = get_supply(c)
        if result['tokens'] > supply['remaining']:
            raise HTTPException(409, 'Global supply cap reached')
        payload = {'farm_id':farm['id'],'period':data.period_key,'saved_m3':result['saved_m3'],
                   'tokens':result['tokens'],'data_source':'demo_sensor','verification':'SIMULATED_ONLY'}
        block = append_block(c,'mint',farm['farmer_id'],payload)
        cur = c.execute('''INSERT INTO proofs (farm_id,period_key,actual_m3,reference_m3,recommended_m3,
            saved_m3,tokens,eto_mm_day,rain_mm,days,data_source,status,created_at,block_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (farm['id'], data.period_key, data.actual_m3, calculation['reference_m3'],
             calculation['recommended_m3'], result['saved_m3'], result['tokens'],
             data.eto_mm_day,data.rain_mm,data.days,'demo_sensor','simulated',now(),block['id']))
        c.execute('UPDATE farmers SET wallet_balance=wallet_balance+? WHERE id=?',(result['tokens'],farm['farmer_id']))
        return {'id':cur.lastrowid, 'result':result,'block':block,
                'warning':'Reward issued in a local demonstration from simulated meter input; not actual measured water savings.'}


@app.post('/api/orders', status_code=201)
def order_product(data: OrderIn):
    with connect(write=True) as c:
        farmer = farmer_by_id(c,data.farmer_id)
        product = rowdict(c.execute('SELECT * FROM products WHERE id=?',(data.product_id,)).fetchone())
        if not product: raise HTTPException(404,'Product not found')
        cost = product['price']*data.quantity
        if product['stock'] < data.quantity: raise HTTPException(409,'Not enough demo stock')
        if farmer['wallet_balance'] < cost: raise HTTPException(409,'Insufficient AGT balance')
        c.execute('UPDATE farmers SET wallet_balance=wallet_balance-? WHERE id=?',(cost,data.farmer_id))
        c.execute('UPDATE products SET stock=stock-? WHERE id=?',(data.quantity,data.product_id))
        cur = c.execute('INSERT INTO orders(farmer_id,product_id,quantity,total,created_at) VALUES(?,?,?,?,?)',
                        (data.farmer_id,data.product_id,data.quantity,cost,now()))
        block=append_block(c,'redeem',data.farmer_id,
                           {'order_id':cur.lastrowid,'product_id':data.product_id,'quantity':data.quantity,'spent_agt':cost})
        return {'id':cur.lastrowid,'total':cost,'block':block,'status':'demo_order_placed'}


@app.post('/api/transfers',status_code=201)
def transfer_tokens(data:TransferIn):
    if data.sender_id == data.recipient_id: raise HTTPException(422,'Choose another farmer')
    with connect(write=True) as c:
        sender = farmer_by_id(c,data.sender_id)
        farmer_by_id(c,data.recipient_id)
        if sender['wallet_balance'] < data.amount:raise HTTPException(409,'Insufficient AGT balance')
        c.execute('UPDATE farmers SET wallet_balance=wallet_balance-? WHERE id=?',(data.amount,data.sender_id))
        c.execute('UPDATE farmers SET wallet_balance=wallet_balance+? WHERE id=?',(data.amount,data.recipient_id))
        cur=c.execute('INSERT INTO transfers(sender_id,recipient_id,amount,created_at) VALUES(?,?,?,?)',
                      (data.sender_id,data.recipient_id,data.amount,now()))
        block=append_block(c,'transfer',data.sender_id,
                           {'transfer_id':cur.lastrowid,'to_farmer_id':data.recipient_id,'amount':data.amount})
        return {'id':cur.lastrowid,'block':block,'amount':data.amount}


@app.get('/api/ledger/verify')
def verify_ledger():
    with connect() as c: return verify_chain(c)


@app.get('/api/ledger')
def list_ledger(limit:int=Query(default=100,ge=1,le=500)):
    with connect() as c:
        return {'chain':verify_chain(c), 'blocks':[format_block(r) for r in c.execute('SELECT * FROM ledger ORDER BY id DESC LIMIT ?', (limit,))]}


FALLBACK_WEATHER = {'eto_mm_day':4.3,'rain_mm':4.0,'temp_c':24.0}


@app.get('/api/weather')
async def weather(lat: float=Query(ge=-90,le=90), lon:float=Query(ge=-180,le=180)):
    # The provider computes ETo with FAO Penman-Monteith; we consume the series, not fake a forecast.
    params={'latitude':lat,'longitude':lon,
            'daily':'et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max',
            'timezone':'auto','forecast_days':7}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r=await client.get('https://api.open-meteo.com/v1/forecast',params=params)
            r.raise_for_status()
            day=r.json()['daily']
        eto=[float(x) for x in day['et0_fao_evapotranspiration'] if x is not None]
        rain=[float(x) for x in day['precipitation_sum'] if x is not None]
        temps=[float(x) for x in day['temperature_2m_max'] if x is not None]
        if not eto: raise ValueError('Weather provider returned no ETo')
        return {'eto_mm_day':round(sum(eto)/len(eto),2),'rain_mm':round(sum(rain),2),
                'temp_c':round(sum(temps)/len(temps),1) if temps else None,
                'days':len(eto),'source':'Open-Meteo','demo':False}
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return {**FALLBACK_WEATHER,'days':7,'source':'Demo weather fallback (offline)','demo':True}


def local_advice(message, farmer, farms):
    q=message.lower()
    name=farms[0]['name'] if farms else 'your farm'
    if any(k in q for k in ['bitcoin','blockchain','ledger','proof','verif','preuve','verified']):
        return 'AgroToken uses a SHA-256 hash-linked ledger to make later changes detectable. It is NOT a decentralized blockchain and does NOT verify physical water usage. A real launch needs trusted, signed sensor measurements and independent audits.'
    if any(k in q for k in ['token','agt','wallet','solde','balance','reward']):
        return f"Your demo wallet currently holds {farmer['wallet_balance']:,} AGT. Rewards are simulated and not a tradeable cryptocurrency. You can spend them in the demo marketplace or transfer them to another demo farmer."
    if any(k in q for k in ['meteo','weather','rain','pluie','météo']):
        return f"For {name}, open the Water Calculator and click 'Load live forecast' to fetch Open-Meteo's 7-day FAO ETo and rainfall. Confirm the weather source label before using the estimate."
    if any(k in q for k in ['save','econom','eau','water','irrig','olive','crop','soil']):
        return f"On {name}, start with the FAO-56-inspired estimate: crop water use = reference evapotranspiration (ETo) × crop coefficient (Kc). Rainfall and irrigation efficiency affect the suggested volume. Avoid watering below crop requirements just to earn tokens; the current safety check is a demo approximation."
    return f"I can explain AgroToken, {name}'s water calculator, proof-of-savings, and your wallet. Ask: 'How are irrigation needs calculated?' or 'How do I earn AGT?' (Local demo assistant: configure MODEL_API_KEY for real Meta Muse chat.)"


@app.post('/api/chat')
async def chat(data:ChatIn):
    with connect() as c:
        farmer=farmer_by_id(c,data.farmer_id)
        farms=[rowdict(r) for r in c.execute('SELECT * FROM farms WHERE farmer_id=?',(data.farmer_id,))]
    key=os.getenv('MODEL_API_KEY','').strip()
    if not key:
        return {'reply':local_advice(data.message, farmer, farms),'mode':'local-demo','model':None}
    system=("You are AgroAI, an informative agricultural assistant for the AgroToken demo. "
            "Respond in the user's language concisely. Explain the FAO-56-inspired water estimates; do not invent sensor readings, "
            "live weather or a verified farm condition. Never promise token value or crop safety. "
            "AgroToken is a demo, not a real transferable blockchain asset. "
            "For agronomic decisions recommend local specialists. "
            f"Demo farmer: {farmer['name']}. Farm profiles: {json.dumps(farms)}. Wallet: {farmer['wallet_balance']} AGT.")
    try:
        async with httpx.AsyncClient(timeout=22) as client:
            r=await client.post('https://api.meta.ai/v1/chat/completions',
                headers={'Authorization':f'Bearer {key}','Content-Type':'application/json'},
                json={'model':os.getenv('META_MODEL','muse-spark-1.3'),
                      'messages':[{'role':'developer','content':system},{'role':'user','content':data.message}],
                      'max_tokens':350})
            r.raise_for_status()
            reply=r.json()['choices'][0]['message']['content']
        return {'reply':reply,'mode':'meta','model':os.getenv('META_MODEL','muse-spark-1.3')}
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(502,'Meta Model API unavailable. Check MODEL_API_KEY and billing/access, or remove key to use local demo advisor.') from exc


@app.post('/api/demo/reset')
def demo_reset():
    if os.getenv('DEMO_MODE','true').lower() != 'true':
        raise HTTPException(403,'Reset is disabled')
    initialize(reset=True)
    return {'reset': True, 'message':'Demonstration data restored'}

# Zero-build frontend for judges and local demos. React source is also included.
from pathlib import Path
from fastapi.responses import FileResponse
WEB = Path(__file__).resolve().parents[1] / 'frontend'

@app.get('/', include_in_schema=False)
def zero_build_frontend():
    return FileResponse(WEB / 'standalone.html')

@app.get('/standalone.js', include_in_schema=False)
def zero_build_javascript():
    return FileResponse(WEB / 'standalone.js', media_type='application/javascript')

@app.get('/styles.css', include_in_schema=False)
def zero_build_stylesheet():
    return FileResponse(WEB / 'src' / 'styles.css', media_type='text/css')
