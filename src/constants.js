export const ACCOUNTS = [
  { id: 'andre',      label: 'Andre',       icon: '👤', color: '#3a7bd5' },
  { id: 'nora',       label: 'Nora',        icon: '👤', color: '#9b59b6' },
  { id: 'matteo',     label: 'Matteo',      icon: '👦', color: '#e67e22' },
  { id: 'ellano',     label: 'Ellano',      icon: '👦', color: '#1abc9c' },
  { id: 'emil_buyah', label: 'Emil & Buyah',icon: '👫', color: '#e91e8c' },
  { id: 'sayure',     label: 'Sayure',      icon: '👤', color: '#f39c12' },
  { id: 'umum',       label: 'Umum',        icon: '🏦', color: '#7f8c8d' },
  { id: 'bsi_emas',   label: 'BSI Emas',    icon: '🥇', color: '#c9a84c', isGold: true },
]

export const SYARIAH_UNIVERSE = [
  { code: 'ICBP',  name: 'Indofood CBP',          sector: 'Consumer',     der: 0.6,  divYield: 3.8, roe: 18, growth: 'Medium' },
  { code: 'KLBF',  name: 'Kalbe Farma',            sector: 'Farmasi',      der: 0.2,  divYield: 2.8, roe: 15, growth: 'Medium' },
  { code: 'SIDO',  name: 'Sido Muncul',            sector: 'Herbal/FMCG',  der: 0.05, divYield: 5.2, roe: 22, growth: 'Medium' },
  { code: 'PTBA',  name: 'Bukit Asam',             sector: 'Batubara BUMN',der: 0.4,  divYield: 8.1, roe: 24, growth: 'Low'    },
  { code: 'BRIS',  name: 'Bank Syariah Indonesia', sector: 'Perbankan',    der: null, divYield: 1.2, roe: 16, growth: 'High'   },
  { code: 'PGAS',  name: 'Perusahaan Gas Negara',  sector: 'Energi',       der: 1.1,  divYield: 6.5, roe: 12, growth: 'Low'    },
  { code: 'MIKA',  name: 'Mitra Keluarga',         sector: 'Kesehatan',    der: 0.1,  divYield: 1.5, roe: 20, growth: 'Medium' },
  { code: 'ANTM',  name: 'Aneka Tambang',          sector: 'Tambang',      der: 0.5,  divYield: 3.2, roe: 10, growth: 'Medium' },
  { code: 'AKRA',  name: 'AKR Corporindo',         sector: 'Distribusi',   der: 0.8,  divYield: 3.5, roe: 14, growth: 'Medium' },
  { code: 'INTP',  name: 'Indocement',             sector: 'Semen',        der: 0.1,  divYield: 2.1, roe: 8,  growth: 'Low'    },
  { code: 'SMGR',  name: 'Semen Indonesia',        sector: 'Semen',        der: 0.9,  divYield: 2.8, roe: 9,  growth: 'Low'    },
  { code: 'MDKA',  name: 'Merdeka Copper Gold',    sector: 'Tambang',      der: 1.2,  divYield: 0.5, roe: 8,  growth: 'High'   },
  { code: 'EXCL',  name: 'XL Smart',               sector: 'Telco',        der: 1.4,  divYield: 1.8, roe: 7,  growth: 'Medium' },
  { code: 'ISAT',  name: 'Indosat',                sector: 'Telco',        der: 1.6,  divYield: 1.2, roe: 11, growth: 'Medium' },
  { code: 'MAPI',  name: 'Mitra Adiperkasa',       sector: 'Retail',       der: 1.0,  divYield: 1.0, roe: 13, growth: 'Medium' },
  { code: 'ACES',  name: 'Ace Hardware',           sector: 'Retail',       der: 0.3,  divYield: 2.5, roe: 14, growth: 'Medium' },
  { code: 'JPFA',  name: 'Japfa Comfeed',          sector: 'Agribisnis',   der: 1.1,  divYield: 2.0, roe: 13, growth: 'Medium' },
]

export function scoreStock(s) {
  let score = 0
  if (s.der === null) score += 5
  else if (s.der < 0.3) score += 10
  else if (s.der < 0.7) score += 8
  else if (s.der < 1.2) score += 5
  else if (s.der <= 2)  score += 2
  else score -= 5

  if (s.divYield >= 5)   score += 10
  else if (s.divYield >= 3) score += 7
  else if (s.divYield >= 1.5) score += 4
  else score += 1

  if (s.roe >= 20)       score += 10
  else if (s.roe >= 15)  score += 7
  else if (s.roe >= 10)  score += 4
  else score += 1

  if (s.growth === 'High')   score += 8
  else if (s.growth === 'Medium') score += 5
  else score += 2

  return score
}

export function verdict(score) {
  if (score >= 30) return { label: 'Layak Beli',   color: '#27ae60', bg: '#0d2e1a' }
  if (score >= 20) return { label: 'Perlu Riset',  color: '#c9a84c', bg: '#2a2010' }
  return              { label: 'Skip',           color: '#e74c3c', bg: '#2a0d0d' }
}

export function getAlerts(positions) {
  const alerts = []
  positions.forEach(p => {
    const ref  = p.type === 'emas' ? p.buy_price : p.buy_price
    const curr = p.current_price
    if (!ref || !curr) return
    const pct = ((curr - ref) / ref) * 100
    if (pct <= -25) alerts.push({ ...p, type_alert: 'REVIEW',    pct, msg: `Turun ${Math.abs(pct).toFixed(1)}% — review fundamental segera` })
    else if (pct <= -10) alerts.push({ ...p, type_alert: 'AVERAGING', pct, msg: `Turun ${Math.abs(pct).toFixed(1)}% — pertimbangkan averaging` })
    if (pct >= 15)  alerts.push({ ...p, type_alert: 'JUAL',      pct, msg: `Naik ${pct.toFixed(1)}% — pertimbangkan jual sebagian` })
  })
  return alerts
}

export function fmt(n) {
  if (!n && n !== 0) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n/1_000_000).toFixed(1)}jt`
  if (Math.abs(n) >= 1_000)     return `${(n/1_000).toFixed(0)}rb`
  return n.toLocaleString('id-ID')
}
