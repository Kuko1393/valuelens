'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScoreGauge, CategoryBadge, GuidanceBadge, TrendIndicator } from '@/components/UI'

// ── Category helpers ──────────────────────────────────────────────────
const CATEGORIES = ['Deep Value','Quality Value','Reasonably Valued Compounder','Potential Value Trap']
const CAT_SHORT: Record<string,string> = {
  'Deep Value':'Deep Value','Quality Value':'Quality Value',
  'Reasonably Valued Compounder':'Compounder','Potential Value Trap':'Value Trap',
}
const CAT_LEGEND = [
  {cat:'Deep Value',cls:'tag-blue',desc:'MoS > 30%, qualité modeste — fort potentiel, risque élevé'},
  {cat:'Quality Value',cls:'tag-green',desc:'Haute qualité + sous-évaluée — opportunité premium'},
  {cat:'Compounder',cls:'tag-gold',desc:'Excellente qualité à valorisation juste'},
  {cat:'Value Trap',cls:'tag-red',desc:'Cheap mais fondamentaux faibles — prudence'},
]

function CategoryMultiSelect({ selected, onChange }: { selected:string[]; onChange:(cats:string[])=>void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (cat: string) => onChange(selected.includes(cat) ? selected.filter(c=>c!==cat) : [...selected, cat])
  const label = selected.length===0 ? 'Toutes catégories' : selected.length===1 ? CAT_SHORT[selected[0]] : `${selected.length} catégories`
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{padding:'5px 10px',fontSize:12,display:'flex',alignItems:'center',gap:6,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:selected.length>0?'var(--accent)':'var(--text-dim)',cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Space Grotesk,sans-serif'}}>
        {label} <span style={{fontSize:10}}>{open?'▲':'▼'}</span>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,background:'var(--card)',border:'1px solid var(--border-bright)',borderRadius:8,padding:6,zIndex:200,minWidth:230,boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          {CATEGORIES.map(cat=>(
            <label key={cat} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',borderRadius:6,cursor:'pointer',background:selected.includes(cat)?'var(--accent-dim)':'transparent'}}>
              <input type="checkbox" checked={selected.includes(cat)} onChange={()=>toggle(cat)} style={{accentColor:'var(--accent)',width:14,height:14}}/>
              <span style={{fontSize:12,color:selected.includes(cat)?'var(--accent)':'var(--text)'}}>{cat}</span>
            </label>
          ))}
          {selected.length>0&&(
            <button onClick={()=>onChange([])} style={{width:'100%',marginTop:4,padding:'5px 10px',background:'none',border:'none',fontSize:11,color:'var(--muted)',cursor:'pointer',textAlign:'left',fontFamily:'Space Grotesk,sans-serif'}}>
              ✕ Effacer la sélection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CategoryLegend() {
  return (
    <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <span style={{fontSize:10,fontWeight:600,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'.08em',flexShrink:0}}>Légende</span>
      {CAT_LEGEND.map(item=>(
        <div key={item.cat} style={{display:'flex',alignItems:'center',gap:6}}>
          <span className={`tag ${item.cls}`}>{item.cat}</span>
          <span style={{fontSize:11,color:'var(--muted)'}}>— {item.desc}</span>
        </div>
      ))}
    </div>
  )
}

// ── Nav ──────────────────────────────────────────────────────────────
function Nav() {
  const path = usePathname()
  const links = [{ href: '/', label: 'Screener' }, { href: '/ideas', label: 'Opportunités' }, { href: '/watchlist', label: 'Watchlists' }]
  return (
    <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,10,18,.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'0 24px', display:'flex', alignItems:'center', gap:32, height:56 }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <circle cx="13" cy="13" r="12" stroke="var(--accent)" strokeWidth="1.5"/>
          <path d="M7 13 L11 9 L15 15 L19 11" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="11" r="2" fill="var(--accent)"/>
        </svg>
        <span style={{ fontWeight:700, fontSize:15, color:'var(--text-bright)' }}>Value<span style={{ color:'var(--accent)' }}>Lens</span></span>
      </Link>
      <div style={{ display:'flex', gap:4 }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight:500, textDecoration:'none',
            color: path===l.href ? 'var(--accent)' : 'var(--text-dim)', background: path===l.href ? 'var(--accent-dim)' : 'transparent' }}>
            {l.label}
          </Link>
        ))}
      </div>
      <span style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono, monospace' }}>
        {new Date().toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' })}
      </span>
    </nav>
  )
}

// ── Types ─────────────────────────────────────────────────────────────
interface Row {
  ticker:string; name:string; sector:string|null; price:number; intrinsicValue:number|null
  marginOfSafety:number|null; score:number; category:string; fcfYield:number|null
  pe:number|null; roic:number|null; marketCap:number|null; priceHistory3M:{date:string;close:number}[]
}

const fmt = (v: number|null, d=1, s='') => v===null ? '—' : `${v.toFixed(d)}${s}`
const fmtBig = (v: number|null) => { if (!v) return '—'; if (v>=1e12) return `${(v/1e12).toFixed(1)}T`; if (v>=1e9) return `${(v/1e9).toFixed(1)}B`; if (v>=1e6) return `${(v/1e6).toFixed(0)}M`; return v.toFixed(0) }
const mosColor = (v: number|null) => v===null ? 'var(--text-dim)' : v>20 ? 'var(--accent)' : v>0 ? 'var(--warning)' : 'var(--danger)'

// ── Screener Table ────────────────────────────────────────────────────
function ScreenerTable({ data, onRowClick, loading, sortBy, sortDir, onSort }: {
  data:Row[]; onRowClick:(r:Row)=>void; loading:boolean; sortBy:string; sortDir:string; onSort:(c:string)=>void
}) {
  const cols = [
    {key:'name',label:'Entreprise',w:220}, {key:'price',label:'Prix',w:90}, {key:'intrinsicValue',label:'Val.intr.',w:90},
    {key:'marginOfSafety',label:'MoS%',w:80}, {key:'score',label:'Score',w:72},
    {key:'category',label:'Catégorie',w:120},
    {key:'fcfYield',label:'FCF Yield',w:90}, {key:'roic',label:'ROIC',w:80},
    {key:'marketCap',label:'MktCap',w:90}, {key:'trend',label:'3M',w:90},
  ]
  if (loading) return <div style={{padding:32,display:'flex',flexDirection:'column',gap:8}}>{Array.from({length:8}).map((_,i)=><div key={i} className="skeleton" style={{height:44}}/>)}</div>
  return (
    <div style={{overflowX:'auto'}}>
      <table className="screener-table" style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'var(--surface)'}}>
            {cols.map(c=>(
              <th key={c.key} onClick={()=>c.key!=='trend'&&onSort(c.key)}
                style={{padding:'10px 12px',textAlign:c.key==='name'?'left':'right',width:c.w,minWidth:c.w}}>
                {c.label}{c.key!=='trend'&&c.key!=='category'&&<span style={{marginLeft:4,opacity:sortBy===c.key?1:.3,fontSize:9}}>{sortBy===c.key?(sortDir==='desc'?'▼':'▲'):'▼'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length===0&&<tr><td colSpan={cols.length} style={{padding:48,textAlign:'center',color:'var(--muted)'}}>Chargement des données…</td></tr>}
          {data.map((row,i)=>(
            <tr key={row.ticker} onClick={()=>onRowClick(row)} className="animate-in" style={{animationDelay:`${i*.02}s`}}>
              <td style={{padding:'10px 12px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  <span style={{fontWeight:600,color:'var(--text-bright)',fontSize:13}}>{row.name.length>22?row.name.slice(0,22)+'…':row.name}</span>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--accent)'}}>{row.ticker}<span style={{color:'var(--muted)',marginLeft:6}}>· {row.sector?.split(' ')[0]||'—'}</span></span>
                </div>
              </td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:13}}>{fmt(row.price,2)}</td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:13,color:'var(--text-dim)'}}>{fmt(row.intrinsicValue,2)}</td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:600,color:mosColor(row.marginOfSafety)}}>{row.marginOfSafety!==null?`${row.marginOfSafety>0?'+':''}${row.marginOfSafety.toFixed(1)}%`:'—'}</td>
              <td style={{padding:'8px 12px',textAlign:'right'}}><div style={{display:'flex',justifyContent:'flex-end'}}><ScoreGauge score={row.score} size={40}/></div></td>
              <td style={{padding:'10px 12px',textAlign:'right'}}><CategoryBadge category={row.category}/></td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:row.fcfYield!==null&&row.fcfYield>5?'var(--accent)':'var(--text-dim)'}}>{fmt(row.fcfYield,1,'%')}</td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:row.roic!==null&&row.roic>15?'var(--accent)':'var(--text-dim)'}}>{fmt(row.roic,1,'%')}</td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text-dim)'}}>{fmtBig(row.marketCap)}</td>
              <td style={{padding:'10px 12px',textAlign:'right'}}><TrendIndicator history={row.priceHistory3M}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Company Modal ─────────────────────────────────────────────────────
