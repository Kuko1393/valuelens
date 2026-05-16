'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScoreGauge, CategoryBadge } from '@/components/UI'

export default function WatchlistPage() {
  const [lists, setLists] = useState<any[]>([])
  const [active, setActive] = useState<string|null>(null)
  const [newName, setNewName] = useState('')
  const [addTicker, setAddTicker] = useState('')

  const load = async () => { const r=await fetch('/api/watchlist'); const d=await r.json(); setLists(d); if(d.length>0&&!active)setActive(d[0].id) }
  useEffect(()=>{load()},[])

  const createList = async () => { if(!newName.trim())return; await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName})}); setNewName(''); load() }
  const deleteList = async (id:string) => { await fetch(`/api/watchlist?id=${id}`,{method:'DELETE'}); load(); if(active===id)setActive(null) }
  const addToList = async (id:string) => {
    if(!addTicker.trim())return
    const list=lists.find(l=>l.id===id); if(!list)return
    const tickers=Array.from(new Set([...list.tickers,addTicker.toUpperCase()]))
    await fetch('/api/watchlist',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:list.name,tickers})}); setAddTicker(''); load()
  }
  const removeFromList = async (id:string, ticker:string) => {
    const list=lists.find(l=>l.id===id); if(!list)return
    await fetch('/api/watchlist',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:list.name,tickers:list.tickers.filter((t:string)=>t!==ticker)})}); load()
  }

  const activeList = lists.find(l=>l.id===active)

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(6,10,18,.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--border)',padding:'0 24px',display:'flex',alignItems:'center',gap:32,height:56}}>
        <Link href="/" style={{textDecoration:'none',fontWeight:700,fontSize:15,color:'var(--text-bright)'}}>Value<span style={{color:'var(--accent)'}}>Lens</span></Link>
        {[{href:'/',label:'Screener'},{href:'/ideas',label:'Opportunités'},{href:'/watchlist',label:'Watchlists'}].map(l=>(
          <Link key={l.href} href={l.href} style={{padding:'6px 14px',borderRadius:6,fontSize:13,fontWeight:500,textDecoration:'none',color:l.href==='/watchlist'?'var(--accent)':'var(--text-dim)',background:l.href==='/watchlist'?'var(--accent-dim)':'transparent'}}>{l.label}</Link>
        ))}
      </nav>
      <div style={{maxWidth:1200,margin:'0 auto',padding:24,display:'flex',gap:20}}>
        <aside style={{width:220,flexShrink:0}}>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text-dim)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Mes listes</div>
            {lists.map(l=>(
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <button onClick={()=>setActive(l.id)} style={{flex:1,textAlign:'left',padding:'7px 10px',borderRadius:6,background:active===l.id?'var(--accent-dim)':'transparent',border:`1px solid ${active===l.id?'var(--accent)':'transparent'}`,color:active===l.id?'var(--accent)':'var(--text-dim)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'Space Grotesk,sans-serif'}}>
                  {l.name} <span style={{opacity:.6,fontSize:11}}>({l.tickers.length})</span>
                </button>
                <button onClick={()=>deleteList(l.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16,padding:'4px 6px'}}>×</button>
              </div>
            ))}
            <div style={{display:'flex',gap:6,marginTop:12}}>
              <input placeholder="Nouvelle liste…" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createList()} style={{flex:1,padding:'6px 8px',fontSize:12}}/>
              <button className="btn btn-primary" onClick={createList} style={{padding:'6px 10px',fontSize:12}}>+</button>
            </div>
          </div>
        </aside>
        <div style={{flex:1}}>
          {!activeList ? (
            <div className="card" style={{padding:48,textAlign:'center',color:'var(--muted)'}}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text-dim)',marginBottom:8}}>Aucune liste sélectionnée</div>
              <div style={{fontSize:13}}>Créez une liste pour commencer à suivre des entreprises</div>
            </div>
          ) : (
            <div className="card" style={{overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
                <h2 style={{margin:0,fontSize:16,fontWeight:700,color:'var(--text-bright)'}}>{activeList.name}</h2>
                <span style={{fontSize:12,color:'var(--muted)'}}>{activeList.tickers.length} titre(s)</span>
                <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                  <input placeholder="Ajouter un ticker…" value={addTicker} onChange={e=>setAddTicker(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addToList(activeList.id)} style={{width:160,padding:'5px 10px',fontSize:12,textTransform:'uppercase'}}/>
                  <button className="btn btn-primary" onClick={()=>addToList(activeList.id)} style={{padding:'5px 12px',fontSize:12}}>+ Ajouter</button>
                </div>
              </div>
              {activeList.tickers.length===0 ? (
                <div style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:13}}>Ajoutez des tickers à votre liste</div>
              ) : (
                <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12}}>
                  {activeList.tickers.map((ticker:string)=><WatchCard key={ticker} ticker={ticker} onRemove={()=>removeFromList(activeList.id,ticker)}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WatchCard({ ticker, onRemove }: { ticker:string; onRemove:()=>void }) {
  const [data, setData] = useState<any>(null)
  useEffect(()=>{ fetch(`/api/company/${ticker}`).then(r=>r.json()).then(setData).catch(()=>{}) },[ticker])
  return (
    <div className="card card-hover" style={{padding:14,position:'relative'}}>
      <button onClick={e=>{e.stopPropagation();onRemove()}} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14}}>×</button>
      {!data ? <div className="skeleton" style={{height:60}}/> : (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:'var(--accent)'}}>{ticker}</div>
              <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2}}>{data.name?.slice(0,18)}</div>
            </div>
            {data.score&&<ScoreGauge score={data.score?.total||data.score} size={36}/>}
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:600}}>{data.price?.toFixed(2)||'—'}</div><div style={{fontSize:10,color:'var(--muted)'}}>Prix</div></div>
            {data.marginOfSafety!==undefined&&<div style={{textAlign:'right'}}><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:600,color:data.marginOfSafety>0?'var(--accent)':'var(--danger)'}}>{data.marginOfSafety!==null?`${data.marginOfSafety>0?'+':''}${data.marginOfSafety.toFixed(1)}%`:'—'}</div><div style={{fontSize:10,color:'var(--muted)'}}>MoS</div></div>}
          </div>
          {data.category&&<div style={{marginTop:8}}><CategoryBadge category={data.category}/></div>}
        </>
      )}
    </div>
  )
}
