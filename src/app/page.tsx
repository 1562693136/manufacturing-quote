'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, TrendingUp, Settings, FileText, Link2,
  Target, BarChart3, Layers, History, BookOpen, LogOut
} from 'lucide-react'

import QuotationModule from '@/components/QuotationModule'
import LadderModule from '@/components/LadderModule'
import EquipmentModule from '@/components/EquipmentModule'
import MoqModule from '@/components/MoqModule'
import ScenarioModule from '@/components/ScenarioModule'
import ReportModule from '@/components/ReportModule'
import ParametersModule from '@/components/ParametersModule'
import VersionsModule from '@/components/VersionsModule'
import BomModule from '@/components/BomModule'
import HistoryModule from '@/components/HistoryModule'
import SopModule from '@/components/SopModule'

const NAV_GROUPS = [
  {
    title: '核心功能',
    items: [
      { id: 'quotation', label: '产品报价测算', icon: LayoutDashboard },
      { id: 'ladder', label: '阶梯报价与利润', icon: TrendingUp },
      { id: 'equipment', label: '设备投资梯度', icon: Settings },
      { id: 'moq', label: '三量动态关联', icon: Link2 },
      { id: 'scenario', label: '多场景运营模拟', icon: Target },
      { id: 'report', label: '综合测算报告', icon: BarChart3 },
    ]
  },
  {
    title: '配置管理',
    items: [
      { id: 'parameters', label: '成本参数配置', icon: FileText },
      { id: 'versions', label: '版本与留痕', icon: FileText },
    ]
  },
  {
    title: '新增模块',
    items: [
      { id: 'bom', label: 'BOM层级管理', icon: Layers },
      { id: 'history', label: '报价历史查询', icon: History },
      { id: 'sop', label: 'SOP与权限', icon: BookOpen },
    ]
  },
]

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; role?: string } | null>(null)
  const [page, setPage] = useState('quotation')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
  }, [])

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data)
      })
    }
  }, [user])

  async function logout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const role = profile?.role || 'quoter'
  const canAccess = (pid: string) => {
    if (role === 'admin') return true
    if (pid === 'bom' && role === 'viewer') return false
    return true
  }

  const renderModule = () => {
    switch (page) {
      case 'quotation': return <QuotationModule />
      case 'ladder': return <LadderModule />
      case 'equipment': return <EquipmentModule />
      case 'moq': return <MoqModule />
      case 'scenario': return <ScenarioModule />
      case 'report': return <ReportModule />
      case 'parameters': return <ParametersModule />
      case 'versions': return <VersionsModule />
      case 'bom': return <BomModule />
      case 'history': return <HistoryModule />
      case 'sop': return <SopModule />
      default: return <QuotationModule />
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h1 className="font-bold text-lg text-gray-800">🦞 报价系统</h1>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-100">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{group.title}</div>
              )}
              {group.items.map(item => {
                if (!canAccess(item.id)) return null
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    className={`nav-item mx-2 ${page === item.id ? 'active' : ''}`}
                    onClick={() => setPage(item.id)}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-800">{profile?.full_name || user?.email}</div>
              <div className="text-xs text-gray-500">角色: {role === 'admin' ? '管理员' : role === 'quoter' ? '报价员' : '查看者'}</div>
            </div>
          )}
          <button onClick={logout} className="btn-secondary w-full text-sm">
            <LogOut size={16} />
            {!collapsed && <span className="ml-2">退出</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {NAV_GROUPS.flatMap(g => g.items).find(i => i.id === page)?.label}
          </h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('zh-CN')} | 当前用户: {profile?.full_name || user?.email}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  )
}