function CompanyModal({ ticker, onClose }: { ticker:string; onClose:()=>void }) {
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState(0)
  useEffect(() => {
    setData(null); setTab(0)
    fetch(`/api/company/${ticker}`).then(r=>r.json()).then(setData)
  }, [ticker])
  const TABS = ['Aperçu','Valorisation','Financiers','Guidance','AI Analysis']
  const mos = data?.marginOfSafety
  const mc = mos===null||mos===undefined ? 'var(--text-dim)' : mos>20?'var(--accent)':mos>0?'var(--warning)':'var(--danger)'
  return (
    <div className="modal-backdrop" onClick={onClose} style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border-bright)',borderRadius:12,width:'100%',maxWidth:860,maxHeight:'88vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:16}}>
          {!data ? <div className="skeleton" style={{flex:1,height:56}}/> : (
            <>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <h2 style={{margin:0,fontSize:17,fontWeight:700,color:'var(--text-bright)'}}>{data.name}</h2>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color:'var(--accent)',fontWeight:600}}>{data.ticker}</span>
                  <CategoryBadge category={data.category}/>
                </div>
                <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>{data.sector||'—'} · {data.exchange||'—'}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:700,color:'var(--text-bright)'}}>{fmt(data.price,2)}</div>
                  {data.intrinsicValue&&<div style={{fontSize:11,color:'var(--text-dim)'}}>IV: <span style={{color:mc}}>{fmt(data.intrinsicValue,2)} ({mos!==null?`${mos>0?'+':''}${mos.toFixed(1)}%`:'—'})</span></div>}
                </div>
                {data.score&&<ScoreGauge score={data.score.total||data.score} size={52}/>}
              </div>
            </>
          )}
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:20,cursor:'pointer',padding:'0 4px',marginLeft:4}}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border)',padding:'0 24px',background:'var(--surface)'}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} style={{background:'none',border:'none',borderBottom:tab===i?'2px solid var(--accent)':'2px solid transparent',color:tab===i?'var(--accent)':'var(--text-dim)',padding:'10px 16px',cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'Space Grotesk,sans-serif'}}>
              {t}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{flex:1,overflow:'auto',padding:24}}>
          {!data ? <div style={{display:'flex',flexDirection:'column',gap:12}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:36}}/>)}</div> : (
            <>
              {tab===0&&<OverviewTab data={data}/>}
              {tab===1&&<ValuationTab data={data}/>}
              {tab===2&&<FinancialsTab data={data}/>}
              {tab===3&&<GuidanceTab ticker={data.ticker} name={data.name}/>}
              {tab===4&&<AIAnalysisTab data={data}/>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MR({ label, value, color }: { label:string; value:string; color?:string }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
      <span style={{fontSize:13,color:'var(--text-dim)'}}>{label}</span>
      <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:600,color:color||'var(--text)'}}>{value}</span>
    </div>
  )
}

