// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file json-file-store.ts
 * description 工作流 JSON 文件存储（502 P1-a）——临时文件 + rename 原子写
 * module @yyc3/i18n-core/node
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.6.0
 * created 2026-11-16
 * updated 2026-11-16
 * status active
 * tags [module],[workflow],[persistence],[node]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Node 专属（node:fs）——经 ./node 子路径导出，主入口保持浏览器友好；
 *       半写不可见（writeFile 临时文件 + rename 同盘原子替换）
 */
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkflowSnapshot, WorkflowStore } from "./store.js";

/**
 * JSON 文件工作流存储（Node 专属，502 P1-a）：
 * `load()` 文件不存在返回 null（首次启动）；损坏/形态非法抛错（显式暴露数据损伤，不静默清零）。
 */
export class JsonFileWorkflowStore implements WorkflowStore {
  private readonly filePath: string;
  private readonly tmpPath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.tmpPath = `${this.filePath}.tmp`;
  }

  async load(): Promise<WorkflowSnapshot | null> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`工作流存档损坏（JSON 解析失败）: ${this.filePath}: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    }
    return this.validate(parsed);
  }

  async save(snapshot: WorkflowSnapshot): Promise<void> {
    // 原子写：先写临时文件再同盘 rename——读侧永见完整快照或旧快照
    await writeFile(this.tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await rename(this.tmpPath, this.filePath);
  }

  /** 形态校验：entries 数组 + nextId 正整数 + savedAt 数字（非法即抛，防半写/手改事故静默扩散）。 */
  private validate(data: unknown): WorkflowSnapshot {
    if (!data || typeof data !== "object") throw new Error(`工作流存档形态非法（非对象）: ${this.filePath}`);
    const candidate = data as Partial<WorkflowSnapshot>;
    if (!Array.isArray(candidate.entries) || typeof candidate.nextId !== "number" || !Number.isInteger(candidate.nextId) || candidate.nextId < 1) {
      throw new Error(`工作流存档形态非法（entries/nextId）: ${this.filePath}`);
    }
    if (typeof candidate.savedAt !== "number") {
      throw new Error(`工作流存档形态非法（savedAt）: ${this.filePath}`);
    }
    return { entries: candidate.entries, nextId: candidate.nextId, savedAt: candidate.savedAt };
  }
}

// ============================================================
// End of json-file-store.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
