# 制造报价测算系统 - 云端版

Next.js + Supabase 全栈应用

## 快速部署

### 1. Supabase 配置

1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 创建新项目，复制 **Project URL** 和 **anon public API Key**
3. 进入项目 → SQL Editor → 执行 `supabase_schema.sql`

### 2. 环境变量

在项目根目录创建 `.env.local`：

```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
```

### 3. 本地开发

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

### 4. 生产部署（Vercel）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

或在 Vercel Dashboard 中：
1. Import Git 仓库
2. 设置环境变量（同上）
3. 自动构建部署

### 5. 其他静态托管

```bash
npm run build
# 部署 out/ 目录到任意静态托管
```

## 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 产品报价测算 | ✅ | 含新建/沿用/顺延三种模式 |
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
| PDF导出 | 🔄 | 开发中 |
| Excel导入导出 | 🔄 | 开发中 |
| 数据图表 | 🔄 | 开发中 |

## 技术栈

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Lucide React (图标)

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

## 联系方式

部署遇到问题随时反馈。