function ActivitySummary({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!description) return null
  const short = description.length > 320
  const displayed = !expanded && short ? description.slice(0, 320) + '…' : description
  return (
    <div style={{marginBottom:20,padding:14,borderRadius:8,background:'var(--surface)',border:'1px solid var(--border)'}}>
      <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-dim)',marginBottom:8}}>
        Activité
      </div>
      <p style={{margin:0,fontSize:13,lineHeight:1.65,color:'var(--text)',fontStyle:'normal'}}>
        {displayed}
      </p>
      {short && (
        <button onClick={()=>setExpanded(e=>!e)} style={{marginTop:8,background:'none',border:'none',color:'var(--accent)',fontSize:12,cursor:'pointer',padding:0,fontFamily:'Space Grotesk,sans-serif'}}>
          {expanded?'Réduire ▲':'Lire plus ▼'}
        </button>
      )}
    </div>
  )
}

function OverviewTab({ data }: { data:any }) {
  const scores = [{label:'Business Quality',v:data.score?.businessQuality||0,max:30},{label:'Financial Strength',v:data.score?.financialStrength||0,max:25},{label:'Valuation',v:data.score?.valuation||0,max:30},{label:'Long Term Visibility',v:data.score?.longTermVisibility||0,max:15}]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <ActivitySummary description={data.description}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div>
          <MR label="Secteur" value={data.sector||'—'}/>
          <MR label="ROIC" value={fmt(data.roic,1,'%')} color={data.roic>15?'var(--accent)':undefined}/>
          <MR label="Marge brute" value={fmt(data.grossMargin,1,'%')}/>
          <MR label="Marge opérationnelle" value={fmt(data.operatingMargin,1,'%')}/>
          <MR label="FCF Yield" value={fmt(data.fcfYield,1,'%')} color={data.fcfYield>5?'var(--accent)':undefined}/>
        </div>
        <div>
          {scores.map(s=>(
            <div key={s.label} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12,color:'var(--text-dim)'}}>{s.label}</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:600}}>{s.v}<span style={{color:'var(--muted)'}}>/{s.max}</span></span>
              </div>
              <div style={{height:4,background:'var(--border)',borderRadius:2}}>
                <div style={{height:'100%',width:`${(s.v/s.max)*100}%`,borderRadius:2,transition:'width .6s ease',background:s.v/s.max>.7?'var(--accent)':s.v/s.max>.4?'var(--warning)':'var(--danger)'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ValuationTab({ data }: { data:any }) {
  const [growth, setGrowth] = useState(7)
  const [terminal, setTerminal] = useState(2.5)
  const [wacc, setWacc] = useState(10)

  const fcfPerShare: number|null = (data.freeCashFlow3Y?.[0] && data.sharesOutstanding && data.sharesOutstanding>0)
    ? data.freeCashFlow3Y[0]/data.sharesOutstanding : null

  const customIV: number|null = fcfPerShare && fcfPerShare>0 && wacc/100>terminal/100
    ? (()=>{
        let total=0, cf=fcfPerShare, g=growth/100, dr=wacc/100, tg=terminal/100
        for (let i=1;i<=10;i++){cf*=(1+g);total+=cf/Math.pow(1+dr,i)}
        const tv=cf*(1+tg)/(dr-tg)
        return total+tv/Math.pow(1+dr,10)
      })()
    : null

  const customMoS: number|null = customIV&&data.price>0 ? ((customIV-data.price)/customIV)*100 : null
  const mc = data.marginOfSafety>20?'var(--accent)':data.marginOfSafety>0?'var(--warning)':'var(--danger)'
  const cmc = customMoS===null?'var(--text-dim)':customMoS>20?'var(--accent)':customMoS>0?'var(--warning)':'var(--danger)'
  const status = data.marginOfSafety===null?'Non calculé':data.marginOfSafety>20?'📉 Sous-évalué':data.marginOfSafety>-10?'⚖️ Valorisation raisonnable':'📈 Surévalué'

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div>
          <MR label="Prix actuel" value={fmt(data.price,2)}/>
          <MR label="Valeur intrinsèque" value={fmt(data.intrinsicValue,2)} color="var(--info)"/>
          <MR label="Marge de sécurité" value={data.marginOfSafety!==null?`${data.marginOfSafety>0?'+':''}${data.marginOfSafety.toFixed(1)}%`:'—'} color={mc}/>
          <div style={{marginTop:16,padding:12,borderRadius:6,background:'var(--surface)',border:`1px solid ${mc}33`}}>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:4}}>Statut de valorisation</div>
            <div style={{fontSize:13,fontWeight:600,color:mc}}>{status}</div>
          </div>
        </div>
        <div>
          <MR label="P/E" value={fmt(data.pe,1,'x')}/>
          <MR label="PEG" value={fmt(data.peg,2,'x')}/>
          <MR label="EV/EBIT" value={fmt(data.evEbit,1,'x')}/>
          <MR label="Price/FCF" value={fmt(data.pFcf,1,'x')}/>
          <MR label="FCF Yield" value={fmt(data.fcfYield,1,'%')} color={data.fcfYield>5?'var(--accent)':undefined}/>
        </div>
      </div>

      {/* DCF interactif */}
      <div style={{padding:16,borderRadius:8,background:'var(--surface)',border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-dim)',marginBottom:14}}>
          Éditeur DCF interactif
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:14}}>
          {([
            {label:'Croissance',v:growth,min:0,max:30,step:0.5,set:setGrowth},
            {label:'Tx. Terminal',v:terminal,min:0,max:5,step:0.1,set:setTerminal},
            {label:'WACC',v:wacc,min:5,max:20,step:0.5,set:setWacc},
          ] as const).map((s:any)=>(
            <div key={s.label}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:11,color:'var(--text-dim)'}}>{s.label}</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700,color:'var(--accent)'}}>{s.v.toFixed(1)}%</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.v}
                onChange={e=>s.set(parseFloat(e.target.value))}
                style={{width:'100%',accentColor:'var(--accent)',background:'none',border:'none',padding:0}}/>
            </div>
          ))}
        </div>
        {fcfPerShare ? (
          <div style={{display:'flex',gap:20,alignItems:'center',padding:'10px 14px',borderRadius:6,background:'var(--bg)',border:`1px solid ${cmc}33`}}>
            <div>
              <div style={{fontSize:10,color:'var(--text-dim)',marginBottom:2}}>Valeur DCF scénario</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:700,color:cmc}}>{fmt(customIV,2)}</div>
            </div>
            <div style={{width:1,height:36,background:'var(--border)'}}/>
            <div>
              <div style={{fontSize:10,color:'var(--text-dim)',marginBottom:2}}>MoS scénario</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:700,color:cmc}}>{customMoS!==null?`${customMoS>0?'+':''}${customMoS.toFixed(1)}%`:'—'}</div>
            </div>
            <div style={{marginLeft:'auto',fontSize:11,color:'var(--muted)',fontStyle:'italic'}}>
              FCF/action: {fmt(fcfPerShare,2)} · 10 ans
            </div>
          </div>
        ) : (
          <div style={{fontSize:12,color:'var(--muted)',fontStyle:'italic',padding:'8px 0'}}>
            FCF par action indisponible — le DCF ne peut pas être calculé
          </div>
        )}
      </div>
    </div>
  )
}

