// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file store.test.ts
 * description 工作流持久化测试（502 P1-a）——接口集成/JSON 文件存储/原子写/跨实例恢复
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.6.0
 * created 2026-11-16
 * updated 2026-11-16
 * status active
 * tags [test],[workflow],[persistence]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 文件路径均在 os.tmpdir() 的 mkdtemp 沙箱内（测试结束清理）
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { JsonFileWorkflowStore } from "../../lib/workflow/json-file-store.js";
import type { WorkflowSnapshot, WorkflowStore } from "../../lib/workflow/store.js";
import { TranslationWorkflow } from "../../lib/workflow/workflow.js";
import type { WorkflowEntry } from "../../lib/workflow/workflow.js";

const translator = { userId: "t1", roles: ["translator" as const] };
const reviewer = { userId: "r1", roles: ["reviewer" as const] };
const admin = { userId: "a1", roles: ["admin" as const] };

/** 内存桩存储：记录快照序列，可注入 save 失败。 */
class MemoryStore implements WorkflowStore {
  snapshots: WorkflowSnapshot[] = [];
  failOnSave = false;
  private restored: WorkflowSnapshot | null = null;

  constructor(restored: WorkflowSnapshot | null = null) {
    this.restored = restored;
  }

  async save(snapshot: WorkflowSnapshot): Promise<void> {
    if (this.failOnSave) throw new Error("disk full");
    this.snapshots.push(snapshot);
    this.restored = snapshot;
  }

  async load(): Promise<WorkflowSnapshot | null> {
    return this.restored;
  }
}

describe("TranslationWorkflow × WorkflowStore（集成）", () => {
  it("restore() 无存档 → 全新实例（nextId=1）", async () => {
    const workflow = await TranslationWorkflow.restore({ store: new MemoryStore(null) });
    expect(workflow.list()).toHaveLength(0);
    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    expect(entry.id).toBe(1);
  });

  it("restore() 无 store → 直接返回（零依赖路径）", async () => {
    const workflow = await TranslationWorkflow.restore();
    expect(workflow).toBeInstanceOf(TranslationWorkflow);
  });

  it("每次流转自动落盘：快照序列与状态同步", async () => {
    const store = new MemoryStore();
    const workflow = new TranslationWorkflow({ store });
    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    await workflow.approve({ entryId: entry.id, actor: reviewer });

    expect(store.snapshots).toHaveLength(2);
    expect(store.snapshots[0]?.entries[0]?.state).toBe("submitted");
    expect(store.snapshots[1]?.entries[0]?.state).toBe("approved");
    expect(store.snapshots[1]?.nextId).toBe(2);
  });

  it("恢复后 id 序号续增不撞号，轨迹完整", async () => {
    const store = new MemoryStore();
    const first = new TranslationWorkflow({ store });
    const e1 = await first.submit({ locale: "en", key: "k1", value: "v1", actor: translator });
    await first.submit({ locale: "en", key: "k2", value: "v2", actor: translator });
    await first.approve({ entryId: e1.id, actor: reviewer });

    const second = await TranslationWorkflow.restore({ store });
    expect(second.list()).toHaveLength(2);
    expect(second.get(e1.id)?.state).toBe("approved");
    expect(second.get(e1.id)?.trail).toHaveLength(2);

    const e3 = await second.submit({ locale: "en", key: "k3", value: "v3", actor: translator });
    expect(e3.id).toBe(3); // 跨实例续增
  });

  it("持久化失败即抛错（内存态已变更，调用方显式处理）", async () => {
    const store = new MemoryStore();
    const workflow = new TranslationWorkflow({ store });
    store.failOnSave = true;
    await expect(workflow.submit({ locale: "en", key: "k", value: "v", actor: translator })).rejects.toThrow("disk full");
    expect(workflow.list()).toHaveLength(1); // 内存态已变更——文档化语义
  });

  it("snapshot() 拷贝隔离：外部改动不影响内部", async () => {
    const workflow = new TranslationWorkflow();
    await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    const snap = workflow.snapshot();
    snap.entries[0]!.state = "published";
    snap.entries[0]!.trail.push({} as WorkflowEntry["trail"][number]);
    snap.nextId = 99;
    expect(workflow.get(1)?.state).toBe("submitted");
    expect(workflow.get(1)?.trail).toHaveLength(1);
    const next = await workflow.submit({ locale: "en", key: "k2", value: "v", actor: translator });
    expect(next.id).toBe(2);
  });
});

