'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SemiProduct {
  id: string
  code: string
  name: string
  spec: string
  type: string
  processFee: number
}

interface RawMaterial {
  id: string
  code: string
  name: string
  spec: string
  unit: string
  price: number
  supplier: string
}

interface BomRelation {
  id: string
  semiCode: string
  rawCode: string
  qty: number
  lossRate: number
}

export default function BomModule() {
  const [tab, setTab] = useState('semi')
  const [semiProducts, setSemiProducts] = useState<SemiProduct[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [bomRelations, setBomRelations] = useState<BomRelation[]>([])
  const [calcSemi, setCalcSemi] = useState('')
  const [calcQty, setCalcQty] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        loadData(data.user.id)
      }
    })
  }, [])

  async function loadData(uid: string) {
    setLoading(true)
    const { data: semiData } = await supabase.from('bom_items').select('*').eq('user_id', uid).eq('type', 'semi')
    const { data: rawData } = await supabase.from('bom_items').select('*').eq('user_id', uid).eq('type', 'raw')
    const { data: relData } = await supabase.from('bom_relations').select('*').eq('user_id', uid)
    
    if (semiData && semiData.length > 0) {
      setSemiProducts(semiData.map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        spec: s.spec || '',
        type: s.source_type === 'purchase' ? '外购' : '自制',
        processFee: s.process_fee || 0
      })))
    } else {
      setSemiProducts([
        { id: '1', code: 'SF-001', name: '主控板', spec: 'PCB-100', type: '外购', processFee: 0 },
        { id: '2', code: 'SF-002', name: '外壳组件', spec: 'SHELL-A', type: '自制', processFee: 3.5 }
      ])
    }
    
    if (rawData && rawData.length > 0) {
      setRawMaterials(rawData.map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        spec: r.spec || '',
        unit: '个',
        price: r.unit_price || 0,
        supplier: ''
      })))
    } else {
      setRawMaterials([
        { id: '1', code: 'RM-001', name: 'PCB基板', spec: 'FR4-10cm', unit: '片', price: 8.0, supplier: '华通电子' },
        { id: '2', code: 'RM-002', name: '贴片电容', spec: '0805-10uF', unit: '个', price: 0.15, supplier: '村田' },
        { id: '3', code: 'RM-003', name: 'ABS原料', spec: 'ABS-757', unit: 'kg', price: 12.0, supplier: '奇美实业' },
      ])
    }
    
    if (relData && relData.length > 0) {
      setBomRelations(relData.map((r: any) => ({
        id: r.id,
        semiCode: r.parent_code,
        rawCode: r.child_code,
        qty: r.qty,
        lossRate: 0
      })))
    } else {
      setBomRelations([
        { id: '1', semiCode: 'SF-001', rawCode: 'RM-001', qty: 1, lossRate: 2 },
        { id: '2', semiCode: 'SF-001', rawCode: 'RM-002', qty: 12, lossRate: 1 },
      ])
    }
    setLoading(false)
  }

  async function saveBomItem(item: SemiProduct | RawMaterial, type: 'semi' | 'raw') {
    if (!userId) return
    const isSemi = type === 'semi'
    const payload = {
      user_id: userId,
      code: item.code,
      name: item.name,
      spec: item.spec,
      type: type,
      source_type: isSemi ? (item as SemiProduct).type === '外购' ? 'purchase' : 'selfmade' : 'purchase',
      unit_price: isSemi ? 0 : (item as RawMaterial).price,
      process_fee: isSemi ? (item as SemiProduct).processFee : null,
      loss_rate: 0
    }
    const { error } = await supabase.from('bom_items').upsert(payload, { onConflict: 'user_id,code' })
    if (error) console.error('保存BOM项失败:', error)
  }

  async function deleteBomItem(code: string) {
    if (!userId) return
    await supabase.from('bom_items').delete().eq('user_id', userId).eq('code', code)
  }

  function calcBomCost() {
    const relations = bomRelations.filter(r => r.semiCode === calcSemi)
    let total = 0
    const detail = relations.map(r => {
      const raw = rawMaterials.find(m => m.code === r.rawCode)
      if (!raw) return null
      const cost = r.qty * raw.price * (1 + r.lossRate / 100)
      total += cost
      return { name: raw.name, qty: r.qty, price: raw.price, loss: r.lossRate, cost }
    }).filter(Boolean)
    const semi = semiProducts.find(s => s.code === calcSemi)
    const processFee = semi?.processFee || 0
    total += processFee
    return { detail, total: total * calcQty, processFee }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🧩 BOM层级管理</h3>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const newItem = { id: Date.now().toString(), code: '', name: '', spec: '', type: '外购', processFee: 0 }
              setSemiProducts([...semiProducts, newItem])
              saveBomItem(newItem, 'semi')
            }}>+ 新增半成品</button>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const newItem = { id: Date.now().toString(), code: '', name: '', spec: '', unit: '个', price: 0, supplier: '' }
              setRawMaterials([...rawMaterials, newItem])
              saveBomItem(newItem, 'raw')
            }}>+ 新增原材料</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setBomRelations([...bomRelations, { id: Date.now().toString(), semiCode: '', rawCode: '', qty: 1, lossRate: 0 }])}>+ 添加BOM关系</button>
          </div>
        </div>

        <div className="flex border-b mb-4">
          {[{ id: 'semi', label: '半成品清单' }, { id: 'raw', label: '原材料库' }, { id: 'relation', label: 'BOM关系' }].map(t => (
            <button key={t.id} className={`px-4 py-2 ${tab === t.id ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'semi' && (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th>编码</th><th>名称</th><th>规格</th><th>类型</th><th>加工费</th><th>操作</th></tr></thead>
            <tbody>
              {semiProducts.map((s, i) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1"><input className="input w-24 text-sm py-1" value={s.code} onChange={e => { const n = [...semiProducts]; n[i].code = e.target.value; setSemiProducts(n); saveBomItem(n[i], 'semi') }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={s.name} onChange={e => { const n = [...semiProducts]; n[i].name = e.target.value; setSemiProducts(n); saveBomItem(n[i], 'semi') }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={s.spec} onChange={e => { const n = [...semiProducts]; n[i].spec = e.target.value; setSemiProducts(n); saveBomItem(n[i], 'semi') }} /></td>
                  <td><select className="input text-sm py-1" value={s.type} onChange={e => { const n = [...semiProducts]; n[i].type = e.target.value; setSemiProducts(n); saveBomItem(n[i], 'semi') }}><option>外购</option><option>自制</option></select></td>
                  <td><input type="number" className="input w-20 text-sm py-1" value={s.processFee} onChange={e => { const n = [...semiProducts]; n[i].processFee = Number(e.target.value); setSemiProducts(n); saveBomItem(n[i], 'semi') }} /></td>
                  <td><button className="text-red-500 text-sm" onClick={() => { deleteBomItem(s.code); setSemiProducts(semiProducts.filter((_, idx) => idx !== i)) }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'raw' && (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th>编码</th><th>名称</th><th>规格</th><th>单位</th><th>单价</th><th>供应商</th><th>操作</th></tr></thead>
            <tbody>
              {rawMaterials.map((m, i) => (
                <tr key={m.id} className="border-b">
                  <td className="py-1"><input className="input w-24 text-sm py-1" value={m.code} onChange={e => { const n = [...rawMaterials]; n[i].code = e.target.value; setRawMaterials(n); saveBomItem(n[i], 'raw') }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={m.name} onChange={e => { const n = [...rawMaterials]; n[i].name = e.target.value; setRawMaterials(n); saveBomItem(n[i], 'raw') }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={m.spec} onChange={e => { const n = [...rawMaterials]; n[i].spec = e.target.value; setRawMaterials(n); saveBomItem(n[i], 'raw') }} /></td>
                  <td><input className="input w-16 text-sm py-1" value={m.unit} onChange={e => { const n = [...rawMaterials]; n[i].unit = e.target.value; setRawMaterials(n) }} /></td>
                  <td><input type="number" className="input w-20 text-sm py-1" value={m.price} onChange={e => { const n = [...rawMaterials]; n[i].price = Number(e.target.value); setRawMaterials(n); saveBomItem(n[i], 'raw') }} /></td>
                  <td><input className="input w-24 text-sm py-1" value={m.supplier} onChange={e => { const n = [...rawMaterials]; n[i].supplier = e.target.value; setRawMaterials(n) }} /></td>
                  <td><button className="text-red-500 text-sm" onClick={() => { deleteBomItem(m.code); setRawMaterials(rawMaterials.filter((_, idx) => idx !== i)) }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'relation' && (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th>半成品</th><th>原材料</th><th>用量</th><th>损耗率%</th><th>操作</th></tr></thead>
            <tbody>
              {bomRelations.map((r, i) => (
                <tr key={r.id} className="border-b">
                  <td className="py-1"><select className="input text-sm py-1" value={r.semiCode} onChange={e => { const n = [...bomRelations]; n[i].semiCode = e.target.value; setBomRelations(n) }}>
                    <option value="">请选择</option>{semiProducts.map(s => <option key={s.code} value={s.code}>{s.code} {s.name}</option>)}
                  </select></td>
                  <td><select className="input text-sm py-1" value={r.rawCode} onChange={e => { const n = [...bomRelations]; n[i].rawCode = e.target.value; setBomRelations(n) }}>
                    <option value="">请选择</option>{rawMaterials.map(m => <option key={m.code} value={m.code}>{m.code} {m.name}</option>)}
                  </select></td>
                  <td><input type="number" className="input w-16 text-sm py-1" value={r.qty} onChange={e => { const n = [...bomRelations]; n[i].qty = Number(e.target.value); setBomRelations(n) }} /></td>
                  <td><input type="number" className="input w-16 text-sm py-1" value={r.lossRate} onChange={e => { const n = [...bomRelations]; n[i].lossRate = Number(e.target.value); setBomRelations(n) }} /></td>
                  <td><button className="text-red-500 text-sm" onClick={() => setBomRelations(bomRelations.filter((_, idx) => idx !== i))}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* BOM Cost Calculator */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 BOM成本展开计算</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">选择半成品</label>
            <select className="input" value={calcSemi} onChange={e => setCalcSemi(e.target.value)}>
              <option value="">请选择</option>
              {semiProducts.map(s => <option key={s.code} value={s.code}>{s.code} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">计算产量</label>
            <input type="number" className="input" value={calcQty} onChange={e => setCalcQty(Number(e.target.value))} />
          </div>
        </div>
        {(() => {
          const result = calcBomCost()
          if (!result || result.detail.length === 0) return <p className="text-gray-500">请先配置BOM关系</p>
          return (
            <div className="space-y-2">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th>原材料</th><th>用量</th><th>单价</th><th>损耗</th><th>成本</th></tr></thead>
                <tbody>
                  {result.detail.map((d: any, i) => (
                    <tr key={i} className="border-b"><td>{d.name}</td><td>{d.qty}</td><td>¥{d.price}</td><td>{d.loss}%</td><td>¥{(d.cost * calcQty).toFixed(2)}</td></tr>
                  ))}
                  <tr className="border-b font-semibold"><td colSpan={4}>加工费</td><td>¥{(result.processFee * calcQty).toFixed(2)}</td></tr>
                  <tr className="border-b font-bold text-blue-700"><td colSpan={4}>总成本</td><td>¥{result.total.toFixed(2)}</td></tr>
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
