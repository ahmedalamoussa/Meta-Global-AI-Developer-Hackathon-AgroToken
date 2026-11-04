import React, {useEffect, useMemo, useState, useRef} from 'react'
import {
  Sprout, LayoutDashboard, Droplets, Coins, ShoppingBag, Blocks, Bot, Settings2, Leaf,
  ArrowUpRight, ArrowRight, ArrowDownLeft, CircleCheck, ShieldCheck, CloudSun, RefreshCw,
  MapPin, ChevronDown, Plus, TrendingUp, Activity, Send, LoaderCircle, CalendarDays,
  SearchCheck, Wallet, ArrowLeftRight, Copy, ExternalLink, Info, Menu, X, Sun, Wind,
  ChartNoAxesCombined, Thermometer, Gauge, LockKeyhole, BadgeCheck, Globe2, AlertCircle,
  ScanLine, CircleHelp, Check, Sparkles, Gift, BadgeInfo, ChevronRight
} from 'lucide-react'

const API = '/api'
const nf = (v,d=0) => Number(v||0).toLocaleString('en-US',{maximumFractionDigits:d})
const short = str => str ? `${str.slice(0,10)}…${str.slice(-7)}` : '—'
const weekNow = () => {
  const d = new Date(); d.setUTCHours(0,0,0,0); d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7))
  const year=d.getUTCFullYear(); const start=new Date(Date.UTC(year,0,1)); const week=Math.ceil((((d-start)/86400000)+1)/7)
  return `${year}-W${String(week).padStart(2,'0')}`
}
const cities=[
  {location:'Djerba',country:'Tunisia',lat:33.8076,lon:10.8451},
  {location:'Médenine',country:'Tunisia',lat:33.3549,lon:10.5055},
  {location:'Marrakech',country:'Morocco',lat:31.6295,lon:-7.9811},
  {location:'Valencia',country:'Spain',lat:39.4699,lon:-.3763},
  {location:'Fresno',country:'United States',lat:36.7378,lon:-119.7871},
  {location:'Amritsar',country:'India',lat:31.6340,lon:74.8723},
  {location:'Alexandria',country:'Egypt',lat:31.2001,lon:29.9187}
]
const crops=[['olive','Olive trees'],['tomato','Tomatoes'],['wheat','Wheat'],['citrus','Citrus'],['grape','Grapes'],['rice','Rice'],['date_palm','Date palms']]
const stages=[['initial','Early growth'],['mid','Mid-season'],['late','Late season']]
const soils=[['sandy','Sandy'],['loamy','Loamy'],['clay','Clay']]
const methods=[['drip','Drip irrigation'],['sprinkler','Sprinkler'],['surface','Surface / flood']]
const nav=[
  ['Overview', LayoutDashboard],['My Farms', Sprout],['Water Calculator', Droplets],
  ['Proof of Savings', ScanLine],['AgroWallet', Wallet],['Marketplace', ShoppingBag],
  ['Blockchain Ledger', Blocks],['AgroAI Assistant', Bot]
]
const defaultFarm={name:'My new farm',location:'Djerba',country:'Tunisia',lat:33.8076,lon:10.8451,area_ha:1,crop:'olive',stage:'mid',soil:'loamy',irrigation:'drip'}

async function request(path,opts={}) {
  let response
  try { response=await fetch(API+path, {headers:{'Content-Type':'application/json'},...opts}) }
  catch { throw new Error('Cannot reach backend. Start FastAPI at http://localhost:8000.') }
  const data=await response.json().catch(()=>({}))
  if(!response.ok) {
    const err=data.detail
    const description=Array.isArray(err)?err.map(x=>x.msg).join('; '):err
    throw new Error(description||`Request failed (${response.status})`)
  }
  return data
}
function Pill({children,tone='green',icon: Icon}) {return <span className={`pill pill-${tone}`}>{Icon&&<Icon size={13}/>} {children}</span>}
function SectionTitle({eyebrow,title,description,action}) {return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action}</div>}
function Label({children}) {return <span className="field-label">{children}</span>}
function Select({label,options,value,onChange}) {return <label className="form-field"><Label>{label}</Label><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(([k,t])=><option value={k} key={k}>{t}</option>)}</select></label>}
function NumberField({label,value,onChange,min=0,step='any',hint}) {return <label className="form-field"><Label>{label}</Label><input type="number" min={min} step={step} value={value} onChange={e=>onChange(e.target.value)}/>{hint&&<small>{hint}</small>}</label>}
function Empty({children}){return <div className="empty-state"><Sprout size={27}/><p>{children}</p></div>}
function FarmArt(){return <svg viewBox="0 0 420 250" fill="none" role="img" aria-label="Stylized green farmland" className="farm-art">
  <ellipse cx="300" cy="235" rx="140" ry="24" fill="#3D7459" opacity=".24"/>
  <circle cx="324" cy="61" r="31" fill="#EFD68D" opacity=".95"/>
  <path d="M35 176C105 126 169 139 236 157C305 176 349 158 420 114V250H35Z" fill="#5F9A71"/>
  <path d="M11 227C94 159 174 169 244 182C309 193 358 154 420 140V250H11Z" fill="#40825C"/>
  <path d="M74 245C148 194 221 194 293 197C341 201 391 184 430 167" stroke="#A9CF98" strokeWidth="14" strokeLinecap="round"/>
  <path d="M131 253C200 206 276 215 351 214C381 213 410 207 430 198" stroke="#A9CF98" strokeWidth="13" strokeLinecap="round"/>
  <path d="M211 254C257 227 321 230 367 230C388 229 407 227 430 221" stroke="#A9CF98" strokeWidth="12" strokeLinecap="round"/>
  <path d="M88 195L88 136M153 193L153 126M314 179L314 121M360 162L360 103" stroke="#F4F5DD" strokeWidth="5" strokeLinecap="round"/>
  {[88,153,314,360].map((x,i)=><g key={x}><circle cx={x} cy={[131,121,116,100][i]} r={[21,27,23,28][i]} fill="#A1C98C"/><circle cx={x-11} cy={[125,114,110,94][i]} r="14" fill="#74B58A"/><circle cx={x+7} cy={[120,116,107,89][i]} r="15" fill="#C2DAA0"/></g>)}
  <path d="M29 240L114 205L157 208L75 249" fill="#DBE7BC" opacity=".6"/>
  <path d="M261 159L298 127L329 149V179H261V159Z" fill="#F1EBD4"/><path d="M252 161L296 115L341 153" fill="#DCC996"/><rect x="288" y="151" width="14" height="28" fill="#3F7155"/>
</svg>}