function FinancialsTab({ data }: { data:any }) {
  const yr = new Date().getFullYear()
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
      <div>
        {data.revenue3Y?.map((v:number,i:number)=><MR key={i} label={`Revenus ${yr-1-i}`} value={`${(v/1e9).toFixed(2)}B`}/>)}
        {data.freeCashFlow3Y?.[0]&&<MR label="Free Cash Flow" value={`${(data.freeCashFlow3Y[0]/1e9).toFixed(2)}B`} color="var(--accent)"/>}
      </div>
      <div>
        <MR label="ROIC" value={fmt(data.roic,1,'%')} color={data.roic>15?'var(--accent)':undefined}/>
        <MR label="Marge brute" value={fmt(data.grossMargin,1,'%')}/>
        <MR label="Marge opérationnelle" value={fmt(data.operatingMargin,1,'%')}/>
        <MR label="Capitalisation boursière" value={fmtBig(data.marketCap)}/>
      </div>
    </div>
  )
}

function GuidanceTab({ ticker, name }: { ticker:string; name:string }) {
  const [history, setHistory] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const load = async () => { setLoading(true); try { const r=await fetch(`/api/guidance/${ticker}`); const d=await r.json(); setHistory(d.history||[]); setMeta(d.meta) } finally { setLoading(false) } }
  useEffect(()=>{load()},[ticker])
  const refresh = async () => { setRefreshing(true); try { await fetch(`/api/guidance/${ticker}`,{method:'POST',body:JSON.stringify({name}),headers:{'Content-Type':'application/json'}}); await load() } finally { setRefreshing(false) } }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontWeight:600}}>Guidance managériale</span>
          <span className={`tag ${meta?.dataQuality==='high'?'tag-green':meta?'tag-yellow':'tag-gray'}`}>{meta?'⚠️ Données partielles':'⚪ Aucune donnée'}</span>
        </div>
        <button className="btn btn-ghost" onClick={refresh} disabled={refreshing} style={{fontSize:12,padding:'5px 12px'}}>
          {refreshing?'⏳ Recherche…':'↻ Forcer la mise à jour'}
        </button>
      </div>
      {loading ? <div className="skeleton" style={{height:80}}/> : history.length===0 ? (
        <div style={{padding:32,textAlign:'center',color:'var(--muted)',fontSize:13}}>
          Aucune donnée. Cliquez "Forcer la mise à jour" pour lancer la recherche automatique.
        </div>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'var(--surface)'}}>
            {['Année','Métrique','Guidance','Résultat','Écart','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:h==='Année'?'left':'right',fontSize:11,color:'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',letterSpacing:'.06em',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {history.map((e:any)=>{
              const actual=parseFloat(e.actualValue||'0'); const guid=parseFloat(e.guidanceHigh||e.guidanceLow||e.guidanceValue||'0')
              const ecart=guid>0&&actual>0?((actual-guid)/guid*100):null
              return (
                <tr key={e.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'9px 12px',fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:600}}>{e.year}</td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontSize:12,color:'var(--text-dim)'}}>{e.metric}</td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{e.guidanceLow&&e.guidanceHigh?`${e.guidanceLow}–${e.guidanceHigh}`:e.guidanceValue||'—'}</td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{e.actualValue||'—'}</td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:ecart===null?'var(--text-dim)':ecart>0?'var(--accent)':'var(--danger)'}}>{ecart!==null?`${ecart>0?'+':''}${ecart.toFixed(1)}%`:'—'}</td>
                  <td style={{padding:'9px 12px',textAlign:'right'}}>{e.beat===null?<span className="tag tag-gray">N/D</span>:e.beat?<span className="tag tag-green">✓ Beat</span>:<span className="tag tag-red">✗ Miss</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function AIAnalysisTab({ data }: { data:any }) {
  const [analysis, setAnalysis] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const generate = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/ai-analysis/${data.ticker}`)
      const j = await r.json()
      if (j.error) setError(j.error)
      else setAnalysis(j.analysis)
    } catch { setError('Erreur réseau') }
    finally { setLoading(false) }
  }

  const renderMd = (text: string) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return (
      <h3 key={i} style={{margin:'18px 0 8px',fontSize:14,fontWeight:700,color:'var(--accent)',borderBottom:'1px solid var(--border)',paddingBottom:4}}>
        {line.slice(3)}
      </h3>
    )
    if (line.trim()==='') return <div key={i} style={{height:6}}/>
    return (
      <p key={i} dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}
        style={{margin:'0 0 4px',fontSize:13,lineHeight:1.75,color:'var(--text)'}}/>
    )
  })

  if (!analysis && !loading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'40px 0'}}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="20" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 2"/>
        <path d="M12 24 L18 16 L24 22 L30 14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="22" cy="30" r="3" fill="var(--accent)" opacity=".5"/>
      </svg>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:8,color:'var(--text-bright)'}}>Analyse IA — {data.name}</div>
        <div style={{fontSize:13,color:'var(--text-dim)',marginBottom:20,maxWidth:360,lineHeight:1.6}}>
          Génère un rapport value investing complet : thèse, forces, risques, valorisation et verdict.
        </div>
        <button className="btn btn-ghost" onClick={generate} style={{padding:'10px 24px',fontSize:13}}>
          ✦ Générer l'analyse Claude
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:10,padding:'8px 0'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',opacity:.8}}/>
        <span style={{fontSize:13,color:'var(--text-dim)'}}>Claude analyse {data.name}…</span>
      </div>
      {[160,'100%','100%',120,'100%','100%',80].map((w,i)=>(
        <div key={i} className="skeleton" style={{height:i===0||i===3?16:28,width:w}}/>
      ))}
    </div>
  )

  if (error) return (
    <div style={{padding:24,textAlign:'center'}}>
      <div style={{color:'var(--danger)',marginBottom:12,fontSize:13}}>{error}</div>
      <button className="btn btn-ghost" onClick={generate} style={{fontSize:12}}>Réessayer</button>
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:'var(--muted)'}}>Généré par Claude Sonnet · {data.ticker}</span>
          <span className="tag tag-green">✓</span>
        </div>
        <button className="btn btn-ghost" onClick={generate} style={{fontSize:11,padding:'4px 10px'}}>↺ Régénérer</button>
      </div>
      <div>{renderMd(analysis!)}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const [data, setData] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sector, setSector] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('score')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [selected, setSelected] = useState<string|null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page:String(page), limit:'50', sortBy, sortDir, minScore:String(minScore), ...(sector&&{sector}), ...(categories.length>0&&{category: categories.join(',')}) })
    try { const r=await fetch(`/api/screener?${p}`); const j=await r.json(); setData(j.data||[]); setTotal(j.total||0) }
    catch { setData([]) } finally { setLoading(false) }
  }, [page, sortBy, sortDir, sector, categories, minScore])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSort = (col: string) => {
    if (sortBy===col) setSortDir(d=>d==='desc'?'asc':'desc'); else { setSortBy(col); setSortDir('desc') }
  }

  const totalPages = Math.ceil(total/50)
  const undervalued = data.filter(d=>d.marginOfSafety!==null&&d.marginOfSafety>20).length
  const avgScore = data.length>0?Math.round(data.reduce((a,b)=>a+b.score,0)/data.length):0

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Nav/>
      {/* Stats bar */}
      <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'14px 24px',display:'flex',gap:28,alignItems:'center'}}>
        {[{label:'Univers',val:total,unit:'entreprises',color:'var(--text-bright)'},{label:'Sous-évaluées',val:undervalued,unit:'MoS > 20%',color:'var(--accent)'},{label:'Score moyen',val:avgScore,unit:'/ 100',color:'var(--info)'}].map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:16}}>
            {i>0&&<div style={{width:1,height:36,background:'var(--border)'}}/>}
            <div>
              <div style={{fontSize:10,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'.08em'}}>{s.label}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>{s.unit}</div>
            </div>
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <select value={sector} onChange={e=>{setSector(e.target.value);setPage(1)}} style={{padding:'5px 10px',fontSize:12}}>
            <option value="">Tous les secteurs</option>
            {['Technology','Financials','Healthcare','Consumer Discretionary','Consumer Staples','Industrials','Energy','Materials'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <CategoryMultiSelect selected={categories} onChange={cats=>{setCategories(cats);setPage(1)}}/>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:'var(--text-dim)'}}>Score ≥ {minScore}</span>
            <input type="range" min={0} max={100} step={5} value={minScore} onChange={e=>setMinScore(parseInt(e.target.value))}
              style={{width:80,accentColor:'var(--accent)',background:'none',border:'none',padding:0}}/>
          </div>
          <button className="btn btn-ghost" onClick={fetchData} style={{fontSize:12,padding:'5px 12px'}}>↻</button>
        </div>
      </div>
      {/* Table */}
      <div style={{padding:'20px 24px',maxWidth:1600,margin:'0 auto'}}>
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:13,fontWeight:600}}>{loading?'Chargement…':`${total} résultats`}</span>
            {!loading&&totalPages>1&&<span style={{fontSize:12,color:'var(--muted)'}}>— Page {page}/{totalPages}</span>}
          </div>
          <ScreenerTable data={data} onRowClick={r=>setSelected(r.ticker)} loading={loading} sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <CategoryLegend/>
          {totalPages>1&&(
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'5px 12px',fontSize:12}}>← Préc.</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,totalPages-4))+i;return(
                <button key={p} onClick={()=>setPage(p)} style={{width:32,height:32,borderRadius:6,border:'1px solid var(--border)',background:p===page?'var(--accent)':'var(--surface)',color:p===page?'#000':'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',fontSize:12,cursor:'pointer'}}>{p}</button>
              );})}
              <button className="btn btn-ghost" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'5px 12px',fontSize:12}}>Suiv. →</button>
            </div>
          )}
        </div>
      </div>
      {selected&&<CompanyModal ticker={selected} onClose={()=>setSelected(null)}/>}
    </div>
  )
}
