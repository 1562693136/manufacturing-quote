# 制造报价测算系统 - 云端版

Next.js + Supabase 全栈应用

## ⚡ 一键部署（推荐）

### 方式1：Vercel 直接上传（无需GitHub）

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 **Upload** 选项
3. 上传本项目文件夹（或zip文件）
4. 在 Environment Variables 中添加：
   - `NEXT_PUBLIC_SUPABASE_URL` = https://weglmkqcdybcltxcccqr.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZ2xta3FjZHliY2x0eGNjY3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzE0NDEsImV4cCI6MjA5Mjg0NzQ0MX0.V3z9h7s-5sdrJdq7RyP9PaKQTWn2UPlXYCxosn7yOfs
5. 点击 Deploy，约2分钟后获得访问链接

### 方式2：Vercel CLI 部署

```bash
# 安装依赖
npm install

# 设置环境变量（已配置在 .env.local）

# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

### 方式3：其他平台

```bash
npm install
npm run build
# 部署 out/ 目录到任意静态托管
```

## 数据库初始化

部署完成后，必须在 Supabase SQL Editor 中执行 `supabase_schema.sql`：

1. 登录 [supabase.com](https://supabase.com)
2. 进入项目 → SQL Editor
3. 粘贴 `supabase_schema.sql` 内容
4. 点击 Run

## 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 产品报价测算 | ✅ | 含新建/沿用/顺延三种模式 |
| 自定义字段 | ✅ | 6种类型，参与计算导出 |
| 阶梯报价 | ✅ | 阶梯系数+模拟计算 |
| 设备投资梯度 | ✅ | 设备成本分摊+产能利用率 |
| 三量动态关联 | ✅ | MOQ校验+批量倍数 |
| 多场景运营模拟 | ✅ | 多场景利润对比 |
| 综合测算报告 | ✅ | 富文本报告+导出HTML |
| 成本参数配置 | ✅ | 5类参数管理 |
| 版本与留痕 | ✅ | 版本记录+变更说明 |
| BOM层级管理 | ✅ | 半成品/原材料/关系/展开 |
| 报价历史查询 | ✅ | 搜索+分页+版本对比 |
| SOP与权限 | ✅ | 角色/用户/文档编辑 |
| PDF导出 | ✅ | 完整报价单PDF |
| Excel导入导出 | ✅ | 多Sheet数据交换 |
| 数据图表 | ✅ | 成本结构饼图+柱状图 |

## 技术栈

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Chart.js (数据图表)
- jsPDF (PDF导出)
- xlsx (Excel处理)

## 角色权限

| 角色 | 报价 | BOM | 设置 | SOP | 用户管理 |
|------|------|-----|------|-----|----------|
| 管理员 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 报价员 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 查看者 | ❌ | ❌ | ✅ | ✅ | ❌ |

## 版本号规则

- V{major}.{minor} 格式
- 顺延模式：minor 自动 +1
- 全新报价：从 V1.0 开始
