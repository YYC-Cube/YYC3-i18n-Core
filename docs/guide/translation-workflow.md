# 🛂 SSO 翻译工作流

> 译者角色 × 审批链 × 身份抽象——企业翻译协作工作流（502 方案）：确定性状态机门控每一次流转，OIDC 验签守住身份，发布即热更新进引擎。

## 状态机

```
              submit(resubmit)          approve               publish
  (入口) ─────────────────▶ submitted ─────────▶ approved ─────────▶ published
                              │ reject                ▲                    │
                              ▼                       └── resubmit（修订后重审）
                           rejected ── resubmit ─▶ submitted
```

**角色权限矩阵**（越权抛 `WorkflowPermissionError`，非法转移抛 `WorkflowStateError`）：

| 操作 | translator | reviewer | admin |
|------|:---:|:---:|:---:|
| submit / resubmit | ✓ | ✗ | ✓ |
| approve / reject | ✗ | ✓ | ✓ |
| publish | ✗ | ✗ | ✓ |

## 快速开始

```ts
import { I18nEngine, TranslationWorkflow, StaticIdentityProvider } from '@yyc3/i18n-core/workflow';

const engine = new I18nEngine({ locale: 'ja' });
const workflow = new TranslationWorkflow({
  engine,   // publish 时热更新进引擎
  identity: new StaticIdentityProvider({
    'tok-ada': { userId: 'ada', roles: ['translator'] },
    'tok-rex': { userId: 'rex', roles: ['reviewer'] },
  }),
  onTransition: (t) => auditSink(t),  // 每次流转外接审计
});

await workflow.submit({ locale: 'ja', key: 'nav.home', value: 'ホーム', actor: { token: 'tok-ada' } });
await workflow.approve({ entryId: 1, actor: { token: 'tok-rex' }, note: 'LGTM' });
const rejected = await workflow.reject({ entryId: 2, actor: adminCtx });   // 或直传 IdentityContext
await workflow.resubmit({ entryId: 2, value: '修订值', actor: { token: 'tok-ada' } });
await workflow.publish({ all: true, actor: adminCtx });                     // admin 专属
```

每次流转追加轨迹（actor/roles/from→to/note），`entry.trail` 完整可回放。

## 身份抽象（SSO 衔接点）

操作接受 `actor: IdentityContext`（服务端既有会话）或 `token: string`（经 `IdentityProvider` 现场验证）。

**StaticIdentityProvider**：token→身份静态映射（本地开发/测试/单机）。

**OidcIdentityProvider**：OIDC 兼容 IdP（Keycloak / Auth0 / 企业 IdP）令牌验证——零依赖：

```ts
import { OidcIdentityProvider } from '@yyc3/i18n-core/workflow';

const identity = new OidcIdentityProvider({
  jwksUri: 'https://sso.example.com/realms/main/protocol/openid-connect/certs',
  issuer: 'https://sso.example.com/realms/main',
  audience: 'yyc3-i18n',
  rolesClaim: 'roles',      // 默认；数组或逗号分隔字符串均可
});

const user = await identity.verify(token); // → { userId, roles, displayName }
```

验证链：JWKS 拉取（按 kid 缓存）→ RS256/ES256 验签（`crypto.subtle` 原生）→ `iss`/`aud`/`exp`（含 60s 时钟偏移）声明校验 → 角色映射（词汇表外角色静默丢弃）。

::: info 边界
本库只做**令牌验证**；OIDC 授权码流程/回调处理属应用层（如 Next.js middleware）。多级会签为显式非目标，待需求实证。
:::

## MCP 工具面（选择性接线）

`registerWorkflowTools(server, workflow)` 注册五工具——token 每调用现验，错误经 `isError` 返回不抛传输层；**不接线则缺省 13 工具面零变化**：

```ts
import { registerWorkflowTools } from '@yyc3/i18n-core/mcp';
registerWorkflowTools(server, workflow);
// workflow_submit / workflow_approve / workflow_reject / workflow_publish / workflow_list
```

## 持久化（3.6.0 起，502 P1-a）

审批队列不再随进程重启丢失：`WorkflowStore` 抽象 + Node 内置 JSON 文件实现（原子写：临时文件 + rename）。

```ts
import { JsonFileWorkflowStore } from '@yyc3/i18n-core/node';
import { TranslationWorkflow } from '@yyc3/i18n-core/workflow';

const store = new JsonFileWorkflowStore('./data/workflow.json');

// 启动装载：无存档即全新实例；词条 id 序号跨进程续增不撞号
const workflow = await TranslationWorkflow.restore({ engine, identity, store });

// 此后每次流转自动落盘（await 完成=持久化可见；失败即抛错）
await workflow.submit({ locale: 'ja', key: 'nav.home', value: 'ホーム', actor });
```

语义与边界：

- **损坏即显式抛错**：存档 JSON 损坏/形态非法时 `load` 抛错（含 `cause`），绝不静默清零
- **自动持久化时机**：submit / resubmit / approve / reject / publish 返回前 `await` 落盘；持久化失败时内存态已变更，调用方须显式处理
- **单进程假设**：多进程并发写同一存储需上层串行化；自定义存储实现 `WorkflowStore` 双方法即可（数据库/对象存储同理）

## 审批队列可视化

`@yyc3/i18n-dashboard` 0.2.0 起内置工作流面板：

```tsx
import { WorkflowPanel, useWorkflowQueue } from '@yyc3/i18n-dashboard';

const entries = useWorkflowQueue(workflow, 5000); // 轮询（SSR 初始快照同步可得）
<WorkflowPanel entries={entries} />;              // 待审/待发布/待修订/已生效 四组视图
```

## 下一步

- [OTA 语言包热更新](/guide/ota-updates) —— 发布后的分发通道
- [安全防护](/guide/security) —— 写操作安全边界
