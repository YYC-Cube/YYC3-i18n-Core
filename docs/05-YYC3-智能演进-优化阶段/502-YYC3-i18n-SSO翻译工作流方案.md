---
file: 502-YYC3-i18n-SSO翻译工作流方案.md
title: YYC³ i18n SSO 翻译工作流方案 — 译者角色 × 审批链 × 身份抽象
description: YYC³ @yyc3/i18n-core 企业翻译协作工作流 — 状态机/角色权限矩阵/IdentityProvider 身份抽象（含 OIDC JWT 零依赖验证）/MCP 选择性工具面/Dashboard 审批队列面板
author: YYC³ Team <admin@0379.email>
version: v1.0.0
created: 2026-11-05
updated: 2026-11-05
status: stable
tags: [workflow, sso, oidc, enterprise, mcp, dashboard]
category: plan
language: zh-CN
audience: developers,managers,stakeholders
complexity: intermediate
project: yyc3-i18n-core
phase: evolution
---

# YYC³ i18n SSO 翻译工作流方案 — 译者角色 × 审批链 × 身份抽象

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**_

---

## 一、立项定位（501 遗留项独立立项）

501 方案 G4 第三项「SSO 翻译工作流」——审计日志插件化已随 G4.1（AuditLogger）落地；本方案收口其余两半：**译者角色/审批链** 与 **SSO 身份衔接**。

**仓库形态约束**：本仓是零依赖 npm 库而非在线服务——SSO 在库语境下的正确形态是**身份抽象 + 可插拔验证器**（IdentityProvider），OIDC 验证以 `crypto.subtle` + `fetch` 原生实现守住零依赖红线；工作流本体是**确定性状态机 + 角色权限矩阵**，发布动作桥接引擎热更新（registerTranslation → 订阅者即时生效），全链路经 AuditLogger 留痕。

## 二、工作流状态机（W1）

```
              submit(resubmit)          approve               publish
  (入口) ─────────────────▶ submitted ─────────▶ approved ─────────▶ published
                              │ reject                ▲                    │
                              ▼                       └── resubmit（修订后重审）
                           rejected ── resubmit ─▶ submitted
```

**角色权限矩阵**（越权即抛 `WorkflowPermissionError`）：

| 操作 | translator | reviewer | admin |
| ---- | ---- | ---- | ---- |
| submit / resubmit | ✓ | ✗ | ✓ |
| approve / reject | ✗ | ✓ | ✓ |
| publish | ✗ | ✗ | ✓ |

- 词条以「提案」进入（locale+key+value+actor），`id` 自增句柄；
- `publish` 单条或 `allApproved` 批量——写回引擎即热更新，且只允许发布 `approved` 态；
- 每次流转记录 `{ actor, roles, action, from→to, ts, note? }` 轨迹（entry.trail），可外接 AuditLogger sink。

## 三、身份抽象（W2，SSO 衔接点）

```ts
interface IdentityProvider { verify(token): Promise<IdentityContext>; }
interface IdentityContext { userId: string; displayName?: string; roles: WorkflowRole[]; }
```

- **StaticIdentityProvider**：token→身份 静态映射（本地开发/测试/单机部署）；
- **OidcIdentityProvider**：OIDC 兼容 IdP（Keycloak/Auth0/企业 IdP）——JWKS 拉取（按 kid 缓存）、JWT 签名验证（RS256/ES256，crypto.subtle 原生）、`iss`/`aud`/`exp` 声明校验；角色从 `roles` 映射（可配 claim 名）；
- **授权语义**：工作流操作接受 `actor: IdentityContext`（服务端既有会话，Dashboard 场景）**或** `token: string`（经 IdentityProvider 现场验证）。

## 四、协议与可视化面（W3）

- **MCP 选择性工具面** `registerWorkflowTools(server, workflow)`：`workflow_submit / workflow_approve / workflow_reject / workflow_publish / workflow_list` 五工具——**仅显式接线时注册**，缺省 13 工具面零变化（与 ota://status 同纪律）；
- **Dashboard `WorkflowPanel`**（@yyc3/i18n-dashboard 0.2.0）：审批队列（submitted 待审/rejected 待修/published 已生效）。

## 五、度量与验收

| 维度 | 目标 |
| ---- | ---- |
| 测试 | 状态机全转移+越权矩阵+OIDC 真实密钥对签名验证（crypto.subtle 生成/签验）+ MCP 选择性面 |
| 覆盖 | 分支 ≥90% 门禁不降 |
| 发布 | core 3.5.0（`./workflow` 子路径）+ dashboard 0.2.0；registry 冒烟含工作流断言 |
| 兼容 | 纯 additive；缺省行为零变化（不接线即无新面） |

## 六、非目标（显式排除）

- 在线翻译平台 UI（Editor 界面）——Dashboard 面板只读展示；
- OIDC 授权码流程/回调处理——属应用层（Next.js middleware 侧），本仓只做**令牌验证**；
- 多级会签（>1 审批人串行）——矩阵单审足够，链式留待需求实证。

---

### 版本历史

| 版本 | 日期 | 说明 | 作者 |
| ---- | ---- | ---- | ---- |
| v1.0.0 | 2026-11-05 | 首次发布：状态机/角色矩阵/身份抽象/OIDC 零依赖验证/选择性 MCP 面/队列面板 | YYC³ Team |

---

© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
