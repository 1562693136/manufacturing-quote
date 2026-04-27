'use client'

import { useState } from 'react'

interface Equipment {
  id: string
  name: string
  code: string
  investment: number
  lifeYears: number
  annualCapacity: number
  hourlyRate: number
}

export default function EquipmentModule() {
  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: '1', name: 'SMT贴片机', code: 'EQ-001', investment: 500000, lifeYears: 10, annualCapacity: 2000000, hourlyRate: 120 },
    { id: '2', name: '波峰焊', code: 'EQ-002', investment: 200000, lifeYears: 8, annualCapacity: 1500000, hourlyRate: 80 },
  ])
  const [orderQty, setOrderQty] = useState(50000)

  const totalInvestment = equipment.reduce((sum, e) => sum + e.investment, 0)
  const totalHourlyRate = equipment.reduce((sum, e) => sum + e.hourlyRate, 0)
  const totalAnnualCapacity = equipment.reduce((sum, e) => sum + e.annualCapacity, 0)
  const capacityRate = (orderQty / totalAnnualCapacity * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🏭 设备投资梯度</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setEquipment([...equipment, { id: Date.now().toString(), name: '', code: '', investment: 0, lifeYears: 10, annualCapacity: 0, hourlyRate: 0 }])}>+ 添加设备</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>设备名称</th><th>编码</th><th>投资额</th><th>折旧年限</th><th>年产能</th><th>小时工价</th><th>操作</th></tr></thead>
          <tbody>
            {equipment.map((e, i) => (
              <tr key={e.id} className="border-b">
                <td className="py-1"><input className="input w-28 text-sm py-1" value={e.name} onChange={ev => { const n = [...equipment]; n[i].name = ev.target.value; setEquipment(n) }} /></td>
                <td><input className="input w-20 text-sm py-1" value={e.code} onChange={ev => { const n = [...equipment]; n[i].code = ev.target.value; setEquipment(n) }} /></td>
                <td><input type="number" className="input w-24 text-sm py-1" value={e.investment} onChange={ev => { const n = [...equipment]; n[i].investment = Number(ev.target.value); setEquipment(n) }} /></td>
                <td><input type="number" className="input w-16 text-sm py-1" value={e.lifeYears} onChange={ev => { const n = [...equipment]; n[i].lifeYears = Number(ev.target.value); setEquipment(n) }} /></td>
                <td><input type="number" className="input w-24 text-sm py-1" value={e.annualCapacity} onChange={ev => { const n = [...equipment]; n[i].annualCapacity = Number(ev.target.value); setEquipment(n) }} /></td>
                <td><input type="number" className="input w-20 text-sm py-1" value={e.hourlyRate} onChange={ev => { const n = [...equipment]; n[i].hourlyRate = Number(ev.target.value); setEquipment(n) }} /></td>
                <td><button className="text-red-500 text-sm" onClick={() => setEquipment(equipment.filter((_, idx) => idx !== i))}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📊 设备成本分摊</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">设备总投资</div><div className="text-xl font-bold">¥{totalInvestment.toLocaleString()}</div></div>
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">年折旧总额</div><div className="text-xl font-bold">¥{Math.round(totalInvestment / 10).toLocaleString()}</div></div>
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">总小时工价</div><div className="text-xl font-bold">¥{totalHourlyRate}/h</div></div>
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">年总产能</div><div className="text-xl font-bold">{totalAnnualCapacity.toLocaleString()}件</div></div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">输入年度订单量:</label>
          <input type="number" className="input w-32" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))} />
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">产能利用率</div>
          <div className="text-2xl font-bold text-blue-700">{capacityRate}%</div>
        </div>
      </div>
    </div>
  )
}
