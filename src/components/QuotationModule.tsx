'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

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
  const [showCharts, setShowCharts] = useState(false)

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
      setProduct({ code: '', name: '', spec: '', customer: '', volume: 1000 })
      setMaterials([])
      setProcesses([])
      setVersion('V1.0')
    } else if (newQuoteMode === 'copy' && selectedTemplate) {
      const template = savedQuotes.find(q => q.id === selectedTemplate)
      if (template) {
        setProduct({ code: template.code, name: template.name, spec: template.spec, customer: template.customer, volume: template.volume })
        setMaterials(template.materials.length > 0 ? template.materials : [])
        setProcesses(template.processes.length > 0 ? template.processes : [])
        setVersion(template.version)
      }
    } else if (newQuoteMode === 'version' && selectedTemplate) {
      const template = savedQuotes.find(q => q.id === selectedTemplate)
      if (template) {
        setProduct({ code: template.code, name: template.name, spec: template.spec, customer: template.customer, volume: template.volume })
        setMaterials(template.materials.length > 0 ? template.materials : [])
        setProcesses(template.processes.length > 0 ? template.processes : [])
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

  function optimizeQuote() {
    const suggestions: string[] = []
    const materialRatio = materialCost / totalCost * 100
    if (materialRatio > 60) {
      suggestions.push(`材料成本占比${materialRatio.toFixed(1)}%偏高，建议：1)寻找替代材料 2)与供应商议价 3)优化BOM设计`)
    }
    const laborRatio = laborCost / totalCost * 100
    if (laborRatio > 25) {
      suggestions.push(`人工成本占比${laborRatio.toFixed(1)}%偏高，建议：1)优化工序 2)提升自动化水平`)
    }
    const mfgRatio = mfgCost / totalCost * 100
    if (mfgRatio > 20) {
      suggestions.push(`制造费用占比${mfgRatio.toFixed(1)}%偏高，建议：1)提高产能利用率 2)能耗管控`)
    }
    let suggestedMargin = targetMargin
    if (materialRatio > 50 && laborRatio > 20) {
      suggestedMargin = Math.min(30, targetMargin + 5)
      suggestions.push(`成本结构较复杂，建议毛利率提升至${suggestedMargin}%`)
    } else if (materialRatio < 40 && laborRatio < 15) {
      suggestedMargin = Math.max(15, targetMargin - 3)
      suggestions.push(`成本结构较优，可适度降低毛利率至${suggestedMargin}%以提升竞争力`)
    }
    if (suggestions.length === 0) {
      suggestions.push('当前成本结构合理，继续保持目标毛利率')
    }
    alert(`📊 智能优化分析\n\n${suggestions.join('\n\n')}`)
  }

  async function generatePDF() {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20
    doc.setFontSize(18)
    doc.text('制造报价单', pageWidth / 2, y, { align: 'center' })
    y += 10
    doc.setFontSize(10)
    doc.text(`报价单号: Q${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Date.now()).slice(-4)}`, 20, y)
    doc.text(`版本: ${version}`, pageWidth - 20, y, { align: 'right' })
    y += 8
    doc.text(`日期: ${new Date().toLocaleDateString('zh-CN')}`, 20, y)
    y += 12
    doc.setFontSize(12)
    doc.text('一、产品基础信息', 20, y)
    y += 8
    doc.setFontSize(10)
    const info = [
      `产品编码: ${product.code}`,
      `产品名称: ${product.name}`,
      `规格型号: ${product.spec}`,
      `客户名称: ${product.customer || '-'}`,
      `基准产量: ${product.volume}件`,
    ]
    info.forEach(line => { doc.text(line, 20, y); y += 6 })
    y += 4
    doc.setFontSize(12)
    doc.text('二、直接材料成本', 20, y)
    y += 8
    doc.setFontSize(9)
    doc.text('编码', 20, y); doc.text('名称', 50, y); doc.text('来源', 90, y)
    doc.text('单价', 120, y, { align: 'center' }); doc.text('单耗', 145, y, { align: 'center' })
    doc.text('损耗', 165, y, { align: 'center' }); doc.text('成本', 185, y, { align: 'center' })
    y += 6
    materials.forEach(m => {
      doc.text(m.code, 20, y); doc.text(m.name, 50, y); doc.text(m.source, 90, y)
      doc.text(`¥${m.unitPrice.toFixed(2)}`, 120, y, { align: 'center' })
      doc.text(`${m.qty}`, 145, y, { align: 'center' })
      doc.text(`${m.lossRate}%`, 165, y, { align: 'center' })
      const cost = m.unitPrice * m.qty * (1 + m.lossRate / 100)
      doc.text(`¥${cost.toFixed(2)}`, 185, y, { align: 'center' })
      y += 5
    })
    doc.setFontSize(10)
    doc.text(`材料成本合计: ¥${materialCost.toFixed(2)}`, 20, y)
    y += 10
    doc.setFontSize(12)
    doc.text('三、直接人工成本', 20, y)
    y += 8
    doc.setFontSize(9)
    doc.text('工序', 20, y); doc.text('工时(分)', 80, y, { align: 'center' })
    doc.text('工价', 110, y, { align: 'center' }); doc.text('成本', 140, y, { align: 'center' })
    y += 6
    processes.forEach(p => {
      doc.text(`${p.code} ${p.name}`, 20, y)
      doc.text(`${p.minutes}`, 80, y, { align: 'center' })
      doc.text(`¥${p.hourlyRate}/h`, 110, y, { align: 'center' })
      const cost = (p.minutes / 60) * p.hourlyRate
      doc.text(`¥${cost.toFixed(2)}`, 140, y, { align: 'center' })
      y += 5
    })
    doc.setFontSize(10)
    doc.text(`人工成本合计: ¥${laborCost.toFixed(2)}`, 20, y)
    y += 10
    doc.setFontSize(12)
    doc.text('四、制造费用', 20, y)
    y += 8
    doc.setFontSize(10)
    doc.text(`水电能耗: ¥${mfgRates.energy.toFixed(2)}`, 20, y); y += 6
    doc.text(`车间管理: ¥${mfgRates.manage.toFixed(2)}`, 20, y); y += 6
    doc.text(`辅料消耗: ¥${mfgRates.material.toFixed(2)}`, 20, y); y += 6
    doc.text(`设备成本: ¥${mfgRates.equip.toFixed(2)}`, 20, y); y += 6
    doc.text(`制造费用合计: ¥${mfgCost.toFixed(2)}`, 20, y)
    y += 10
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 102)
    doc.text('五、报价结果', 20, y)
    y += 10
    doc.setFontSize(11)
    doc.text(`单位完全成本: ¥${totalCost.toFixed(2)}`, 20, y); y += 7
    doc.text(`建议不含税报价: ¥${quoteNoVat.toFixed(2)}`, 20, y); y += 7
    doc.text(`含税报价: ¥${quoteWithVat.toFixed(2)}`, 20, y); y += 7
    doc.text(`单位毛利: ¥${(quoteNoVat - totalCost).toFixed(2)}`, 20, y); y += 7
    doc.text(`毛利率: ${targetMargin.toFixed(2)}%`, 20, y); y += 7
    doc.text(`总利润: ¥${profit.toFixed(2)}`, 20, y)
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('本报价单由制造报价测算系统生成', pageWidth / 2, 280, { align: 'center' })
    doc.save(`报价单_${product.code}_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new()
    const infoWs = XLSX.utils.aoa_to_sheet([
      ['产品编码', product.code],
      ['产品名称', product.name],
      ['规格型号', product.spec],
      ['客户名称', product.customer || '-'],
      ['基准产量', product.volume],
      ['版本号', version],
    ])
    XLSX.utils.book_append_sheet(wb, infoWs, '产品信息')
    const matWs = XLSX.utils.aoa_to_sheet([
      ['编码', '名称', '来源', '单价', '单耗', '损耗率%', '成本'],
      ...materials.map(m => [
        m.code, m.name, m.source, m.unitPrice, m.qty, m.lossRate,
        m.unitPrice * m.qty * (1 + m.lossRate / 100)
      ])
    ])
    XLSX.utils.book_append_sheet(wb, matWs, '直接材料')
    const procWs = XLSX.utils.aoa_to_sheet([
      ['工序编码', '工序名称', '工时(分)', '工价', '成本'],
      ...processes.map(p => [
        p.code, p.name, p.minutes, p.hourlyRate, (p.minutes / 60 * p.hourlyRate).toFixed(2)
      ])
    ])
    XLSX.utils.book_append_sheet(wb, procWs, '直接人工')
    const resultWs = XLSX.utils.aoa_to_sheet([
      ['项目', '金额'],
      ['直接材料成本', materialCost],
      ['直接人工成本', laborCost],
      ['制造费用', mfgCost],
      ['单位完全成本', totalCost],
      ['建议不含税报价', quoteNoVat],
      ['含税报价', quoteWithVat],
      ['单位毛利', quoteNoVat - totalCost],
      ['毛利率%', targetMargin],
      ['总利润', profit],
    ])
    XLSX.utils.book_append_sheet(wb, resultWs, '报价结果')
    XLSX.writeFile(wb, `报价数据_${product.code}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  function importFromExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result
      if (!data) return
      const wb = XLSX.read(data, { type: 'binary' })
      const matWs = wb.Sheets['直接材料']
      if (matWs) {
        const matData = XLSX.utils.sheet_to_json<any[]>(matWs, { header: 1 })
        const newMaterials: MaterialItem[] = []
        for (let i = 1; i < matData.length; i++) {
          const row = matData[i]
          if (row[0]) {
            newMaterials.push({
              id: Date.now().toString() + i,
              code: row[0] || '',
              name: row[1] || '',
              source: row[2] || '外购',
              unitPrice: Number(row[3]) || 0,
              qty: Number(row[4]) || 1,
              lossRate: Number(row[5]) || 0,
            })
          }
        }
        if (newMaterials.length > 0) setMaterials(newMaterials)
      }
      const procWs = wb.Sheets['直接人工']
      if (procWs) {
        const procData = XLSX.utils.sheet_to_json<any[]>(procWs, { header: 1 })
        const newProcesses: ProcessItem[] = []
        for (let i = 1; i < procData.length; i++) {
          const row = procData[i]
          if (row[0]) {
            newProcesses.push({
              id: Date.now().toString() + i,
              code: row[0] || '',
              name: row[1] || '',
              minutes: Number(row[2]) || 0,
              hourlyRate: Number(row[3]) || 0,
            })
          }
        }
        if (newProcesses.length > 0) setProcesses(newProcesses)
      }
      alert('Excel数据导入成功')
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
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

  const pieData = {
    labels: ['直接材料', '直接人工', '制造费用'],
    datasets: [{
      data: [materialCost, laborCost, mfgCost],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderWidth: 1,
    }]
  }

  const barData = {
    labels: materials.map(m => m.name),
    datasets: [{
      label: '材料成本',
      data: materials.map(m => m.unitPrice * m.qty * (1 + m.lossRate / 100)),
      backgroundColor: '#3b82f6',
    }]
  }

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
                <div><div className="font-medium">全新空白报价</div><div className="text-sm text-gray-500">从零开始创建新报价单</div></div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="newMode" value="copy" checked={newQuoteMode === 'copy'} onChange={() => setNewQuoteMode('copy')} />
                <div><div className="font-medium">沿用之前报价修正</div><div className="text-sm text-gray-500">复制已有报价数据并编辑修改</div></div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="newMode" value="version" checked={newQuoteMode === 'version'} onChange={() => setNewQuoteMode('version')} />
                <div><div className="font-medium">顺延V2报价</div><div className="text-sm text-gray-500">基于已有报价创建新版本（版本号自动递增）</div></div>
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
          <button className="btn btn-secondary btn-sm" onClick={exportToExcel}>📥 导出Excel</button>
          <label className="btn btn-secondary btn-sm cursor-pointer">
            📤 导入Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importFromExcel} />
          </label>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? '隐藏图表' : '📊 成本分析图表'}
          </button>
          <button className="btn btn-primary" onClick={createNewQuote}>➕ 新建报价</button>
          <button className="btn btn-secondary" onClick={saveToHistory} disabled={loading}>
            {loading ? '保存中...' : '💾 保存到历史库'}
          </button>
        </div>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">成本结构分布</h3>
            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">材料成本明细</h3>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      )}

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
          <button className="btn-primary" onClick={generatePDF}>📄 导出PDF报价单</button>
          <button className="btn-primary" onClick={optimizeQuote}>🎯 智能优化报价</button>
          <button className="btn-secondary" onClick={saveToHistory} disabled={loading}>
            {loading ? '保存中...' : '💾 保存到历史库'}
          </button>
        </div>
      </div>
    </div>
  )
}
