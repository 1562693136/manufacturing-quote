'use client'

import { useState } from 'react'

interface MoqItem {
  id: string
  code: string
  name: string
  moq: number
  batchMultiple: number
  price: number
}

export default function MoqModule() {
  const [moqs, setMoqs] = useState<MoqItem[]>([
    { id: '1', code: 'RM-001', name: 'PCB基板', moq: 1000, batchMultiple: 500, price: 8 },
    { id: '2', code: 'RM-002', name: '贴片电容', moq: 5000, batchMultiple: 1000, price: 0.15 },
    { id: '3', code: 'RM-003', name: 'ABS原料', moq: 500, batchMultiple: 100, price: 12 },
  ])
  const [orderQty, setOrderQty] = useState(3000)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📦 MOQ与批量倍数配置</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setMoqs([...moqs, { id: Date.now().toString(), code: '', name: '', moq: 0, batchMultiple: 1, price: 0 }])}>+ 添加物料</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>物料编码</th><th>物料名称</th><th>MOQ</th><th>批量倍数</th><th>单价</th><th>操作</th></tr></thead>
          <tbody>
            {moqs.map((m, i) => (
              <tr key={m.id} className="border-b">
                <td className="py-1"><input className="input w-24 text-sm py-1" value={m.code} onChange={e => { const n = [...moqs]; n[i].code = e.target.value; setMoqs(n) }} /></td>
                <td><input className="input w-24 text-sm py-1" value={m.name} onChange={e => { const n = [...moqs]; n[i].name = e.target.value; setMoqs(n) }} /></td>
                <td><input type="number" className="input w-20 text-sm py-1" value={m.moq} onChange={e => { const n = [...moqs]; n[i].moq = Number(e.target.value); setMoqs(n) }} /></td>
                <td><input type="number" className="input w-20 text-sm py-1" value={m.batchMultiple} onChange={e => { const n = [...moqs]; n[i].batchMultiple = Number(e.target.value); setMoqs(n) }} /></td>
                <td><input type="number" className="input w-20 text-sm py-1" value={m.price} onChange={e => { const n = [...moqs]; n[i].price = Number(e.target.value); setMoqs(n) }} /></td>
                <td><button className="text-red-500 text-sm" onClick={() => setMoqs(moqs.filter((_, idx) => idx !== i))}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 订单量-MOQ动态校验</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">输入订单量:</label>
          <input type="number" className="input w-32" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          {moqs.map(m => {
            const isSatisfied = orderQty >= m.moq
            const isBatchMatch = orderQty % m.batchMultiple === 0
            const suggested = Math.ceil(orderQty / m.batchMultiple) * m.batchMultiple
            const excessCost = Math.max(0, (isSatisfied ? (suggested - orderQty) : (m.moq - orderQty))) * m.price
            return (
              <div key={m.id} className={`p-3 rounded-lg ${isSatisfied && isBatchMatch ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.code} {m.name}</span>
                  <span className="text-sm">单价: ¥{m.price}</span>
                </div>
                <div className="text-sm mt-1">
                  MOQ {m.moq}: {isSatisfied ? '✅ 满足' : '❌ 不满足'} | 
                  批量倍数 {m.batchMultiple}: {isBatchMatch ? '✅ 匹配' : `ℹ️ 建议调整为 ${suggested}`}
                </div>
                {excessCost > 0 && <div className="text-sm text-orange-600 mt-1">预计多余库存成本: ¥{excessCost.toFixed(2)}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
