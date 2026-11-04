"""Run in backend/: python -m pytest -q"""
import os
import tempfile

import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_PATH', str(tmp_path/'isolated.db'))
    monkeypatch.delenv('MODEL_API_KEY', raising=False)
    from database import initialize
    initialize()
    from main import app
    return TestClient(app)


def test_bootstrap_and_seed(client):
    r=client.get('/api/bootstrap?farmer_id=1')
    assert r.status_code==200
    data=r.json()
    assert data['farmer']['wallet_balance']==320
    assert data['chain']['valid']
    assert data['proofs'][0]['status']=='simulated'


def test_calculator_science(client):
    r=client.post('/api/estimate',json={'farm_id':1,'eto_mm_day':4.3,'rain_mm':4,'days':7})
    assert r.status_code == 200
    c=r.json()['calculation']
    assert c['reference_m3'] > c['recommended_m3'] > c['net_irrigation_m3'] > 0


def test_mint_only_once_per_week(client):
    cal=client.post('/api/estimate',json={'farm_id':1,'eto_mm_day':4.3,'rain_mm':4,'days':7}).json()['calculation']
    body={'farm_id':1,'eto_mm_day':4.3,'rain_mm':4,'days':7,'actual_m3':round(cal['reference_m3']-20,2),
          'period_key':'2026-W51','data_source':'demo_sensor'}
    result=client.post('/api/proofs',json=body)
    assert result.status_code==201, result.text
    assert result.json()['result']['tokens']==200
    assert client.post('/api/proofs',json=body).status_code==409
    assert client.get('/api/bootstrap?farmer_id=1').json()['farmer']['wallet_balance']==520


def test_underwatering_never_rewarded(client):
    body={'farm_id':1,'eto_mm_day':4.3,'rain_mm':4,'days':7,'actual_m3':1,
          'period_key':'2026-W50','data_source':'demo_sensor'}
    assert client.post('/api/proofs',json=body).status_code==422


def test_purchases_transfers_and_chain(client):
    r=client.post('/api/orders',json={'farmer_id':1,'product_id':3,'quantity':1})
    assert r.status_code==201
    assert client.post('/api/transfers',json={'sender_id':1,'recipient_id':2,'amount':40}).status_code==201
    assert client.get('/api/bootstrap?farmer_id=1').json()['farmer']['wallet_balance']==160
    assert client.get('/api/bootstrap?farmer_id=2').json()['farmer']['wallet_balance']==40
    assert client.get('/api/ledger/verify').json()['valid']


def test_ledger_tampering_is_detected(client):
    from database import connect
    with connect(write=True) as con:
        con.execute("UPDATE ledger SET payload=? WHERE id=2", ('{"tokens":99999}',))
    result=client.get('/api/ledger/verify').json()
    assert not result['valid'] and result['broken_at']==2


def test_local_advisor_is_honest(client):
    result=client.post('/api/chat',json={'farmer_id':1,'message':'How are tokens verified?'}).json()
    assert result['mode']=='local-demo'
    assert 'NOT' in result['reply']


def test_weather_returns_explicit_source(client, monkeypatch):
    # No network dependency: stub the HTTPS client with failed connection.
    import httpx
    class BrokenClient:
        def __init__(self,*args,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def get(self,*args,**kwargs): raise httpx.ConnectError('offline')
    monkeypatch.setattr(httpx,'AsyncClient',BrokenClient)
    result=client.get('/api/weather?lat=33.8&lon=10.8').json()
    assert result['demo'] is True
    assert 'fallback' in result['source']


def test_zero_build_frontend_is_served(client):
    assert 'AgroToken' in client.get('/').text
    assert 'async function calculate' in client.get('/standalone.js').text
    assert '.sidebar' in client.get('/styles.css').text


def test_farm_creation_and_update(client):
    payload={
      'farmer_id':1,'name':'Small pilot plot','location':'Valencia','country':'Spain',
      'lat':39.4699,'lon':-.3763,'area_ha':.6,'crop':'grape','stage':'initial',
      'soil':'sandy','irrigation':'sprinkler'
    }
    result=client.post('/api/farms',json=payload)
    assert result.status_code==201
    farm=result.json()
    payload['irrigation']='drip'
    assert client.put('/api/farms/'+str(farm['id']),json=payload).json()['irrigation']=='drip'
    assert client.post('/api/estimate',json={'farm_id':farm['id'],'eto_mm_day':3,'rain_mm':0,'days':7}).status_code==200