describe("JsonFileWorkflowStore（Node 文件实现）", () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "yyc3-wf-store-"));
  const fileOf = (name: string): string => {
    const target = path.resolve(sandbox, name);
    if (!target.startsWith(sandbox + path.sep)) throw new Error("路径越界");
    return target;
  };

  afterAll(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it("save→load 往返 + 原子写无 .tmp 残留 + 覆写生效", async () => {
    const file = fileOf("wf.json");
    const store = new JsonFileWorkflowStore(file);
    expect(await store.load()).toBeNull(); // ENOENT → null

    await store.save({ entries: [{ id: 1, locale: "en", key: "k", value: "v", state: "submitted", submittedBy: "t", submittedAt: 1, trail: [] }], nextId: 2, savedAt: 100 });
    expect(existsSync(`${file}.tmp`)).toBe(false); // 原子写：tmp 已 rename
    const loaded = await store.load();
    expect(loaded?.entries[0]?.key).toBe("k");
    expect(loaded?.nextId).toBe(2);

    await store.save({ entries: [], nextId: 5, savedAt: 200 });
    expect((await store.load())?.nextId).toBe(5); // 覆写生效
  });

  it("损坏 JSON / 形态非法 → 显式抛错（不静默清零）", async () => {
    const { writeFileSync } = await import("node:fs");
    const corrupt = fileOf("corrupt.json");
    writeFileSync(corrupt, "{ not json", "utf8");
    await expect(new JsonFileWorkflowStore(corrupt).load()).rejects.toThrow(/存档损坏/);

    const badShape = fileOf("bad-shape.json");
    writeFileSync(badShape, JSON.stringify({ entries: "nope", nextId: 1, savedAt: 1 }), "utf8");
    await expect(new JsonFileWorkflowStore(badShape).load()).rejects.toThrow(/形态非法（entries\/nextId）/);

    const noSavedAt = fileOf("no-saved-at.json");
    writeFileSync(noSavedAt, JSON.stringify({ entries: [], nextId: 1 }), "utf8");
    await expect(new JsonFileWorkflowStore(noSavedAt).load()).rejects.toThrow(/形态非法（savedAt）/);

    const notObject = fileOf("not-object.json");
    writeFileSync(notObject, "42", "utf8");
    await expect(new JsonFileWorkflowStore(notObject).load()).rejects.toThrow(/形态非法（非对象）/);
  });

  it("端到端：进程 A 落盘 → 进程 B（新实例）恢复并发布 → 引擎热更新", async () => {
    const file = fileOf("e2e.json");
    const engine = new I18nEngine({ locale: "ja" });

    const processA = new TranslationWorkflow({ store: new JsonFileWorkflowStore(file) });
    const entry = await processA.submit({ locale: "ja", key: "nav.home", value: "ホーム", actor: translator });
    await processA.approve({ entryId: entry.id, actor: reviewer });
    expect(JSON.parse(readFileSync(file, "utf8")).entries).toHaveLength(1); // 磁盘实文

    const processB = await TranslationWorkflow.restore({ engine, store: new JsonFileWorkflowStore(file) });
    await processB.publish({ entryId: entry.id, actor: admin });
    expect(engine.t("nav.home")).toBe("ホーム");
    expect((await new JsonFileWorkflowStore(file).load())?.entries[0]?.state).toBe("published");
  });
});

// ============================================================
// End of store.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
