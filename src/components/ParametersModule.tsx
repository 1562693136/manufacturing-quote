'use client'

import { useState } from 'react'

interface ParamItem {
  id: string
  name: string
  value: number
  unit: string
  desc: string
}

export default function ParametersModule() {
  const [materials, setMaterials] = useState<ParamItem[]>([
    { id: '1', name: '主控板', value: 15.5, unit: '元/片', desc: '外购' },
    { id: '2', name: '外壳组件', value: 0, unit: '元/件', desc: '自制' },
  ])
  const [processes, setProcesses] = useState<ParamItem[]>([
    { id: '1', name: 'SMT贴片', value: 5, unit: '分钟/件', desc: '标准工时' },
    { id: '2', name: '插件焊接', value: 8, unit: '分钟/件', desc: '标准工时' },
  ])
  const [equipment, setEquipment] = useState<ParamItem[]>([
    { id: '1', name: 'SMT贴片机', value: 500000, unit: '元', desc: '投资额' },
  ])
  const [moq, setMoq] = useState<ParamItem[]>([
    { id: '1', name: 'PCB基板', value: 1000, unit: '件', desc: 'MOQ' },
  ])
  const [publicParams, setPublicParams] = useState<ParamItem[]>([
    { id: '1', name: '增值税率', value: 13, unit: '%', desc: '税务' },
    { id: '2', name: '水电费率', value: 2.5, unit: '元/件', desc: '制造费用' },
  ])

  const [tab, setTab] = useState('material')

  const tabs = [
    { id: 'material', label: 'BOM物料', data: materials, setData: setMaterials },
    { id: 'process', label: '生产工序', data: processes, setData: setProcesses },
    { id: 'equipment', label: '设备', data: equipment, setData: setEquipment },
    { id: 'moq', label: 'MOQ', data: moq, setData: setMoq },
    { id: 'public', label: '公共参数', data: publicParams, setData: setPublicParams },
  ]

  const currentTab = tabs.find(t => t.id === tab) || tabs[0]

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ 成本参数配置</h3>
        <div className="flex border-b mb-4">
          {tabs.map(t => (
            <button key={t.id} className={`px-4 py-2 ${tab === t.id ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>名称</th><th>参数值</th><th>单位</th><th>说明</th><th>操作</th></tr></thead>
          <tbody>
            {currentTab.data.map((item, i) => (
              <tr key={item.id} className="border-b">
                <td className="py-1"><input className="input w-32 text-sm py-1" value={item.name} onChange={e => { const n = [...currentTab.data]; n[i].name = e.target.value; currentTab.setData(n) }} /></td>
                <td><input type="number" className="input w-24 text-sm py-1" value={item.value} onChange={e => { const n = [...currentTab.data]; n[i].value = Number(e.target.value); currentTab.setData(n) }} /></td>
                <td><input className="input w-20 text-sm py-1" value={item.unit} onChange={e => { const n = [...currentTab.data]; n[i].unit = e.target.value; currentTab.setData(n) }} /></td>
                <td><input className="input w-32 text-sm py-1" value={item.desc} onChange={e => { const n = [...currentTab.data]; n[i].desc = e.target.value; currentTab.setData(n) }} /></td>
                <td><button className="text-red-500 text-sm" onClick={() => currentTab.setData(currentTab.data.filter((_, idx) => idx !== i))}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-secondary btn-sm mt-3" onClick={() => currentTab.setData([...currentTab.data, { id: Date.now().toString(), name: '', value: 0, unit: '', desc: '' }])}>+ 添加参数</button>
      </div>
    </div>
  )
}
