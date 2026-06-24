import { useState } from 'react'
import { SYARIAH_UNIVERSE, scoreStock, verdict } from './constants'

export default function Screener() {
  const [filterDer, setFilterDer]     = useState(2)
  const [filterDiv, setFilterDiv]     = useState(0)
  const [filterGrowth, setFilterGrowth] = useState('All')

  const filtered = SYARIAH_UNIVERSE
    .filter(s =>
      (s.der === null || s.der <= filterDer) &&
      s.divYield >= filterDiv &&
      (filterGrowth === 'All' || s.growth === filterGrowth)
    )
    .map(s => ({ ...s, score: scoreStock(s) }))
    .sort((a, b) => b.score - a.score)

  const selectStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 13,
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Filter Screener</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 4 }}>MAX DER</div>
            <select style={selectStyle} value={filterDer} onChange={e => setFilterDer(+e.target.value)}>
              <option value={0.5}>≤ 0.5x</option>
              <option value={1}>≤ 1x</option>
              <option value={2}>≤ 2x</option>
              <option value={5}>Semua</option>
            </select>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 4 }}>MIN DIVIDEN</div>
            <select style={selectStyle} value={filterDiv} onChange={e => setFilterDiv(+e.target.value)}>
              <option value={0}>Semua</option>
              <option value={2}>≥ 2%</option>
              <option value={3}>≥ 3%</option>
              <option value={5}>≥ 5%</option>
            </select>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 4 }}>GROWTH</div>
            <select style={selectStyle} value={filterGrowth} onChange={e => setFilterGrowth(e.target.value)}>
              <option value="All">Semua</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10 }}>
        ⚠️ Data fundamental adalah estimasi historis. Verifikasi harga & DER terbaru di Stockbit/IDX sebelum eksekusi.
      </div>

      {filtered.map(s => {
        const v = verdict(s.score)
        return (
          <div key={s.code} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)', fontSize: 15 }}>{s.code}</span>
                <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>{s.name}</span>
              </div>
              <span style={{
                background: v.bg, color: v.color,
                border: `1px solid ${v.color}60`, borderRadius: 4,
                padding: '2px 8px', fontSize: 11, fontWeight: 700
              }}>{v.label}</span>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'DER', value: s.der === null ? 'Bank*' : `${s.der}x`, color: s.der === null ? 'var(--blue)' : s.der < 0.5 ? 'var(--green)' : s.der < 1.5 ? 'var(--gold)' : 'var(--red)' },
                { label: 'Dividen', value: `${s.divYield}%`, color: s.divYield >= 4 ? 'var(--green)' : 'var(--text)' },
                { label: 'ROE', value: `${s.roe}%`, color: s.roe >= 18 ? 'var(--green)' : 'var(--text)' },
                { label: 'Growth', value: s.growth, color: s.growth === 'High' ? 'var(--green)' : s.growth === 'Medium' ? 'var(--gold)' : 'var(--muted)' },
                { label: 'Sektor', value: s.sector, color: 'var(--text)' },
              ].map(f => (
                <div key={f.label} style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>{f.label}: </span>
                  <span style={{ color: f.color, fontWeight: 600, fontFamily: f.label !== 'Sektor' && f.label !== 'Growth' ? 'var(--font-mono)' : 'inherit' }}>{f.value}</span>
                </div>
              ))}
            </div>

            {/* Score bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ background: 'var(--border)', borderRadius: 4, height: 3, overflow: 'hidden' }}>
                <div style={{ background: v.color, width: `${(s.score / 38) * 100}%`, height: '100%', borderRadius: 4 }} />
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 3 }}>Skor: {s.score}/38</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