function MiniBars({proofs}) {
  const history=[...proofs].reverse().slice(-7)
  const max=Math.max(...history.map(p=>p.saved_m3),1)
  return <div className="chart-area">
    <div className="chart-lines"><span>Water saved (m³)</span><span>{nf(max,1)}</span></div>
    <div className="chart-bars">{history.length?history.map((p,i)=><div className="chart-column" key={p.id} title={`${nf(p.saved_m3,2)} m³ in ${p.period_key}`}><div className="chart-bar" style={{height:`${Math.max(12,p.saved_m3/max*100)}%`}}/><span>{p.period_key.slice(-3)}</span></div>):<p className="muted">Record your first proof to see a trend.</p>}</div>
  </div>
}
function Stat({icon:Icon,label,value,unit,foot,accent='green'}){return <div className="stat-card"><div className={`stat-icon ${accent}`}><Icon size={21}/></div><div className="stat-label">{label}</div><div className="stat-value">{value} <span>{unit}</span></div><div className="stat-foot">{foot}</div></div>}
function BlockEntry({block}) {const names={genesis:'Genesis block',mint:'AGT minted',redeem:'Marketplace redemption',transfer:'Peer transfer'}
  return <div className="block-entry"><div className={`block-type ${block.kind}`}><Blocks size={16}/></div><div className="block-body"><div className="block-line"><strong>#{block.id} · {names[block.kind]||block.kind}</strong><span>{new Date(block.created_at).toLocaleDateString()}</span></div><div className="block-hash">{short(block.block_hash)}</div><div className="block-description">{block.kind==='mint'?`${nf(block.payload.tokens)} AGT • ${nf(block.payload.saved_m3,1)} m³ claimed (simulation)`:block.kind==='redeem'?`${nf(block.payload.spent_agt)} AGT redeemed`:block.kind==='transfer'?`${nf(block.payload.amount)} AGT transferred`:'The first block of the local demo ledger'}</div></div><CircleCheck size={17} className="ok-icon"/></div>
}

