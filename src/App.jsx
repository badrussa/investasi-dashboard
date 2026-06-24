import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { ACCOUNTS, getAlerts, fmt } from './constants'
import Portfolio from './Portfolio'
import Screener from './Screener'
import AddPosition from './AddPosition'

export default function App() {
  const [activeAccount, setActiveAccount] = useState('andre')
  const [tab, setTab] = useState('portfolio')
  const [allPositions, setAllPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data, error } = await supabase.from('positions').select('*').order('created_at', { ascending: false })
    if (!error) setAllPositions(data || [])
    setLoading(false)
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ─── UPDATE SEMUA HARGA DARI YAHOO FINANCE ───────────────────────────────
  async function updateAllPrices() {
    setRefreshing(true)
    try {
      const codes = [...new Set(
        allPositions
          .filter(p => p.type === 'saham' && p.code && p.code !== 'EMAS')
          .map(p => p.code)
      )]

      if (codes.length === 0) {
        showToast('Tidak ada posisi saham untuk di-update', 'err')
        return
      }

      const res = await fetch(`/api/prices?codes=${codes.join(',')}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const { prices, found, notFound } = await res.json()

      if (!prices || found === 0) {
        throw new Error('Tidak ada harga yang berhasil diambil dari Yahoo Finance')
      }

      // Batch update ke Supabase
      const updates = allPositions
        .filter(p => p.type === 'saham' && prices[p.code] !== undefined)
        .map(p =>
          supabase
            .from('positions')
            .update({ current_price: prices[p.code] })
            .eq('id', p.id)
        )

      await Promise.all(updates)
      await fetchAll()

      setLastUpdated(new Date())

      const msg = notFound?.length > 0
        ? `✓ ${found} saham diupdate · Tidak ditemukan: ${notFound.join(', ')}`
        : `✓ ${found} saham diupdate dari Yahoo Finance`
      showToast(msg)

    } catch (err) {
      showToast('Gagal update harga: ' + err.message, 'err')
    } finally {
      setRefreshing(false)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const positions = allPositions.filter(p => p.account === activeAccount)
  const alerts = getAlerts(positions)

  const summary = ACCOUNTS.map(acc => {
    const pos = allPositions.filter(p => p.account === acc.id)
    const invested = pos.reduce((s, p) => {
      if (p.type === 'emas') return s + (p.buy_price * (p.gram || 0))
      return s + (p.buy_price * (p.lot || 0) * 100)
    }, 0)
    const current = pos.reduce((s, p) => {
      if (p.type === 'emas') return s + (p.current_price * (p.gram || 0))
      return s + (p.current_price * (p.lot || 0) * 100)
    }, 0)
    const pnl = current - invested
    const pct = invested ? (pnl / invested) * 100 : 0
    return { ...acc, invested, current, pnl, pct, count: pos.length }
  })

  const account = ACCOUNTS.find(a => a.id === activeAccount)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 999,
          background: toast.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${toast.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
          color: toast.type === 'ok' ? 'var(--green)' : 'var(--red)',
          borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: 360
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>
            ◆ INVESTASI DASHBOARD
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>IDX Syariah · BSI Emas · Multi Akun</div>
        </div>

        {/* Refresh Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={updateAllPrices}
            disabled={refreshing || loading}
            style={{
              background: refreshing ? 'var(--surface)' : 'var(--gold-dim)',
              border: `1px solid ${refreshing ? 'var(--border)' : 'var(--gold)'}`,
              color: refreshing ? 'var(--muted)' : 'var(--gold)',
              borderRadius: 6, padding: '6px 12px', cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', opacity: refreshing ? 0.7 : 1
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }}>🔄</span>
            {refreshing ? 'Mengambil harga...' : 'Update Harga'}
          </button>
          {lastUpdated && (
            <div style={{ color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              update: {lastUpdated.toLocaleTimeString('id-ID')}
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '6px', color: 'var(--muted)', fontSize: 11, borderBottom: '1px solid var(--border)' }}>
          memuat...
        </div>
      )}

      {/* Account Summary Bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {summary.map(acc => (
            <button key={acc.id} onClick={() => { setActiveAccount(acc.id); setTab('portfolio') }}
              style={{
                background: activeAccount === acc.id ? acc.color + '22' : 'var(--surface)',
                border: `1px solid ${activeAccount === acc.id ? acc.color : 'var(--border)'}`,
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                minWidth: 110, transition: 'all 0.15s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{acc.icon}</span>
                <span style={{ color: activeAccount === acc.id ? acc.color : 'var(--muted)', fontSize: 11, fontWeight: 700 }}>{acc.label}</span>
              </div>
              {acc.count > 0 ? (
                <>
                  <div style={{ color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(acc.current)}</div>
                  <div style={{ color: acc.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {acc.pct >= 0 ? '+' : ''}{acc.pct.toFixed(1)}%
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>kosong</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              background: a.type_alert === 'JUAL' ? 'var(--green-dim)' : a.type_alert === 'REVIEW' ? 'var(--red-dim)' : '#1a1a08',
              border: `1px solid ${a.type_alert === 'JUAL' ? 'var(--green)' : a.type_alert === 'REVIEW' ? 'var(--red)' : 'var(--gold)'}`,
              borderRadius: 6, padding: '8px 12px', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12
            }}>
              <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{a.code}</span> — {a.msg}</span>
              <span style={{
                background: 'transparent',
                color: a.type_alert === 'JUAL' ? 'var(--green)' : a.type_alert === 'REVIEW' ? 'var(--red)' : 'var(--gold)',
                border: `1px solid currentColor`, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700
              }}>{a.type_alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        {['portfolio', 'screener', 'tambah'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 16px', fontSize: 12, fontWeight: 600,
            color: tab === t ? account?.color || 'var(--gold)' : 'var(--muted)',
            borderBottom: tab === t ? `2px solid ${account?.color || 'var(--gold)'}` : '2px solid transparent',
            textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.15s'
          }}>
            {t === 'tambah' ? '+ Posisi' : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'portfolio' && (
          <Portfolio
            positions={positions}
            account={account}
            onRefresh={fetchAll}
            onToast={showToast}
          />
        )}
        {tab === 'screener' && <Screener />}
        {tab === 'tambah' && (
          <AddPosition
            account={account}
            onSaved={() => { fetchAll(); setTab('portfolio'); showToast('Posisi disimpan ✓') }}
            onToast={showToast}
          />
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
