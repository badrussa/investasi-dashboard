import { useState } from 'react'
import { supabase } from './supabase'

export default function AddPosition({ account, onSaved, onToast }) {
  const isGold = account?.isGold
  const [type, setType] = useState(isGold ? 'emas' : 'saham')
  const [form, setForm] = useState({ code: '', name: '', buy_price: '', current_price: '', lot: '', gram: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.buy_price || !form.current_price) { onToast('Harga beli & harga sekarang wajib diisi', 'err'); return }
    if (type === 'saham' && !form.code) { onToast('Kode saham wajib diisi', 'err'); return }
    if (type === 'emas' && !form.gram) { onToast('Jumlah gram wajib diisi', 'err'); return }
    if (type === 'saham' && !form.lot) { onToast('Jumlah lot wajib diisi', 'err'); return }

    setSaving(true)
    const payload = {
      account: account.id,
      type,
      code: type === 'emas' ? 'EMAS' : form.code.toUpperCase(),
      name: type === 'emas' ? 'BSI Gold' : form.name,
      buy_price: +form.buy_price,
      current_price: +form.current_price,
      lot: type === 'saham' ? +form.lot : null,
      gram: type === 'emas' ? +form.gram : null,
      notes: form.notes || null,
    }

    const { error } = await supabase.from('positions').insert([payload])
    setSaving(false)
    if (error) { onToast('Gagal menyimpan: ' + error.message, 'err'); return }
    onSaved()
  }

  const inputStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: 8, padding: '10px 12px',
    width: '100%', fontSize: 14, fontFamily: 'var(--font-body)',
    outline: 'none',
  }

  const labelStyle = { color: 'var(--muted)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
      <div style={{ color: account?.color || 'var(--gold)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
        {account?.icon} Tambah Posisi — {account?.label}
      </div>

      {/* Type toggle (only show if not forced gold) */}
      {!isGold && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['saham', 'emas'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: type === t ? (account?.color || 'var(--gold)') : 'var(--surface)',
              color: type === t ? '#000' : 'var(--muted)',
              border: `1px solid ${type === t ? (account?.color || 'var(--gold)') : 'var(--border)'}`,
            }}>
              {t === 'emas' ? '🥇 Emas' : '📊 Saham'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {type === 'saham' && (
          <>
            <div>
              <label style={labelStyle}>Kode Saham</label>
              <input style={inputStyle} placeholder="misal: SIDO" value={form.code} onChange={e => set('code', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nama Perusahaan (opsional)</label>
              <input style={inputStyle} placeholder="misal: Sido Muncul" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Jumlah Lot</label>
              <input style={inputStyle} type="number" placeholder="misal: 5" value={form.lot} onChange={e => set('lot', e.target.value)} />
            </div>
          </>
        )}

        {type === 'emas' && (
          <div>
            <label style={labelStyle}>Jumlah Gram</label>
            <input style={inputStyle} type="number" placeholder="misal: 2.5" step="0.01" value={form.gram} onChange={e => set('gram', e.target.value)} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Harga Beli {type === 'emas' ? '(per gram)' : '(per lembar)'}</label>
            <input style={inputStyle} type="number" placeholder="misal: 3200" value={form.buy_price} onChange={e => set('buy_price', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Harga Sekarang</label>
            <input style={inputStyle} type="number" placeholder="misal: 3400" value={form.current_price} onChange={e => set('current_price', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Catatan (opsional)</label>
          <input style={inputStyle} placeholder="misal: beli saat koreksi, target dividen" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button onClick={save} disabled={saving} style={{
          background: account?.color || 'var(--gold)', color: '#000',
          border: 'none', borderRadius: 8, padding: '12px 0',
          fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1, marginTop: 4
        }}>
          {saving ? 'Menyimpan...' : 'Simpan Posisi'}
        </button>

        <div style={{ color: 'var(--muted)', fontSize: 11 }}>
          💡 Alert otomatis: turun ≥10% → averaging signal · naik ≥15% → pertimbangkan jual sebagian · turun ≥25% → review segera
        </div>
      </div>
    </div>
  )
}