export default function App(){
  const [page,setPage]=useState('Overview'),[drawer,setDrawer]=useState(false)
  const [farmerId,setFarmerId]=useState(1),[data,setData]=useState(null),[loading,setLoading]=useState(true)
  const [error,setError]=useState(''),[toast,setToast]=useState(null),[busy,setBusy]=useState('')
  const [farmId,setFarmId]=useState(null),[editingFarm,setEditingFarm]=useState(null),[showFarmForm,setShowFarmForm]=useState(false)
  const [weather,setWeather]=useState({eto_mm_day:'4.3',rain_mm:'4',days:7,source:'Sample inputs • edit or load live forecast',demo:true})
  const [calc,setCalc]=useState(null),[actual,setActual]=useState(''),[period,setPeriod]=useState(weekNow())
  const [transferTo,setTransferTo]=useState(2),[transferAmount,setTransferAmount]=useState('50')
  const [question,setQuestion]=useState(''),[chatBusy,setChatBusy]=useState(false)
  const [chatMessages,setChatMessages]=useState([{role:'assistant',content:'Hi! I’m AgroAI 🌱 Ask how water needs are estimated, how AGT rewards work, or what your farm can do to conserve water.',mode:'intro'}])
  const chatEnd=useRef(null)

  const flash=(message,kind='success')=>{setToast({message,kind});setTimeout(()=>setToast(null),5200)}
  const load=async (id=farmerId)=>{
    try { const res=await request(`/bootstrap?farmer_id=${id}`);setData(res);setError('');setFarmId(previous=>res.farms.some(f=>f.id===previous)?previous:res.farms[0]?.id||null) }
    catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{setLoading(true);setFarmId(null);setTransferTo(farmerId===1?2:1);load(farmerId)},[farmerId])
  const farm=useMemo(()=>data?.farms.find(x=>x.id===farmId)||data?.farms[0]||null,[data,farmId])
  const body={farm_id:farm?.id,eto_mm_day:Number(weather.eto_mm_day),rain_mm:Number(weather.rain_mm),days:Number(weather.days)}
  useEffect(()=>{if(!farm)return;let active=true
    request('/estimate',{method:'POST',body:JSON.stringify({farm_id:farm.id,eto_mm_day:Number(weather.eto_mm_day),rain_mm:Number(weather.rain_mm),days:Number(weather.days)})})
      .then(r=>{if(active){setCalc(r.calculation);setActual(prev=>prev===''?String(Math.round((r.calculation.recommended_m3+r.calculation.reference_m3)/2)):prev)}})
      .catch(e=>{if(active){setCalc(null);setError(e.message)}})
    return ()=>{active=false}
  },[farm?.id,weather.eto_mm_day,weather.rain_mm,weather.days, data?.farms.length])
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:'smooth',block:'nearest'})},[chatMessages,chatBusy,page])
  const totalSaved=data?.proofs.reduce((a,x)=>a+x.saved_m3,0)||0
  const totalEarned=data?.proofs.reduce((a,x)=>a+x.tokens,0)||0
  const recent=data?.ledger||[]
  const setAndGo=x=>{setPage(x);setDrawer(false);window.scrollTo({top:0,behavior:'smooth'})}
  const doAction=async (name,fn)=>{setBusy(name);try{await fn()}catch(e){flash(e.message,'error')}finally{setBusy('')}}
  const refreshWeather=()=>doAction('weather',async()=>{
    if(!farm)throw Error('Select or create a farm first')
    const w=await request(`/weather?lat=${farm.lat}&lon=${farm.lon}`)
    setWeather({...w,eto_mm_day:String(w.eto_mm_day),rain_mm:String(w.rain_mm)})
    setActual('');flash(w.demo?'Using clearly labeled fallback weather.':'Live Open-Meteo 7-day forecast loaded.')
  })
  const claim=()=>doAction('mint',async()=>{
    if(!farm||!calc)throw Error('Calculate water use first')
    const value=Number(actual)
    if(actual===''||!Number.isFinite(value))throw Error('Enter a simulated meter reading.')
    const res=await request('/proofs',{method:'POST',body:JSON.stringify({...body,actual_m3:value,period_key:period,data_source:'demo_sensor'})})
    await load();flash(`${nf(res.result.tokens)} demo AGT minted from ${nf(res.result.saved_m3,1)} m³ simulated savings!`);setAndGo('AgroWallet')
  })
  const purchase=product=>doAction(`buy-${product.id}`,async()=>{
    const r=await request('/orders',{method:'POST',body:JSON.stringify({farmer_id:farmerId,product_id:product.id,quantity:1})})
    await load();flash(`Demo purchase complete: ${product.name} for ${r.total} AGT.`)
  })
  const transfer=()=>doAction('transfer',async()=>{
    await request('/transfers',{method:'POST',body:JSON.stringify({sender_id:farmerId,recipient_id:Number(transferTo),amount:Number(transferAmount)})})
    await load();flash(`${nf(transferAmount)} AGT transferred successfully in demo.`)
  })
  const saveFarm=()=>doAction('save-farm',async()=>{
    if(!editingFarm) return
    const fields={...editingFarm,farmer_id:farmerId,lat:Number(editingFarm.lat),lon:Number(editingFarm.lon),area_ha:Number(editingFarm.area_ha)}
    const id=editingFarm.id
    const res=await request(id?`/farms/${id}`:'/farms',{method:id?'PUT':'POST',body:JSON.stringify(fields)})
    setShowFarmForm(false);setEditingFarm(null);await load();setFarmId(res.id);setActual('');flash(id?'Farm updated':'Farm added!')
  })
  const reset=()=>{if(!window.confirm('Reset ALL demo wallet balances, purchases, proofs and farms?'))return
    doAction('reset',async()=>{await request('/demo/reset',{method:'POST'});setFarmerId(1);setFarmId(null);setActual('');await load(1);flash('Demo data reset to initial state')})}
  const sendChat=async(q)=>{
    const msg=(q||question).trim();if(!msg||chatBusy)return
    setQuestion('');setChatMessages(old=>[...old,{role:'user',content:msg}]);setChatBusy(true)
    try {const res=await request('/chat',{method:'POST',body:JSON.stringify({farmer_id:farmerId,message:msg})})
      setChatMessages(old=>[...old,{role:'assistant',content:res.reply,mode:res.mode}])}
    catch(e){setChatMessages(old=>[...old,{role:'assistant',content:e.message,mode:'error'}])}finally{setChatBusy(false)}
  }

  const NavContent=()=> <><div className="brand"><div className="brand-mark"><Leaf size={23} strokeWidth={2.6}/></div><span>agro<span className="brand-light">token</span><small>WATER ECONOMY</small></span></div>
    <div className="nav-label">WORKSPACE</div><nav>{nav.map(([name,Icon])=><button key={name} className={`nav-link ${page===name?'active':''}`} onClick={()=>setAndGo(name)}><Icon size={19}/><span>{name}</span>{page===name&&<span className="nav-active-dot"/>}</button>)}</nav>
    <div className="nav-bottom"><div className="planet-panel"><div className="planet-icon"><Globe2 size={19}/></div><strong>Every drop counts.</strong><p>Grow a smarter agricultural economy.</p><button onClick={()=>setAndGo('Proof of Savings')}>Start saving <ArrowRight size={14}/></button></div><button className="reset-button" onClick={reset}><RefreshCw size={14}/> Reset demo data</button></div>
  </>
  if(loading&&!data)return <div className="startup"><div className="startup-symbol"><Leaf size={36}/></div><h2>Growing AgroToken...</h2><p>Connecting to your demo workspace</p></div>
  if(error&&!data)return <div className="startup"><AlertCircle size={38} color="#b45f45"/><h2>Cannot connect to the API</h2><p>{error}</p><div className="code-inline">cd backend &amp;&amp; uvicorn main:app --reload</div><button className="btn btn-primary" onClick={()=>{setLoading(true);load()}}>Try again</button></div>
  const evalActual=calc&&actual!==''?(()=>{const val=Number(actual);const valid=val>=calc.lower_screening_m3&&val<calc.reference_m3&&calc.reference_m3>0
    return {valid,saved:Math.max(0,calc.reference_m3-val),tokens:Math.min(Math.floor(Math.max(0,calc.reference_m3-val)*10),50000),tooLow:val<calc.lower_screening_m3}})():null
  return <div className="app-shell">
    <aside className="sidebar">{NavContent()}</aside>
    {drawer&&<div className="mobile-layer"><div className="mobile-overlay" onClick={()=>setDrawer(false)}/><aside className="mobile-sidebar"><button className="mobile-close" onClick={()=>setDrawer(false)}><X size={20}/></button>{NavContent()}</aside></div>}
    <div className="workspace">
      <header className="topbar"><div className="topbar-start"><button className="menu-trigger" onClick={()=>setDrawer(true)} aria-label="Open menu"><Menu/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/><strong>{page}</strong></div></div>
        <div className="topbar-end"><span className="environment"><span/> DEMO ENVIRONMENT</span><div className="top-divider"/><div className="top-farmer"><div className="avatar">{data.farmer.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div className="top-farmer-text"><strong>{data.farmer.name}</strong><small>{data.farmer.region}</small></div><ChevronDown size={14}/><select className="account-selector" aria-label="Switch demo farmer" value={farmerId} onChange={e=>{setFarmerId(+e.target.value);setActual('')}}>{data.farmers.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div></div></header>
      <main className="main-content">
        {page==='Overview'&&<>
          <div className="overview-intro"><div><div className="eyebrow">YOUR SUSTAINABILITY DASHBOARD</div><h1>Good morning, {data.farmer.name.split(' ')[0]} <span>👋</span></h1><p>Every drop saved is progress. Here's your farm's impact at a glance.</p></div><button className="btn btn-outline" onClick={()=>setAndGo('My Farms')}><Sprout size={16}/> Manage farms</button></div>
          <div className="hero-banner"><div className="hero-copy"><div className="hero-tag"><Sparkles size={14}/> INTRODUCING PROOF OF WATER SAVINGS</div><h2>Save water.<br/><em>Earn value.</em></h2><p>The first step toward a world where farmers are rewarded for sustainable water use.</p><button className="hero-btn" onClick={()=>setAndGo('Proof of Savings')}>Earn AgroTokens <ArrowUpRight size={17}/></button></div><FarmArt/></div>
          <div className="stats-grid"><Stat icon={Droplets} label="Documented demo savings" value={nf(totalSaved,1)} unit="m³" foot="Across simulated proof records"/><Stat icon={Coins} label="Wallet balance" value={nf(data.farmer.wallet_balance)} unit="AGT" foot="Demo tokens available" accent="gold"/><Stat icon={Sprout} label="Your farms" value={nf(data.farms.length)} unit="active" foot="Across your demo locations" accent="blue"/><Stat icon={ShieldCheck} label="Ledger integrity" value={data.chain.valid?'Valid':'Broken'} unit="" foot={`${data.chain.checked} blocks checked`} accent="purple"/></div>
          <div className="two-panel"><div className="panel"><div className="panel-header"><div><h3>Water savings activity</h3><p>Based on recorded simulated proofs</p></div><Pill tone="green" icon={TrendingUp}>{nf(totalSaved,1)} m³ total</Pill></div><MiniBars proofs={data.proofs}/></div>
          <div className="panel"><div className="panel-header"><div><h3>Recent network activity</h3><p>Verifiable local ledger events</p></div><button className="text-link" onClick={()=>setAndGo('Blockchain Ledger')}>View all <ArrowRight size={15}/></button></div><div className="activity-list">{recent.slice(0,4).map(b=><BlockEntry key={b.id} block={b}/>)}</div></div></div>
          <div className="bottom-banner"><div className="lightbulb"><Bot size={26}/></div><div><h3>Need advice for your next irrigation?</h3><p>Ask AgroAI about crop water needs, weather and earning rewards.</p></div><button className="btn btn-primary" onClick={()=>setAndGo('AgroAI Assistant')}>Chat with AgroAI <ArrowRight size={16}/></button></div>
        </>}

        {page==='My Farms'&&<>
          <SectionTitle eyebrow="FARM MANAGEMENT" title="Your agricultural spaces" description="Manage land, crops and irrigation configurations across locations." action={<button className="btn btn-primary" onClick={()=>{setEditingFarm({...defaultFarm});setShowFarmForm(true)}}><Plus size={16}/> Add a farm</button>}/>
          <div className="farm-grid">{data.farms.length?data.farms.map(f=><div className="farm-card" key={f.id}><div className="farm-cover"><div className="farm-cover-shape"><FarmArt/></div><Pill icon={MapPin}>{f.location}, {f.country}</Pill></div><div className="farm-card-content"><div className="farm-card-title"><h3>{f.name}</h3><span className="farm-crop">{crops.find(x=>x[0]===f.crop)?.[1]||f.crop}</span></div><div className="farm-metrics"><div><span>Land area</span><strong>{nf(f.area_ha,2)} ha</strong></div><div><span>Soil</span><strong>{f.soil}</strong></div><div><span>Irrigation</span><strong>{f.irrigation}</strong></div></div><button className="btn btn-outline block" onClick={()=>{setEditingFarm({...f});setShowFarmForm(true)}}><Settings2 size={15}/> Edit farm details</button><button className="inline-action" onClick={()=>{setFarmId(f.id);setActual('');setAndGo('Water Calculator')}}>Calculate water needs <ArrowRight size={15}/></button></div></div>):<Empty>Add a farm to begin tracking water use.</Empty>}</div>
          <div className="hint-box"><Info size={18}/><span>Farm profiles are saved locally in SQLite. Locations outside Tunisia are supported through coordinates and Open-Meteo forecasts.</span></div>
        </>}

        {page==='Water Calculator'&&<>
          <SectionTitle eyebrow="SCIENCE-BASED PLANNING" title="Water needs calculator" description="Estimate irrigation needs using a FAO-56-inspired water balance and real forecast inputs." action={<Pill icon={Gauge}>Prototype model</Pill>}/>
          <div className="calculator-grid"><div className="panel padded"><h3 className="panel-main-title">Your farm & weather</h3><p className="panel-sub">Adjust input values to explore weekly irrigation needs.</p>
            <label className="form-field"><Label>Select farm</Label><select value={farm?.id||''} onChange={e=>{setFarmId(+e.target.value);setActual('')}}>{data.farms.map(f=><option key={f.id} value={f.id}>{f.name} — {f.location}</option>)}</select></label>
            {farm&&<div className="location-strip"><MapPin size={16}/>{farm.location}, {farm.country} <span>· {farm.area_ha} ha · {farm.crop}</span></div>}
            <div className="form-two"><NumberField label="Reference ETo (mm/day)" value={weather.eto_mm_day} onChange={v=>{setWeather(w=>({...w,eto_mm_day:v,source:'Manual entry',demo:true}));setActual('')}} step="0.1"/><NumberField label="7-day rainfall (mm)" value={weather.rain_mm} onChange={v=>{setWeather(w=>({...w,rain_mm:v,source:'Manual entry',demo:true}));setActual('')}} step="0.1"/></div>
            <div className="weather-strip"><CloudSun size={21}/><div><strong>{weather.source}</strong><small>{weather.demo?'Demo or manually entered weather':'Forecast obtained from Open-Meteo'}</small></div></div>
            <button className="btn btn-outline block" disabled={busy==='weather'} onClick={refreshWeather}>{busy==='weather'?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Load live 7-day forecast</button>
            <div className="divider-space"/><h3 className="panel-main-title">How we calculate</h3><div className="formula-box"><span>Crop evapotranspiration</span><strong>ETc = ETo × Kc</strong><small>Then subtract effective rainfall and adjust for irrigation efficiency.</small></div><p className="fine-print">Crop factors are illustrative. Soil moisture, growth conditions and measured field data must be validated before real irrigation decisions.</p>
          </div><div className="results-column"><div className="result-main"><div className="result-heading"><div className="result-icon"><Droplets size={23}/></div><Pill tone="light">ESTIMATED / 7 DAYS</Pill></div><p>Suggested irrigation volume</p><div className="mega-number">{nf(calc?.recommended_m3,1)} <span>m³</span></div><div className="result-divider"/><div className="result-details"><div><span>Conventional reference</span><strong>{nf(calc?.reference_m3,1)} m³</strong></div><div><span>Potential efficiency gain</span><strong>{nf(calc?.potential_savings_m3,1)} m³</strong></div><div><span>Crop coefficient (Kc)</span><strong>{calc?.kc||'—'}</strong></div><div><span>Effective rainfall</span><strong>{nf(calc?.effective_rain_mm,1)} mm</strong></div></div></div><div className="panel insight"><Sparkles size={23}/><div><h3>A smarter way to irrigate</h3><p>The estimate combines crop stage, area, soil, reference ETo and irrigation method. Use it to compare scenarios rather than as a guaranteed safe irrigation prescription.</p><button className="text-link" onClick={()=>setAndGo('Proof of Savings')}>Simulate your water saving <ArrowRight size={15}/></button></div></div></div></div>
        </>}

        {page==='Proof of Savings'&&<>
          <SectionTitle eyebrow="THE HEART OF AGROTOKEN" title="Proof of Water Savings" description="Simulate a measured irrigation period, screen the result and mint demo AGT rewards." action={<Pill tone="yellow" icon={Info}>Simulated sensor data</Pill>}/>
          <div className="proof-grid"><div className="panel padded"><div className="proof-step"><span>01</span><div><h3>Choose your farm</h3><p>Your reward is tied to a specific farm and ISO week.</p></div></div><label className="form-field"><Label>Farm</Label><select value={farm?.id||''} onChange={e=>{setFarmId(+e.target.value);setActual('')}}>{data.farms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
            <label className="form-field"><Label>Reporting week (YYYY-Www)</Label><input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="2026-W45" pattern="\d{4}-W\d{2}"/><small>One reward claim per farm per week. Use a different week to demo again.</small></label>
            <div className="proof-step margin-top"><span>02</span><div><h3>Enter simulated water reading</h3><p>A trusted water meter would be required in production.</p></div></div><NumberField label="Water used during the period (m³)" value={actual} onChange={setActual} step="0.1" hint="You can edit the reading to test reward eligibility."/>
            <div className="sim-meter"><div className="sim-meter-icon"><Gauge size={24}/></div><div><strong>Demo Smart Meter</strong><small>Simulated measurement · not physically verified</small></div><Pill tone="yellow">SIMULATION</Pill></div>
            <button className="btn btn-primary block big" disabled={!evalActual?.valid||busy==='mint'||!farm} onClick={claim}>{busy==='mint'?<LoaderCircle className="spin" size={18}/>:<Coins size={18}/>} Mint demo AgroTokens <ArrowRight size={18}/></button>
            <p className="fine-print">A mint produces a local ledger block. It is not a real crypto transfer or independent proof of water savings.</p>
          </div><div className="proof-results"><div className="panel padded"><h3 className="panel-main-title">Your water impact</h3><p className="panel-sub">Compared with an illustrative conventional-irrigation reference.</p><div className="compare-row"><span>Conventional reference</span><strong>{nf(calc?.reference_m3,1)} m³</strong></div><div className="progress-track"><div className="progress-fill pale" style={{width:'100%'}}/></div><div className="compare-row"><span>Simulated consumption</span><strong>{nf(actual,1)} m³</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${calc?.reference_m3?Math.min(100,Number(actual)/calc.reference_m3*100):0}%`}}/></div><div className="split-line"/>
            <div className="earning-row"><div><small>Potential savings</small><strong>{evalActual?.valid?nf(evalActual.saved,1):'0'} <span>m³</span></strong></div><div className="coin-badge"><Coins size={26}/></div></div><div className="earning-total">+{evalActual?.valid?nf(evalActual.tokens):0} <span>AGT</span></div><p className={`status-message ${evalActual?.valid?'good':'warn'}`}>{evalActual?.valid?<><CircleCheck size={16}/> Passes demo screening. Ready to simulate mint.</>:<><AlertCircle size={16}/> {evalActual?.tooLow?'Below illustrative minimum. Do not reward possible under-irrigation.':'Enter a reading below the reference and above the screening minimum.'}</>}</p>
            </div><div className="panel explain-proof"><div className="proof-light-icon"><ShieldCheck size={25}/></div><h3>How does this proof work?</h3><div className="numbered-steps"><p><b>1.</b> Compute reference volume using crop science.</p><p><b>2.</b> Screen the simulated meter reading against a crop-safety floor.</p><p><b>3.</b> Write minted AGT + evidence metadata to a SHA-256 hash-linked record.</p></div><p className="fine-print">For real proof: signed meter telemetry, field audits, reliable crop monitoring and a governance process are needed.</p></div></div></div>
        </>}

        {page==='AgroWallet'&&<>
          <SectionTitle eyebrow="YOUR DIGITAL REWARDS" title="AgroWallet" description="View, hold and exchange demo AGT rewards earned from water conservation." action={<Pill icon={Wallet}>Wallet #{farmerId.toString().padStart(4,'0')}</Pill>}/>
          <div className="wallet-grid"><div className="wallet-card"><div className="wallet-top"><div className="wallet-brand"><div className="wallet-logo"><Leaf size={20}/></div> AgroToken Wallet</div><div className="wallet-circles"><span/><span/></div></div><div className="wallet-mid"><span>AVAILABLE BALANCE</span><div>{nf(data.farmer.wallet_balance)} <span>AGT</span></div></div><div className="wallet-bottom"><span>{data.farmer.name}</span><span>LOCAL DEMO • NO MARKET VALUE</span></div></div>
            <div className="panel padded"><h3 className="panel-main-title">Send AgroTokens</h3><p className="panel-sub">Transfer tokens to another farmer in this demo network.</p><label className="form-field"><Label>Send to farmer</Label><select value={transferTo} onChange={e=>setTransferTo(+e.target.value)}>{data.farmers.filter(f=>f.id!==farmerId).map(f=><option key={f.id} value={f.id}>{f.name} — {f.region}</option>)}</select></label><NumberField label="Amount (AGT)" value={transferAmount} onChange={setTransferAmount} min={1} step="1"/><button className="btn btn-primary block" disabled={busy==='transfer'||!data.farmer.wallet_balance} onClick={transfer}><Send size={16}/> Send AGT</button></div></div>
          <div className="wallet-info-grid"><div className="soft-metric"><Coins size={19}/><div><span>Total earned</span><strong>{nf(totalEarned)} AGT</strong></div></div><div className="soft-metric"><Droplets size={19}/><div><span>Water savings (demo)</span><strong>{nf(totalSaved,1)} m³</strong></div></div><div className="soft-metric"><Globe2 size={19}/><div><span>Maximum supply</span><strong>21,000,000 AGT</strong></div></div></div>
          <div className="panel padded table-panel"><div className="panel-header"><div><h3>Your recent proofs</h3><p>Simulated claim history linked to the ledger</p></div><button className="text-link" onClick={()=>setAndGo('Blockchain Ledger')}>Explore ledger <ArrowRight size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>Farm / period</th><th>Water saved</th><th>Reward</th><th>Evidence</th></tr></thead><tbody>{data.proofs.map(p=><tr key={p.id}><td><strong>{p.farm_name}</strong><small>{p.period_key}</small></td><td>{nf(p.saved_m3,1)} m³</td><td className="green-text">+{nf(p.tokens)} AGT</td><td><Pill tone="yellow">Simulated</Pill></td></tr>)}</tbody></table>{!data.proofs.length&&<Empty>No rewards recorded yet. Try Proof of Savings.</Empty>}</div></div>
        </>}

        {page==='Marketplace'&&<>
          <SectionTitle eyebrow="MAKE YOUR REWARDS USEFUL" title="AgroMarketplace" description="Spend AgroTokens on products and services that help farms thrive." action={<div className="balance-pill"><Coins size={17}/> {nf(data.farmer.wallet_balance)} AGT available</div>}/>
          <div className="market-note"><Gift size={21}/><span><strong>Demo marketplace.</strong> Product listings, stocks and redemptions are simulated. No real-world order is placed.</span></div>
          <div className="product-grid">{data.products.map(p=><div className="product-card" key={p.id}><div className={`product-visual product-${p.id}`}><span>{p.emoji}</span><span className="product-tag">{p.category}</span></div><div className="product-detail"><h3>{p.name}</h3><p>{p.description}</p><div className="product-meta"><div className="price"><Coins size={17}/>{nf(p.price)} <span>AGT</span></div><small>{p.stock} in demo stock</small></div><button className="btn btn-primary block" onClick={()=>purchase(p)} disabled={busy===`buy-${p.id}`||data.farmer.wallet_balance<p.price||p.stock===0}>{busy===`buy-${p.id}`?<LoaderCircle className="spin" size={16}/>:<ShoppingBag size={16}/>} {data.farmer.wallet_balance<p.price?'Not enough AGT':p.stock===0?'Out of stock':'Redeem with AGT'}</button></div></div>)}</div>
          {data.orders.length>0&&<div className="panel padded table-panel"><h3>Recent redemptions</h3><div className="table-wrap"><table><thead><tr><th>Product</th><th>Quantity</th><th>AGT spent</th><th>Type</th></tr></thead><tbody>{data.orders.map(o=><tr key={o.id}><td>{o.emoji} {o.product_name}</td><td>{o.quantity}</td><td>{o.total}</td><td><Pill tone="yellow">Demo</Pill></td></tr>)}</tbody></table></div></div>}
        </>}

        {page==='Blockchain Ledger'&&<>
          <SectionTitle eyebrow="TRANSPARENCY, NOT HYPE" title="The AgroToken Ledger" description="Inspect each transaction and verify the local SHA-256 hash chain." action={<button className="btn btn-outline" onClick={()=>doAction('verify',async()=>{const r=await request('/ledger/verify');flash(r.valid?`All ${r.checked} blocks pass verification.`:`Chain broken at block ${r.broken_at}` ,r.valid?'success':'error');await load()})}><SearchCheck size={16}/> Verify integrity</button>}/>
          <div className="ledger-stats"><div><span>NETWORK STATUS</span><strong className={data.chain.valid?'green-text':'red-text'}><CircleCheck size={20}/>{data.chain.valid?'Hash chain valid':'Integrity error'}</strong></div><div><span>BLOCKS RECORDED</span><strong>{nf(data.chain.checked)}</strong></div><div><span>AGT MINTED (DEMO)</span><strong>{nf(data.supply.minted)} <small>/ 21,000,000</small></strong></div></div>
          <div className="ledger-grid"><div className="panel padded"><div className="panel-header"><div><h3>Blocks</h3><p>Newest first · saved to SQLite</p></div><Pill icon={LockKeyhole}>SHA-256</Pill></div><div className="ledger-list">{data.ledger.map(b=><div className="ledger-item" key={b.id}><div className="ledger-connection"><div className="ledger-node"><Blocks size={17}/></div><div className="ledger-line"/></div><div className="ledger-content"><div className="ledger-item-heading"><strong>Block #{b.id}</strong><Pill tone={b.kind==='mint'?'green':b.kind==='redeem'?'yellow':'light'}>{b.kind}</Pill></div><div className="ledger-item-desc">{b.kind==='mint'?`${nf(b.payload.saved_m3)} m³ simulated saved → ${nf(b.payload.tokens)} AGT issued`:b.kind==='redeem'?`${nf(b.payload.spent_agt)} AGT redeemed`:b.kind==='transfer'?`${nf(b.payload.amount)} AGT sent to farmer #${b.payload.to_farmer_id}`:'Network initialized'}</div><div className="ledger-digest"><span>Hash</span><code>{short(b.block_hash)}</code><button title="Copy full block hash" aria-label="Copy full hash" onClick={()=>{navigator.clipboard?.writeText(b.block_hash).then(()=>flash('Block hash copied')).catch(()=>flash('Copy unavailable','error'))}}><Copy size={14}/></button></div><div className="ledger-timestamp">{new Date(b.created_at).toLocaleString()}</div></div></div>)}</div></div>
            <div className="ledger-side"><div className="panel padded"><div className="proof-light-icon"><ShieldCheck size={25}/></div><h3>Trust, built into the record.</h3><p>Every block includes its own SHA-256 digest and the previous block's digest. Editing one recorded event without rebuilding the chain breaks verification.</p><div className="verify-panel"><CircleCheck size={17}/>{data.chain.valid?'All local blocks currently match':'A hash mismatch was detected'}</div></div><div className="hint-box vertical"><AlertCircle size={19}/><p><strong>Important limitation:</strong> This is a local hash-linked ledger, not a decentralized blockchain. An administrator who controls the database could rewrite the whole chain. Neither the hashes nor the demo meter prove actual water savings.</p></div></div></div>
        </>}

        {page==='AgroAI Assistant'&&<>
          <SectionTitle eyebrow="SMART AGRICULTURAL GUIDANCE" title="Meet AgroAI" description="Ask questions about irrigation, crop water needs and your AgroToken rewards." action={<Pill tone={data.meta_connected?'green':'yellow'} icon={data.meta_connected?Sparkles:Info}>{data.meta_connected?'Meta Muse connected':'Local demo responses'}</Pill>}/>
          <div className="chat-layout"><div className="panel chat-panel"><div className="chat-top"><div className="chat-avatar"><Bot size={24}/></div><div><strong>AgroAI Assistant</strong><small>{data.meta_connected?'Powered by Meta Muse Spark 1.3':'Local rule-based demo · Add API key for Meta'}</small></div><span className="chat-online"/></div><div className="messages" role="log" aria-live="polite">{chatMessages.map((m,i)=><div className={`message-row ${m.role==='user'?'from-user':''}`} key={i}><div className="message-avatar">{m.role==='user'?data.farmer.name[0]:<Bot size={18}/>}</div><div className="message-bubble"><div>{m.content}</div>{m.role==='assistant'&&m.mode!=='intro'&&<small>{m.mode==='meta'?'META MUSE SPARK':m.mode==='error'?'API ERROR':'LOCAL DEMO MODE'}</small>}</div></div>)}{chatBusy&&<div className="message-row"><div className="message-avatar"><Bot size={18}/></div><div className="message-bubble"><LoaderCircle className="spin" size={17}/> Thinking...</div></div>}<div ref={chatEnd}/></div><div className="chat-input"><input placeholder="Ask me about irrigation or AgroTokens..." value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()}/><button onClick={()=>sendChat()} disabled={!question.trim()||chatBusy} aria-label="Send message"><ArrowUpRight size={22}/></button></div></div>
          <div className="chat-side"><div className="panel padded"><div className="proof-light-icon"><Sparkles size={25}/></div><h3>Ideas to get started</h3><p>Choose a question to explore AgroToken.</p><div className="suggestions">{['How is irrigation water calculated?','How do I earn AgroTokens?','What is Proof of Water Savings?','How can I improve drip irrigation?'].map(t=><button key={t} onClick={()=>sendChat(t)}>{t}<ArrowUpRight size={15}/></button>)}</div></div><div className="hint-box vertical"><Info size={19}/><p>AgroAI is informational. It cannot certify a farm's water use or make guaranteed agronomic recommendations. A live Meta key is optional and never exposed to the frontend.</p></div></div></div>
        </>}
      </main>
      <footer className="app-footer"><span>© 2026 AgroToken · Grow more. Waste less.</span><span>Hackathon MVP · Demo tokens only · No real-world verification</span></footer>
    </div>
    {toast&&<div className={`toast ${toast.kind}`}><span>{toast.kind==='error'?<AlertCircle size={19}/>:<CircleCheck size={19}/>}</span>{toast.message}<button onClick={()=>setToast(null)} aria-label="Close notice"><X size={14}/></button></div>}
    {error&&data&&<div className="error-bar" onClick={()=>setError('')}><AlertCircle size={17}/>{error}<X size={14}/></div>}
    {showFarmForm&&editingFarm&&<div className="modal-wrap"><div className="modal-backdrop" onClick={()=>setShowFarmForm(false)}/><div className="modal"><div className="modal-head"><div><div className="eyebrow">FARM DETAILS</div><h2>{editingFarm.id?'Edit farm':'Add a new farm'}</h2></div><button className="circle-button" onClick={()=>setShowFarmForm(false)}><X size={20}/></button></div>
      <div className="modal-scroll"><label className="form-field"><Label>Farm name</Label><input value={editingFarm.name} onChange={e=>setEditingFarm(f=>({...f,name:e.target.value}))}/></label><div className="form-two"><label className="form-field"><Label>Location preset</Label><select value={cities.find(x=>x.location===editingFarm.location)?.location||'custom'} onChange={e=>{const found=cities.find(x=>x.location===e.target.value);if(found)setEditingFarm(f=>({...f,...found}))}}>{cities.map(x=><option key={x.location} value={x.location}>{x.location}, {x.country}</option>)}<option value="custom">Custom coordinates</option></select></label><NumberField label="Area (hectares)" value={editingFarm.area_ha} onChange={v=>setEditingFarm(f=>({...f,area_ha:v}))} min={.01}/></div>
      <div className="form-two"><label className="form-field"><Label>City / region</Label><input value={editingFarm.location} onChange={e=>setEditingFarm(f=>({...f,location:e.target.value}))}/></label><label className="form-field"><Label>Country</Label><input value={editingFarm.country} onChange={e=>setEditingFarm(f=>({...f,country:e.target.value}))}/></label></div><div className="form-two"><NumberField label="Latitude" value={editingFarm.lat} onChange={v=>setEditingFarm(f=>({...f,lat:v}))} min={-90}/><NumberField label="Longitude" value={editingFarm.lon} onChange={v=>setEditingFarm(f=>({...f,lon:v}))} min={-180}/></div>
      <div className="form-two"><Select label="Crop type" options={crops} value={editingFarm.crop} onChange={v=>setEditingFarm(f=>({...f,crop:v}))}/><Select label="Growth stage" options={stages} value={editingFarm.stage} onChange={v=>setEditingFarm(f=>({...f,stage:v}))}/></div><div className="form-two"><Select label="Soil type" options={soils} value={editingFarm.soil} onChange={v=>setEditingFarm(f=>({...f,soil:v}))}/><Select label="Irrigation" options={methods} value={editingFarm.irrigation} onChange={v=>setEditingFarm(f=>({...f,irrigation:v}))}/></div></div><div className="modal-foot"><button className="btn btn-outline" onClick={()=>setShowFarmForm(false)}>Cancel</button><button className="btn btn-primary" onClick={saveFarm} disabled={busy==='save-farm'}>{busy==='save-farm'?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} Save farm</button></div></div></div>}
    <button className="floating-chat" title="Open AgroAI chat" onClick={()=>setAndGo('AgroAI Assistant')}><Bot size={25}/><span/></button>
  </div>
}
