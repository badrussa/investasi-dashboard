import { useState } from 'react'
import { supabase } from './supabase'
import { fmt } from './constants'

export default function Portfolio({ positions, account, onRefresh, onToast }) {
  const [editId, setEditId] = useState(null)
  const [editPrice, setEditPrice] = useState('')

  const isGold = account?.isGold

  const totalInvested = positions.reduce((s, p) => {
    if (p.type === 'emas') return s + (p.buy_price * (p.gram || 0))
    return s + (p.buy_price * (p.lot || 0) * 100)
  }, 0)

  const totalCurrent = positions.reduce((s, p) => {
    if (p.type === 'emas') return s + (p.current_price * (p.gram || 0))
    return s + (p.current_price * (p.lot || 0) * 100)
  }, 0)

  const totalPnl = totalCurrent - totalInvested
  const totalPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0

  async function updatePrice(id) {
    const { error } = await supabase.from('positions').update({ current_price: +editPrice }).eq('id', id)
    if (error) { onToast('Gagal update harga', 'err'); return }
    setEditId(null)
    onRefresh()
    onToast('Harga diperbarui ✓')
  }

  async function deletePosition(id) {
    const { error } = await supabase.from('positions').delete().eq('id', id)
    if (error) { onToast('Gagal hapus', 'err'); return }
    onRefresh()
    onToast('Posisi dihapus')
  }

  if (positions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>{account?.isGold ? '🥇' : '📊'}</div>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Belum ada posisi untuk {account?.label}</div>
        <div style={{ fontSize: 12 }}>Klik "+ Posisi" untuk mulai mencatat</div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Invested', value: fmt(totalInvested), color: 'var(--text)' },
          { label: 'Nilai Skrg', value: fmt(totalCurrent), color: totalCurrent >= totalInvested ? 'var(--green)' : 'var(--red)' },
          { label: 'P&L', value: `${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(1)}%`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Positions */}
      {positions.map(p => {
        const qty    = p.type === 'emas' ? (p.gram || 0) : (p.lot || 0) * 100
        const invested = p.buy_price * qty
        const current  = p.current_price * qty
        const pnl      = current - invested
        const pct      = invested ? (pnl / invested) * 100 : 0

        return (
          <div key={p.id} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 14, marginBottom: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: account?.color || 'var(--gold)' }}>
                    {p.type === 'emas' ? '🥇 EMAS' : p.code}
                  </span>
                  {p.type === 'emas' && <span style={{ fontSize: 11, color: 'var(--gold)' }}>BSI Gold</span>}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                  {p.type === 'emas'
                    ? `${p.gram}g · beli @ Rp${fmt(p.buy_price)}/g`
                    : `${p.lot} lot · beli @ ${p.buy_price?.toLocaleString('id-ID')}`}
                </div>
                {p.notes && <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{p.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                </div>
              </div>
            </div>

            {/* Update price row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>Harga skrg:</span>
              {editId === p.id ? (
                <>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    autoFocus
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--gold)',
                      color: 'var(--text)', borderRadius: 6, padding: '4px 8px',
                      width: 100, fontSize: 13, fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button onClick={() => updatePrice(p.id)} style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Batal</button>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>
                    {p.current_price?.toLocaleString('id-ID')}
                    {p.type === 'emas' ? '/g' : ''}
                  </span>
                  <button onClick={() => { setEditId(p.id); setEditPrice(p.current_price) }}
                    style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                    Edit
                  </button>
                  <button onClick={() => deletePosition(p.id)}
                    style={{ marginLeft: 'auto', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                    Hapus
                  </button>
                </>
              )}
            </div>

            {/* P&L bar */}
            <div style={{ marginTop: 10, background: 'var(--border)', borderRadius: 4, height: 3, overflow: 'hidden' }}>
              <div style={{
                background: pnl >= 0 ? 'var(--green)' : 'var(--red)',
                width: `${Math.min(Math.abs(pct), 100)}%`, height: '100%', borderRadius: 4
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
