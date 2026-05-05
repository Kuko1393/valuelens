'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScoreGauge, CategoryBadge } from '@/components/UI'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/screener?sortBy=score&sortDir=desc&limit=100')
      .then(r=>r.json()).then(d=>{
        const rows = d.data||[]
        const out: any[] = []
        rows.filter((r:any)=>r.fcfYield>8&&r.pe&&r.pe<12).forEach((r:any)=>out.push({...r,signal:'anomalies',detail:`FCF Yield ${r.fcfYield?.toFixed(1)}% + P/E ${r.pe?.toFixed(1)}x`}))
        rows.filter((r:any)=>r.roic>15&&r.marginOfSafety>25).forEach((r:any)=>{if(!out.find(i=>i.ticker===r.ticker))out.push({...r,signal:'drawdown',detail:`ROIC ${r.roic?.toFixed(1)}% | MoS +${r.marginOfSafety?.toFixed(1)}%`})})
        rows.filter((r:any)=>r.score>65&&r.marginOfSafety>15&&r.category==='Quality Value').forEach((r:any)=>{if(!out.find(i=>i.ticker===r.ticker))out.push({...r,signal:'quality',detail:`Score ${r.score}/100 | MoS +${r.marginOfSafety?.toFixed(1)}%`})})
        setIdeas(out.slice(0,48))
      }).finally(()=>setLoading(false))
  }, [])

  const SIGNALS: Record<string,{label:string;color:string}> = {
    anomalies:{label:'🔍 Anomalies de valorisation',color:'var(--info)'},
    drawdown:{label:'📉 Quality après drawdown',color:'var(--warning)'},
    quality:{label:'⭐ Quality Value',color:'var(--accent)'},
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(6,10,18,.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--border)',padding:'0 24px',display:'flex',alignItems:'center',gap:32,height:56}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <span style={{fontWeight:700,fontSize:15,color:'var(--text-bright)'}}>Value<span style={{color:'var(--accent)'}}>Lens</span></span>
        </Link>
        {[{href:'/',label:'Screener'},{href:'/ideas',label:'Opportunités'},{href:'/watchlist',label:'Watchlists'}].map(l=>(
          <Link key={l.href} href={l.href} style={{padding:'6px 14px',borderRadius:6,fontSize:13,fontWeight:500,textDecoration:'none',color:l.href==='/ideas'?'var(--accent)':'var(--text-dim)',background:l.href==='/ideas'?'var(--accent-dim)':'transparent'}}>{l.label}</Link>
        ))}
      </nav>
      <div style={{maxWidth:1200,margin:'0 auto',padding:24}}>
        <h1 style={{margin:'0 0 6px',fontSize:22,fontWeight:700,color:'var(--text-bright)'}}>Idea Generation</h1>
        <p style={{margin:'0 0 24px',color:'var(--text-dim)',fontSize:14}}>Situations inhabituelles détectées automatiquement</p>
        {loading ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton" style={{height:130}}/>)}</div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
            {ideas.map(idea=>{
              const sig = SIGNALS[idea.signal]||{label:idea.signal,color:'var(--text-dim)'}
              return (
                <div key={idea.ticker} className="card card-hover" onClick={()=>setSelected(idea.ticker)} style={{padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,color:'var(--text-bright)',fontSize:14}}>{idea.name?.slice(0,24)}</div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--accent)'}}>{idea.ticker}</div>
                    </div>
                    <ScoreGauge score={idea.score} size={42}/>
                  </div>
                  <div style={{marginBottom:10,padding:'5px 10px',borderRadius:6,background:`${sig.color}15`,border:`1px solid ${sig.color}30`}}>
                    <div style={{fontSize:11,color:sig.color,fontWeight:600}}>{sig.label}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2}}>{idea.detail}</div>
                  </div>
                  <div style={{display:'flex',gap:16,justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:600}}>{idea.price?.toFixed(2)}</div><div style={{fontSize:10,color:'var(--muted)'}}>Prix</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:600,color:idea.marginOfSafety>0?'var(--accent)':'var(--danger)'}}>{idea.marginOfSafety!==null?`${idea.marginOfSafety>0?'+':''}${idea.marginOfSafety.toFixed(1)}%`:'—'}</div><div style={{fontSize:10,color:'var(--muted)'}}>MoS</div></div>
                    <CategoryBadge category={idea.category}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
