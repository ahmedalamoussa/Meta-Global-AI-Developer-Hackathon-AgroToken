"""SQLite storage and append-only hash-chain for demo transactions."""
import hashlib
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path

DEFAULT_DB = Path(__file__).parent / 'agrotoken.db'
ZERO = '0' * 64
MAX_SUPPLY = 21_000_000


def db_path():
    return str(os.getenv('DATABASE_PATH') or DEFAULT_DB)


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


@contextmanager
def connect(write=False):
    con = sqlite3.connect(db_path(), timeout=10, isolation_level=None)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON')
    con.execute('PRAGMA busy_timeout=5000')
    try:
        if write:
            con.execute('BEGIN IMMEDIATE')
        yield con
        if write:
            con.commit()
    except Exception:
        if write:
            con.rollback()
        raise
    finally:
        con.close()


def rowdict(row):
    return dict(row) if row is not None else None


def make_hash(block_id, created_at, kind, actor_id, payload, previous_hash):
    source = {'id': block_id, 'created_at': created_at, 'kind': kind,
              'actor_id': actor_id, 'payload': payload, 'previous_hash': previous_hash}
    return hashlib.sha256(json.dumps(source, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()


def append_block(con, kind, actor_id, payload):
    previous = con.execute('SELECT block_hash FROM ledger ORDER BY id DESC LIMIT 1').fetchone()
    previous_hash = previous['block_hash'] if previous else ZERO
    when = now()
    data = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    cursor = con.execute('INSERT INTO ledger (created_at,kind,actor_id,payload,previous_hash,block_hash) VALUES (?,?,?,?,?,?)',
                         (when, kind, actor_id, data, previous_hash, ''))
    bid = cursor.lastrowid
    hash_value = make_hash(bid, when, kind, actor_id, payload, previous_hash)
    con.execute('UPDATE ledger SET block_hash=? WHERE id=?', (hash_value, bid))
    return {'id': bid, 'block_hash': hash_value, 'previous_hash': previous_hash, 'created_at': when}


def verify_chain(con):
    previous = ZERO
    checked = 0
    for row in con.execute('SELECT * FROM ledger ORDER BY id ASC'):
        try:
            payload = json.loads(row['payload'])
            expected = make_hash(row['id'], row['created_at'], row['kind'], row['actor_id'], payload, row['previous_hash'])
        except (ValueError, TypeError):
            return {'valid': False, 'checked': checked, 'broken_at': row['id']}
        if expected != row['block_hash'] or previous != row['previous_hash']:
            return {'valid': False, 'checked': checked, 'broken_at': row['id']}
        previous = row['block_hash']
        checked += 1
    return {'valid': True, 'checked': checked, 'broken_at': None}


def initialize(reset=False):
    if reset:
        path = Path(db_path())
        if path.exists():
            path.unlink()
    with connect(write=True) as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS farmers (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL,
          wallet_balance INTEGER NOT NULL DEFAULT 0 CHECK(wallet_balance>=0)
        );
        CREATE TABLE IF NOT EXISTS farms (
          id INTEGER PRIMARY KEY AUTOINCREMENT, farmer_id INTEGER NOT NULL REFERENCES farmers(id),
          name TEXT NOT NULL, location TEXT NOT NULL, country TEXT NOT NULL,
          lat REAL NOT NULL, lon REAL NOT NULL, area_ha REAL NOT NULL,
          crop TEXT NOT NULL, stage TEXT NOT NULL, soil TEXT NOT NULL, irrigation TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS proofs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id INTEGER NOT NULL REFERENCES farms(id),
          period_key TEXT NOT NULL, actual_m3 REAL NOT NULL, reference_m3 REAL NOT NULL,
          recommended_m3 REAL NOT NULL, saved_m3 REAL NOT NULL, tokens INTEGER NOT NULL,
          eto_mm_day REAL NOT NULL, rain_mm REAL NOT NULL, days INTEGER NOT NULL,
          data_source TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL,
          block_id INTEGER REFERENCES ledger(id), UNIQUE(farm_id,period_key)
        );
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, emoji TEXT NOT NULL,
          price INTEGER NOT NULL, stock INTEGER NOT NULL, description TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT, farmer_id INTEGER NOT NULL REFERENCES farmers(id),
          product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL,
          total INTEGER NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL REFERENCES farmers(id),
          recipient_id INTEGER NOT NULL REFERENCES farmers(id), amount INTEGER NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL,
          kind TEXT NOT NULL, actor_id INTEGER, payload TEXT NOT NULL,
          previous_hash TEXT NOT NULL, block_hash TEXT NOT NULL
        );
        ''')
        count = c.execute('SELECT COUNT(*) n FROM farmers').fetchone()['n']
        if count:
            return
        c.executemany('INSERT INTO farmers(id,name,region,wallet_balance) VALUES (?,?,?,?)', [
            (1,'Amine Ben Salem','Djerba, Tunisia',0),
            (2,'Sara El Amrani','Marrakech, Morocco',0),
            (3,'Ravi Sharma','Punjab, India',0),
        ])
        c.executemany('''INSERT INTO farms(farmer_id,name,location,country,lat,lon,area_ha,crop,stage,soil,irrigation)
                         VALUES(?,?,?,?,?,?,?,?,?,?,?)''', [
            (1,'Djerba Olive Grove','Djerba','Tunisia',33.8076,10.8451,2.0,'olive','mid','loamy','drip'),
            (2,'Atlas Citrus Farm','Marrakech','Morocco',31.6295,-7.9811,1.4,'citrus','mid','sandy','sprinkler'),
            (3,'Green Punjab','Amritsar','India',31.6340,74.8723,1.2,'wheat','mid','clay','surface'),
        ])
        c.executemany('INSERT INTO products(id,name,category,emoji,price,stock,description) VALUES (?,?,?,?,?,?,?)', [
            (1,'Drip Irrigation Kit','Irrigation','💧',420,18,'Water-saving irrigation kit for a small plot.'),
            (2,'Soil Moisture Sensor','Technology','📡',280,24,'Track soil moisture before irrigating.'),
            (3,'Organic Seed Pack','Seeds','🌱',120,56,'Locally adapted seeds — demo listing.'),
            (4,'Compost Starter','Soil health','🍃',95,32,'Organic soil amendment — demo listing.'),
            (5,'Agronomist Session','Services','👩‍🌾',190,12,'One consultation with an agricultural specialist.'),
            (6,'Water Filter Cartridge','Irrigation','🔧',160,20,'Irrigation system filtration supply.'),
        ])
        append_block(c, 'genesis', None, {'network': 'AgroToken MVP', 'mode': 'local-demo', 'max_supply': MAX_SUPPLY})
        # Consistent demo history, NOT actual independently verified water-saving evidence.
        from agronomy import estimate, evaluate
        calculation = estimate(area_ha=2,crop='olive',stage='mid',soil='loamy',irrigation='drip',
                               eto_mm_day=4.3,rain_mm=4,days=7)
        example_saved = 32.0
        actual = round(calculation['reference_m3'] - example_saved,2)
        value = evaluate(actual, calculation)
        week = (datetime.now(timezone.utc)-timedelta(days=14)).isocalendar()
        period = f'{week.year}-W{week.week:02d}'
        b = append_block(c, 'mint', 1, {'farm_id':1,'period':period,
             'saved_m3':value['saved_m3'],'tokens':value['tokens'],'data_source':'demo_sensor',
             'verification':'SIMULATED_ONLY'})
        c.execute('UPDATE farmers SET wallet_balance=wallet_balance+? WHERE id=1',(value['tokens'],))
        c.execute('''INSERT INTO proofs(farm_id,period_key,actual_m3,reference_m3,recommended_m3,
                    saved_m3,tokens,eto_mm_day,rain_mm,days,data_source,status,created_at,block_id)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                  (1,period,actual,calculation['reference_m3'],calculation['recommended_m3'],
                   value['saved_m3'],value['tokens'],4.3,4,7,'demo_sensor','simulated',now(),b['id']))
