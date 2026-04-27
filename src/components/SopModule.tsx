'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Role {
  id: string
  name: string
  perm_quote_create: boolean
  perm_quote_edit: boolean
  perm_bom: boolean
  perm_settings: boolean
  perm_sop: boolean
  perm_user_manage: boolean
}

export default function SopModule() {
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: '管理员', perm_quote_create: true, perm_quote_edit: true, perm_bom: true, perm_settings: true, perm_sop: true, perm_user_manage: true },
    { id: '2', name: '报价员', perm_quote_create: true, perm_quote_edit: true, perm_bom: true, perm_settings: true, perm_sop: true, perm_user_manage: false },
    { id: '3', name: '查看者', perm_quote_create: false, perm_quote_edit: false, perm_bom: false, perm_settings: true, perm_sop: true, perm_user_manage: false },
  ])
  const [users, setUsers] = useState<any[]>([])
  const [sopTitle, setSopTitle] = useState('报价系统操作SOP')
  const [sopContent, setSopContent] = useState(`<h2>报价系统操作SOP</h2>
<p><b>1. 登录与权限</b></p>
<p>根据角色权限访问对应功能模块。管理员拥有全部权限，报价员可操作报价与BOM，查看者仅可浏览。</p>
<p><b>2. 新建报价</b></p>
<p>进入「产品报价测算」页面，填写产品基础信息。支持三种新建方式：全新空白报价、沿用之前报价修正、顺延V2版本报价。</p>
<p><b>3. BOM维护</b></p>
<p>在「BOM层级管理」中维护半成品-原材料关系。支持Excel导入、多级BOM展开、版本保存。</p>
<p><b>4. 阶梯报价</b></p>
<p>设置不同产量区间的报价系数。系统根据订单量自动匹配对应阶梯价格。</p>
<p><b>5. 版本留痕</b></p>
<p>每次报价调整后可保存版本。支持版本对比、历史复用。</p>
<p><b>6. 导出</b></p>
<p>支持导出PDF报价单、Excel数据、Markdown文本。</p>`)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
  }

  async function updateUserRole(userId: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) alert('更新失败: ' + error.message)
    else { alert('角色已更新'); loadUsers() }
  }

  return (
    <div className="space-y-6">
      {/* Role Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">👤 角色与权限管理</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>角色名称</th><th>报价创建</th><th>报价编辑</th><th>BOM管理</th><th>系统设置</th><th>SOP查看</th><th>用户管理</th></tr></thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2 font-medium">{r.name}</td>
                <td><input type="checkbox" checked={r.perm_quote_create} readOnly /></td>
                <td><input type="checkbox" checked={r.perm_quote_edit} readOnly /></td>
                <td><input type="checkbox" checked={r.perm_bom} readOnly /></td>
                <td><input type="checkbox" checked={r.perm_settings} readOnly /></td>
                <td><input type="checkbox" checked={r.perm_sop} readOnly /></td>
                <td><input type="checkbox" checked={r.perm_user_manage} readOnly /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">👥 用户管理</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th>邮箱</th><th>姓名</th><th>当前角色</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td>{u.full_name || '-'}</td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'quoter' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                <td className="text-gray-500">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                <td>
                  <select className="input text-sm py-1" value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}>
                    <option value="admin">管理员</option>
                    <option value="quoter">报价员</option>
                    <option value="viewer">查看者</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SOP Editor */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📖 SOP操作文档</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => { const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${sopTitle}</title></head><body>${sopContent}</body></html>`], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${sopTitle}.html`; a.click(); URL.revokeObjectURL(url) }}>📄 导出HTML</button>
        </div>
        <input className="input mb-4 font-semibold" value={sopTitle} onChange={e => setSopTitle(e.target.value)} />
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('bold')}>B</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('italic')}>I</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('insertUnorderedList')}>• 列表</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('insertOrderedList')}>1. 列表</button>
        </div>
        <div
          className="min-h-[300px] border rounded-lg p-4 bg-white"
          contentEditable
          dangerouslySetInnerHTML={{ __html: sopContent }}
          onBlur={e => setSopContent(e.currentTarget.innerHTML)}
        />
      </div>
    </div>
  )
}
