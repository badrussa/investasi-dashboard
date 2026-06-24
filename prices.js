export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { codes } = req.query
  if (!codes) {
    return res.status(400).json({ error: 'Parameter codes diperlukan' })
  }

  // Filter out EMAS — Yahoo Finance tidak punya harga BSI Emas
  const codeList = codes
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(c => c && c !== 'EMAS')

  if (codeList.length === 0) {
    return res.status(200).json({ prices: {}, found: 0, notFound: [] })
  }

  // IDX stocks pakai suffix .JK di Yahoo Finance
  const symbols = codeList.map(c => `${c}.JK`).join(',')

  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,shortName`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance error: HTTP ${response.status}`)
    }

    const data = await response.json()
    const quotes = data?.quoteResponse?.result || []

    const prices = {}
    quotes.forEach(q => {
      if (q.regularMarketPrice) {
        const code = q.symbol.replace('.JK', '')
        prices[code] = Math.round(q.regularMarketPrice)
      }
    })

    const notFound = codeList.filter(c => !prices[c])

    return res.status(200).json({
      prices,
      found: Object.keys(prices).length,
      notFound,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
