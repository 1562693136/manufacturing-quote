'use client'

import { useState } from 'react'

interface LadderItem {
  minQty: number
  maxQty: number
  coeff: number
  price: number
}

export default function LadderModule() {
  const [basePrice, setBasePrice] = useState(48.5)
  const [baseCost, setBaseCost] = useState(38.5)
  const [ladders, setLadders] = useState<LadderItem[]>([
    { minQty: 1, maxQty: 999, coeff: 1.0, price: 48.5 },
    { minQty: 1000, maxQty: 4999, coeff: 0.95, price: 46.08 },
    { minQty: 5000, maxQty: 9999, coeff: 0.90, price: 43.65 },
    { minQty: 10000, maxQty: 49999, coeff: 0.85, price: 41.23 },
    { minQty: 50000, maxQty: 999999, coeff: 0.80, price: 38.80 },
  ])
  const [testQty, setTestQty] = useState(5000)

  const findLadder = (qty: number) => ladders.find(l => qty >= l.minQty && qty <= l.maxQty) || ladders[ladders.length - 1]
  const matched = findLadder(testQty)
  const unitProfit = matched.price - baseCost
  const totalProfit = unitProfit * testQty

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📶 阶梯报价系数设置</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">基准报价</label>
            <input type="number" className="input" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">单位成本</label>
            <input type="number" className="input" value={baseCost} onChange={e => setBaseCost(Number(e.target.value))} />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>产量下限</th><th>产量上限</th><th>折扣系数</th><th>报价</th><th>操作</th></tr></thead>
          <tbody>
            {ladders.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-1"><input type="number" className="input w-24 text-sm py-1" value={l.minQty} onChange={e => { const n = [...ladders]; n[i].minQty = Number(e.target.value); setLadders(n) }} /></td>
                <td><input type="number" className="input w-24 text-sm py-1" value={l.maxQty} onChange={e => { const n = [...ladders]; n[i].maxQty = Number(e.target.value); setLadders(n) }} /></td>
                <td><input type="number" className="input w-20 text-sm py-1" value={l.coeff} step={0.01} onChange={e => { const n = [...ladders]; n[i].coeff = Number(e.target.value); n[i].price = basePrice * n[i].coeff; setLadders(n) }} /></td>
                <td>¥{l.price.toFixed(2)}</td>
                <td><button className="text-red-500 text-sm" onClick={() => setLadders(ladders.filter((_, idx) => idx !== i))}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-secondary btn-sm mt-3" onClick={() => setLadders([...ladders, { minQty: 0, maxQty: 0, coeff: 1, price: basePrice }])}>+ 添加阶梯</button>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 阶梯报价模拟</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">输入订单量:</label>
          <input type="number" className="input w-32" value={testQty} onChange={e => setTestQty(Number(e.target.value))} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">匹配阶梯</div>
            <div className="text-lg font-bold">{matched.minQty}-{matched.maxQty === 999999 ? '∞' : matched.maxQty}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">适用单价</div>
            <div className="text-lg font-bold">¥{matched.price.toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">总利润</div>
            <div className="text-lg font-bold">¥{totalProfit.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
