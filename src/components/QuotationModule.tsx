'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MaterialItem {
  id: string
  code: string
  name: string
  source: string
  unitPrice: number
  qty: number
  lossRate: number
}

interface ProcessItem {
  id: string
  code: string
  name: string
  minutes: number
  hourlyRate: number
}

interface QuoteTemplate {
  id: string
  code: string
  name: string
  spec: string
  customer: string
  volume: number
  materials: MaterialItem[]
  processes: ProcessItem[]
  version: string
}

export default function QuotationModule() {
  const [product, setProduct] = useState({ code: 'P-2024-001', name: '智能控制器A型', spec: 'KZQ-100A', customer: '', volume: 5000 })
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: '1', code: 'SF-001', name: '主控板', source: '外购', unitPrice: 15.5, qty: 1, lossRate: 2 },
    { id: '2', code: 'SF-002', name: '外壳组件', source: '自制', unitPrice: 0, qty: 1, lossRate: 3 },
    { id: '3', code: 'PK-001', name: '外箱', source: '外购', unitPrice: 2.5, qty: 0.1, lossRate: 1 },
    { id: '4', code: 'PK-002', name: '说明书', source: '外购', unitPrice: 0.3, qty: 1, lossRate: 1 },
  ])
  const [processes, setProcesses] = useState<ProcessItem[]>([
    { id: '1', code: 'PR-001', name: 'SMT贴片', minutes: 5, hourlyRate: 45 },
    { id: '2', code: 'PR-002', name: '插件焊接', minutes: 8, hourlyRate: 40 },
    { id: '3', code: 'PR-003', name: '组装测试', minutes: 12, hourlyRate: 38 },
  ])
  const [mfgRates, setMfgRates] = useState({ energy: 2.5, manage: 1.5, material: 0.8, equip: 3.0 })
  const [periodRates, setPeriodRates] = useState({ sales: 3, manage: 5, finance: 1 })
  const [other, setOther] = useState({ pack: 0.5, logistics: 1.2, vat: 13, defect: 2 })
  const [targetMargin, setTargetMargin] = useState(20)
  const [version, setVersion] = useState('V1.0')
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false)
  const [newQuoteMode, setNewQuoteMode] = useState<'blank' | 'copy' | 'version'>('blank')
  const [savedQuotes, setSavedQuotes] = useState<QuoteTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSavedQuotes()
  }, [])

  async function loadSavedQuotes() {
    const { data } = await supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(20)
    if (data) {
      setSavedQuotes(data.map(q => ({
        id: q.id,
        code: q.product_code,
        name: q.product_name,
        spec: q.data_snapshot?.spec || '',
        customer: q.customer || '',
        volume: q.volume,
        materials: q.data_snapshot?.materials || [],
        processes: q.data_snapshot?.processes || [],
        version: q.quote_no || 'V1.0'
      })))
    }
  }

  function createNewQuote() {
    setShowNewQuoteModal(true)
  }

  function confirmNewQuote() {
    if (newQuoteMode === 'blank') {
      // 全新空白报价
      setProduct({ code: '', name: '', spec: '', customer: '', volume: 1000 })
      setMaterials([])
      setProcesses([])
      setVersion('V1.0')
    } else if (newQuoteMode === 'copy' && selectedTemplate) {
      // 沿用之前报价修正
      const template = savedQuotes.find(q => q.id === selectedTemplate)
      if (template) {
        setProduct({ code: template.code, name: template.name, spec: template.spec, customer: template.customer, volume: template.volume })
        setMaterials(template.materials.length > 0 ? template.materials : [])
        setProcesses(template.processes.length > 0 ? template.processes : [])
        setVersion(template.version)
      }
    } else if (newQuoteMode === 'version' && selectedTemplate) {
      // 顺延V2报价
      const template = savedQuotes.find(q => q.id === selectedTemplate)
      if (template) {
        setProduct({ code: template.code, name: template.name, spec: template.spec, customer: template.customer, volume: template.volume })
        setMaterials(template.materials.length > 0 ? template.materials : [])
        setProcesses(template.processes.length > 0 ? template.processes : [])
        // 版本号递增
        const vMatch = template.version.match(/V(\d+)\.?(\d*)/)
        if (vMatch) {
          const major = parseInt(vMatch[1])
          const minor = vMatch[2] ? parseInt(vMatch[2]) : 0
          setVersion(`V${major}.${minor + 1}`)
        } else {
          setVersion('V2.0')
        }
      }
    }
    setShowNewQuoteModal(false)
    setSelectedTemplate('')
  }

  async function saveToHistory() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('请先登录'); setLoading(false); return }

    const unitCost = materialCost + laborCost + mfgCost
    const quoteNoVat = unitCost / (1 - targetMargin / 100)

    const { error } = await supabase.from('quotations').insert({
      user_id: user.id,
      quote_no: `Q${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Date.now()).slice(-4)}`,
      product_code: product.code || 'NEW',
      product_name: product.name || '新报价',
      customer: product.customer,
      volume: product.volume,
      unit_cost: unitCost,
      quote_price: quoteNoVat,
      margin_rate: targetMargin,
      data_snapshot: {
        spec: product.spec,
        materials,
        processes,
        mfgRates,
        periodRates,
        other,
        version,
        targetMargin
      }
    })

    setLoading(false)
    if (error) alert('保存失败: ' + error.message)
    else { alert('报价已保存到历史库'); loadSavedQuotes() }
  }

  const materialCost = materials.reduce((sum, m) => sum + (m.unitPrice * m.qty * (1 + m.lossRate / 100)), 0)
  const laborCost = processes.reduce((sum, p) => sum + (p.minutes / 60 * p.hourlyRate), 0)
  const mfgCost = mfgRates.energy + mfgRates.manage + mfgRates.material + mfgRates.equip
  const totalCost = materialCost + laborCost + mfgCost
  const quoteNoVat = totalCost / (1 - targetMargin / 100)
  const quoteWithVat = quoteNoVat * (1 + other.vat / 100)
  const profit = (quoteNoVat - totalCost) * product.volume

  return (
    <div className="space-y-6">
      {/* New Quote Modal */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">新建报价</h3>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="newMode" value="blank" checked={newQuoteMode === 'blank'} onChange={() => setNewQuoteMode('blank')} />
                <div>
                  <div className="font-medium">全新空白报价</div>
                  <div className="text-sm text-gray-500">从零开始创建新报价单</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="newMode" value="copy" checked={newQuoteMode === 'copy'} onChange={() => setNewQuoteMode('copy')} />
                <div>
                  <div className="font-medium">沿用之前报价修正</div>
                  <div className="text-sm text-gray-500">复制已有报价数据并编辑修改</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="newMode" value="version" checked={newQuoteMode === 'version'} onChange={() => setNewQuoteMode('version')} />
                <div>
                  <div className="font-medium">顺延V2报价</div>
                  <div className="text-sm text-gray-500">基于已有报价创建新版本（版本号自动递增）</div>
                </div>
              </label>
            </div>

            {(newQuoteMode === 'copy' || newQuoteMode === 'version') && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">选择历史报价</label>
                <select className="input" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                  <option value="">请选择...</option>
                  {savedQuotes.map(q => (
                    <option key={q.id} value={q.id}>{q.code} {q.name} ({q.version})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowNewQuoteModal(false)}>取消</button>
              <button className="btn-primary" onClick={confirmNewQuote}>确认</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">版本: {version}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={createNewQuote}>➕ 新建报价</button>
          <button className="btn btn-secondary" onClick={saveToHistory} disabled={loading}>
            {loading ? '保存中...' : '💾 保存到历史库'}
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '直接材料成本', value: `¥${materialCost.toFixed(2)}` },
          { label: '直接人工成本', value: `¥${laborCost.toFixed(2)}` },
          { label: '制造费用', value: `¥${mfgCost.toFixed(2)}` },
          { label: '期间费用', value: `¥${(totalCost * (periodRates.sales + periodRates.manage + periodRates.finance) / 100).toFixed(2)}` },
          { label: '单位完全成本', value: `¥${totalCost.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-xl font-bold text-blue-700">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">📋 产品基础信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '产品编码', value: product.code, onChange: (v: string) => setProduct({ ...product, code: v }) },
              { label: '产品名称', value: product.name, onChange: (v: string) => setProduct({ ...product, name: v }) },
              { label: '产品规格', value: product.spec, onChange: (v: string) => setProduct({ ...product, spec: v }) },
              { label: '客户名称', value: product.customer, onChange: (v: string) => setProduct({ ...product, customer: v }) },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                <input className="input" value={f.value} onChange={e => f.onChange(e.target.value)} />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-600 mb-1">基准产量</label>
              <input type="number" className="input" value={product.volume} onChange={e => setProduct({ ...product, volume: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">版本号</label>
              <input className="input" value={version} onChange={e => setVersion(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Material Cost */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🔧 直接材料成本</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setMaterials([...materials, { id: Date.now().toString(), code: '', name: '', source: '外购', unitPrice: 0, qty: 1, lossRate: 0 }])}>+ 添加</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">编码</th><th className="text-left">名称</th><th className="text-left">来源</th><th className="text-right">单价</th><th className="text-right">单耗</th><th className="text-right">损耗</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {materials.map((m, idx) => (
                <tr key={m.id} className="border-b">
                  <td className="py-1"><input className="input w-24 text-sm py-1" value={m.code} onChange={e => { const newM = [...materials]; newM[idx].code = e.target.value; setMaterials(newM) }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={m.name} onChange={e => { const newM = [...materials]; newM[idx].name = e.target.value; setMaterials(newM) }} /></td>
                  <td><select className="input text-sm py-1" value={m.source} onChange={e => { const newM = [...materials]; newM[idx].source = e.target.value; setMaterials(newM) }}><option>外购</option><option>自制</option></select></td>
                  <td className="text-right"><input type="number" className="input w-20 text-sm py-1 text-right" value={m.unitPrice} onChange={e => { const newM = [...materials]; newM[idx].unitPrice = Number(e.target.value); setMaterials(newM) }} /></td>
                  <td className="text-right"><input type="number" className="input w-16 text-sm py-1 text-right" value={m.qty} onChange={e => { const newM = [...materials]; newM[idx].qty = Number(e.target.value); setMaterials(newM) }} /></td>
                  <td className="text-right"><input type="number" className="input w-16 text-sm py-1 text-right" value={m.lossRate} onChange={e => { const newM = [...materials]; newM[idx].lossRate = Number(e.target.value); setMaterials(newM) }} /></td>
                  <td className="text-right"><button className="text-red-500 text-sm" onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right font-semibold">直接材料总成本: ¥{materialCost.toFixed(2)}</div>
        </div>

        {/* Labor */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">👷 直接人工成本</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setProcesses([...processes, { id: Date.now().toString(), code: '', name: '', minutes: 0, hourlyRate: 0 }])}>+ 添加</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">工序</th><th className="text-right">工时(分)</th><th className="text-right">工价</th><th className="text-right">成本</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {processes.map((p, idx) => (
                <tr key={p.id} className="border-b">
                  <td className="py-1 flex gap-2"><input className="input w-20 text-sm py-1" value={p.code} onChange={e => { const newP = [...processes]; newP[idx].code = e.target.value; setProcesses(newP) }} placeholder="编码" /><input className="input w-24 text-sm py-1" value={p.name} onChange={e => { const newP = [...processes]; newP[idx].name = e.target.value; setProcesses(newP) }} placeholder="名称" /></td>
                  <td className="text-right"><input type="number" className="input w-16 text-sm py-1 text-right" value={p.minutes} onChange={e => { const newP = [...processes]; newP[idx].minutes = Number(e.target.value); setProcesses(newP) }} /></td>
                  <td className="text-right"><input type="number" className="input w-16 text-sm py-1 text-right" value={p.hourlyRate} onChange={e => { const newP = [...processes]; newP[idx].hourlyRate = Number(e.target.value); setProcesses(newP) }} /></td>
                  <td className="text-right">¥{(p.minutes / 60 * p.hourlyRate).toFixed(2)}</td>
                  <td className="text-right"><button className="text-red-500 text-sm" onClick={() => setProcesses(processes.filter((_, i) => i !== idx))}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right font-semibold">人工成本合计: ¥{laborCost.toFixed(2)}</div>
        </div>

        {/* MFG */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">🏭 制造费用</h3>
          <div className="space-y-3">
            {[
              { label: '水电能耗分摊', value: mfgRates.energy, onChange: (v: number) => setMfgRates({ ...mfgRates, energy: v }) },
              { label: '车间管理费用分摊', value: mfgRates.manage, onChange: (v: number) => setMfgRates({ ...mfgRates, manage: v }) },
              { label: '辅料消耗分摊', value: mfgRates.material, onChange: (v: number) => setMfgRates({ ...mfgRates, material: v }) },
              { label: '设备成本合计', value: mfgRates.equip, onChange: (v: number) => setMfgRates({ ...mfgRates, equip: v }) },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{f.label}</span>
                <input type="number" className="input w-32 text-right" value={f.value} onChange={e => f.onChange(Number(e.target.value))} />
              </div>
            ))}
          </div>
          <div className="mt-3 text-right font-semibold">制造费用合计: ¥{mfgCost.toFixed(2)}</div>
        </div>

        {/* Period */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">📊 期间费用</h3>
          <div className="space-y-3">
            {[
              { label: '销售费用比例', value: periodRates.sales, onChange: (v: number) => setPeriodRates({ ...periodRates, sales: v }) },
              { label: '管理费用比例', value: periodRates.manage, onChange: (v: number) => setPeriodRates({ ...periodRates, manage: v }) },
              { label: '财务费用比例', value: periodRates.finance, onChange: (v: number) => setPeriodRates({ ...periodRates, finance: v }) },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{f.label}</span>
                <div className="flex items-center gap-2">
                  <input type="number" className="input w-20 text-right" value={f.value} onChange={e => f.onChange(Number(e.target.value))} />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">📎 其他成本</h3>
          <div className="space-y-3">
            {[
              { label: '单位包装成本', value: other.pack, onChange: (v: number) => setOther({ ...other, pack: v }) },
              { label: '单位物流成本', value: other.logistics, onChange: (v: number) => setOther({ ...other, logistics: v }) },
              { label: '增值税率', value: other.vat, onChange: (v: number) => setOther({ ...other, vat: v }) },
              { label: '生产不良率', value: other.defect, onChange: (v: number) => setOther({ ...other, defect: v }) },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{f.label}</span>
                <div className="flex items-center gap-2">
                  <input type="number" className="input w-20 text-right" value={f.value} onChange={e => f.onChange(Number(e.target.value))} />
                  <span className="text-sm text-gray-500">{f.label.includes('率') ? '%' : '元'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">💰 盈利测算结果</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: '单位完全成本', value: `¥${totalCost.toFixed(2)}` },
            { label: '建议不含税报价', value: `¥${quoteNoVat.toFixed(2)}` },
            { label: '含税报价', value: `¥${quoteWithVat.toFixed(2)}` },
            { label: '单位毛利', value: `¥${(quoteNoVat - totalCost).toFixed(2)}` },
            { label: '毛利率', value: `${targetMargin.toFixed(2)}%` },
            { label: '总利润（按基准产量）', value: `¥${profit.toFixed(2)}` },
          ].map(r => (
            <div key={r.label} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">{r.label}</div>
              <div className="text-2xl font-bold text-blue-700">{r.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm">目标毛利率:</label>
          <input type="number" className="input w-24" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} />
          <span>%</span>
          <button className="btn-primary">🎯 智能优化报价</button>
          <button className="btn-secondary" onClick={saveToHistory} disabled={loading}>
            {loading ? '保存中...' : '💾 保存到历史库'}
          </button>
        </div>
      </div>
    </div>
  )
}
