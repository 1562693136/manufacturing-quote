'use client'

import { useState } from 'react'

interface Version {
  id: string
  version: string
  operator: string
  createTime: string
  changes: string
}

export default function VersionsModule() {
  const [versions, setVersions] = useState<Version[]>([
    { id: '1', version: 'V1.0', operator: '系统', createTime: '2026-04-25', changes: '初始版本' },
    { id: '2', version: 'V1.1', operator: '张三', createTime: '2026-04-26', changes: '调整材料单价' },
  ])
  const [newVersion, setNewVersion] = useState('')
  const [newChanges, setNewChanges] = useState('')

  function addVersion() {
    if (!newVersion || !newChanges) return
    setVersions([...versions, {
      id: Date.now().toString(),
      version: newVersion,
      operator: '当前用户',
      createTime: new Date().toISOString().slice(0, 10),
      changes: newChanges,
    }])
    setNewVersion('')
    setNewChanges('')
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📋 版本管理与留痕</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>版本号</th><th>操作人</th><th>创建时间</th><th>变更说明</th><th>操作</th></tr></thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id} className="border-b">
                <td className="py-2 font-mono">{v.version}</td>
                <td>{v.operator}</td>
                <td className="text-gray-500">{v.createTime}</td>
                <td>{v.changes}</td>
                <td><button className="text-blue-600 text-sm">查看</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">➕ 新增版本</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">版本号</label>
            <input className="input" value={newVersion} onChange={e => setNewVersion(e.target.value)} placeholder="V1.2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">变更说明</label>
            <input className="input" value={newChanges} onChange={e => setNewChanges(e.target.value)} placeholder="简要描述变更内容" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={addVersion}>保存版本</button>
      </div>
    </div>
  )
}
