'use client'

import { useState } from 'react'

interface Scenario {
  id: string
  name: string
  volume: number
  price: number
  cost: number
}

export default function ScenarioModule() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: '1', name: '乐观场景', volume: 80000, price: 45, cost: 38 },
    { id: '2', name: '基准场景', volume: 50000, price: 48.5, cost: 38.5 },
    { id: '3', name: '悲观场景', volume: 20000, price: 55, cost: 39 },
  ])

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🎯 多场景运营模拟</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setScenarios([...scenarios, { id: Date.now().toString(), name: '新场景', volume: 10000, price: 50, cost: 38 }])}>+ 添加场景</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>场景名称</th><th>预计产量</th><th>报价</th><th>成本</th><th>毛利</th><th>总利润</th><th>操作</th></tr></thead>
          <tbody>
            {scenarios.map((s, i) => {
              const profit = (s.price - s.cost) * s.volume
              return (
                <tr key={s.id} className="border-b">
                  <td className="py-1"><input className="input w-28 text-sm py-1" value={s.name} onChange={e => { const n = [...scenarios]; n[i].name = e.target.value; setScenarios(n) }} /></td>
                  <td><input type="number" className="input w-24 text-sm py-1" value={s.volume} onChange={e => { const n = [...scenarios]; n[i].volume = Number(e.target.value); setScenarios(n) }} /></td>
                  <td><input type="number" className="input w-20 text-sm py-1" value={s.price} onChange={e => { const n = [...scenarios]; n[i].price = Number(e.target.value); setScenarios(n) }} /></td>
                  <td><input type="number" className="input w-20 text-sm py-1" value={s.cost} onChange={e => { const n = [...scenarios]; n[i].cost = Number(e.target.value); setScenarios(n) }} /></td>
                  <td>¥{(s.price - s.cost).toFixed(2)}</td>
                  <td className="font-bold text-blue-700">¥{profit.toLocaleString()}</td>
                  <td><button className="text-red-500 text-sm" onClick={() => setScenarios(scenarios.filter((_, idx) => idx !== i))}>删除</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
