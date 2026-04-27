'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Quotation {
  id: string
  quote_no: string
  product_code: string
  product_name: string
  customer: string
  volume: number
  unit_cost: number
  quote_price: number
  margin_rate: number
  created_at: string
  data_snapshot: any
}

interface QuoteRelation {
  parent_quote_id: string
  child_quote_id: string
  relation_type: string
}

export default function HistoryModule() {
  const [quotes, setQuotes] = useState<Quotation[]>([])
  const [search, setSearch] = useState('')
  const [versionFilter, setVersionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedA, setSelectedA] = useState('')
  const [selectedB, setSelectedB] = useState('')
  const [relations, setRelations] = useState<Record<string, QuoteRelation>>({})

  useEffect(() => {
    loadQuotes()
    loadRelations()
  }, [])

  async function loadQuotes() {
    setLoading(true)
    const { data } = await supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setQuotes(data as Quotation[])
    setLoading(false)
  }

  async function loadRelations() {
    const { data } = await supabase.from('quote_relations').select('*')
    if (data) {
      const relMap: Record<string, QuoteRelation> = {}
      data.forEach((r: any) => {
        relMap[r.child_quote_id] = r
      })
      setRelations(relMap)
    }
  }

  async function searchQuotes() {
    setLoading(true)
    let query = supabase.from('quotations').select('*')
    
    if (search) {
      query = query.or(`product_code.ilike.%${search}%,product_name.ilike.%${search}%,customer.ilike.%${search}%`)
    }
    if (versionFilter) {
      query = query.filter('data_snapshot->>version', 'ilike', `%${versionFilter}%`)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }
    
    const { data } = await query.order('created_at', { ascending: false }).limit(100)
    if (data) setQuotes(data as Quotation[])
    setLoading(false)
  }

  const filtered = quotes

  const quoteA = quotes.find(q => q.id === selectedA)
  const quoteB = quotes.find(q => q.id === selectedB)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input className="input w-48" placeholder="产品编码/名称/客户" value={search} onChange={e => setSearch(e.target.value)} />
          <input className="input w-32" placeholder="版本号" value={versionFilter} onChange={e => setVersionFilter(e.target.value)} />
          <input type="date" className="input w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-gray-400">~</span>
          <input type="date" className="input w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="btn btn-primary" onClick={searchQuotes} disabled={loading}>
            {loading ? '搜索中...' : '🔍 搜索'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setVersionFilter(''); setDateFrom(''); setDateTo(''); loadQuotes() }}>重置</button>
          <button className="btn btn-secondary" onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? '取消对比' : '🔍 版本对比'}
          </button>
        </div>

        {compareMode && (
          <div className="flex items-center gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">版本A</label>
              <select className="input" value={selectedA} onChange={e => setSelectedA(e.target.value)}>
                <option value="">请选择</option>
                {quotes.map(q => <option key={q.id} value={q.id}>{q.quote_no} {q.product_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">版本B</label>
              <select className="input" value={selectedB} onChange={e => setSelectedB(e.target.value)}>
                <option value="">请选择</option>
                {quotes.map(q => <option key={q.id} value={q.id}>{q.quote_no} {q.product_name}</option>)}
              </select>
            </div>
          </div>
        )}

        {compareMode && quoteA && quoteB && (
          <div className="card p-4 mb-4 bg-blue-50">
            <h4 className="font-semibold mb-2">版本差异对比</h4>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th>项目</th><th>版本A ({quoteA.quote_no})</th><th>版本B ({quoteB.quote_no})</th><th>差异</th></tr></thead>
              <tbody>
                <tr className="border-b"><td>产品编码</td><td>{quoteA.product_code}</td><td>{quoteB.product_code}</td><td>{quoteA.product_code === quoteB.product_code ? '一致' : '不同'}</td></tr>
                <tr className="border-b"><td>基准产量</td><td>{quoteA.volume}</td><td>{quoteB.volume}</td><td>{quoteB.volume - quoteA.volume}</td></tr>
                <tr className="border-b"><td>单位成本</td><td>¥{quoteA.unit_cost.toFixed(2)}</td><td>¥{quoteB.unit_cost.toFixed(2)}</td><td className={quoteB.unit_cost > quoteA.unit_cost ? 'text-red-600' : 'text-green-600'}>¥{(quoteB.unit_cost - quoteA.unit_cost).toFixed(2)}</td></tr>
                <tr className="border-b"><td>报价</td><td>¥{quoteA.quote_price.toFixed(2)}</td><td>¥{quoteB.quote_price.toFixed(2)}</td><td className={quoteB.quote_price > quoteA.quote_price ? 'text-green-600' : 'text-red-600'}>¥{(quoteB.quote_price - quoteA.quote_price).toFixed(2)}</td></tr>
                <tr className="border-b"><td>毛利率</td><td>{quoteA.margin_rate}%</td><td>{quoteB.margin_rate}%</td><td>{(quoteB.margin_rate - quoteA.margin_rate).toFixed(2)}%</td></tr>
              </tbody>
            </table>
          </div>
        )}

        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>报价单号</th><th>产品编码</th><th>产品名称</th><th>客户</th><th>版本</th><th>产量</th><th>单位成本</th><th>报价</th><th>毛利率</th><th>创建时间</th><th>关联</th></tr></thead>
          <tbody>
            {filtered.map(q => {
              const rel = relations[q.id]
              return (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">{q.quote_no}</td>
                  <td>{q.product_code}</td>
                  <td>{q.product_name}</td>
                  <td>{q.customer || '-'}</td>
                  <td>{q.data_snapshot?.version || '-'}</td>
                  <td>{q.volume}</td>
                  <td>¥{q.unit_cost.toFixed(2)}</td>
                  <td>¥{q.quote_price.toFixed(2)}</td>
                  <td>{q.margin_rate}%</td>
                  <td className="text-gray-500">{new Date(q.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    {rel && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${rel.relation_type === 'version' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {rel.relation_type === 'version' ? '版本顺延' : '复制'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
