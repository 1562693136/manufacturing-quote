'use client'

import { useState } from 'react'

export default function ReportModule() {
  const [reportTitle, setReportTitle] = useState('报价测算综合报告')
  const [reportContent, setReportContent] = useState(`
<h2>报价测算综合报告</h2>
<p><b>1. 产品概述</b></p>
<p>产品名称: 智能控制器A型 | 产品编码: P-2024-001</p>
<p>客户: 客户A | 基准产量: 5000件</p>
<p><b>2. 成本构成</b></p>
<p>直接材料成本: ¥20.80 | 直接人工成本: ¥11.90 | 制造费用: ¥5.80</p>
<p>期间费用: ¥0.00 | 单位完全成本: ¥38.50</p>
<p><b>3. 报价结果</b></p>
<p>建议不含税报价: ¥48.13 | 含税报价: ¥54.39</p>
<p>单位毛利: ¥9.63 | 毛利率: 20.00%</p>
<p>总利润: ¥48,125.00</p>
<p><b>4. 结论与建议</b></p>
<p>报价具有竞争力，建议按阶梯报价策略执行。</p>
`)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📑 综合测算报告</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => { const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${reportTitle}</title></head><body>${reportContent}</body></html>`], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${reportTitle}.html`; a.click(); URL.revokeObjectURL(url) }}>📄 导出HTML</button>
        </div>
        <input className="input mb-4 font-semibold" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('bold')}>B</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.execCommand('italic')}>I</button>
        </div>
        <div className="min-h-[400px] border rounded-lg p-4 bg-white" contentEditable dangerouslySetInnerHTML={{ __html: reportContent }} onBlur={e => setReportContent(e.currentTarget.innerHTML)} />
      </div>
    </div>
  )
}
