// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file infra-branch-closure.test.ts
 * description 基础设施/MCP/工具层分支闭合测试 — backoff、logger、路径防护与 stdio 传输（90% 策略线补强）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[infra],[branch-closure]
 *
 * test-target src/lib/infra/*, src/lib/utils/path-guards.ts, src/lib/mcp/stdio-transport.ts
 * coverage 90%+
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { PassThrough } from "node:stream";
import { computeBackoff, createRetryRunner, sleepWithAbort } from "../lib/infra/backoff.js";
import { createLogger, getLogLevel, logger, setLogLevel } from "../lib/infra/logger.js";
import { isPathInside, isSymlinkOpenError } from "../lib/utils/path-guards.js";
import { StdioTransport } from "../lib/mcp/stdio-transport.js";

afterEach(() => {
  vi.restoreAllMocks();
  setLogLevel("silent");
});

describe("backoff — abort 与重试终止分支", () => {
  it("预中止信号使 sleepWithAbort 抛出 aborted（cause 保留）", async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(sleepWithAbort(50, ac.signal)).rejects.toThrow("aborted");
  });

  it("ms<=0 短路返回", async () => {
    await expect(sleepWithAbort(0)).resolves.toBeUndefined();
  });

  it("shouldRetry 返回 false → 立即抛出末次错误", async () => {
    const runner = createRetryRunner({ maxAttempts: 3, shouldRetry: () => false, backoffPolicy: { initialMs: 1 } });
    await expect(runner(async () => { throw new Error("no-retry"); })).rejects.toThrow("no-retry");
  });

  it("maxAttempts=1 → 失败后无退避休眠直接耗尽", async () => {
    const runner = createRetryRunner({ maxAttempts: 1, backoffPolicy: { initialMs: 1 } });
    await expect(runner(async () => { throw new Error("once"); })).rejects.toThrow("once");
  });

  it("非 Error 抛出值被包装为 Error", async () => {
    const runner = createRetryRunner({ maxAttempts: 2, backoffPolicy: { initialMs: 1 } });
    await expect(runner(async () => { throw "raw-string" as unknown as Error; })).rejects.toThrow("raw-string");
  });

  it("computeBackoff 受 maxMs 封顶", () => {
    const ms = computeBackoff({ initialMs: 10_000, maxMs: 50, factor: 2, jitter: 0 }, 5);
    expect(ms).toBeLessThanOrEqual(50);
  });
});

describe("logger — 级别过滤与代理分支", () => {
  it("debug 级别放行全部输出（含 debug/error 分支）", () => {
    setLogLevel("debug");
    const log = createLogger("[t]");
    const spyLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const spyErr = vi.spyOn(console, "error").mockImplementation(() => {});
    log.debug("d");
    log.error("e");
    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyErr).toHaveBeenCalledTimes(1);
  });

  it("error 级别屏蔽 debug/info", () => {
    setLogLevel("error");
    const log = createLogger("[t]");
    const spyLog = vi.spyOn(console, "log").mockImplementation(() => {});
    log.debug("hidden");
    log.info("hidden");
    expect(spyLog).not.toHaveBeenCalled();
  });

  it("代理非函数属性返回 undefined", () => {
    expect((logger as unknown as Record<string, unknown>).noSuchMethod).toBeUndefined();
    expect(getLogLevel()).toBe("silent");
  });
});

describe("path-guards — win32 分支（平台桩）", () => {
  it("win32 平台下 isPathInside 正确判定包含与越界", () => {
    const desc = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    try {
      expect(isPathInside("C:\\root", "C:\\root\\sub")).toBe(true);
      expect(isPathInside("C:\\root", "C:\\root")).toBe(true);
      expect(isPathInside("C:\\root", "D:\\elsewhere")).toBe(false);
    } finally {
      Object.defineProperty(process, "platform", desc);
    }
  });

  it("isSymlinkOpenError 识别符号链接打开错误码", () => {
    const e = Object.assign(new Error("x"), { code: "ELOOP" });
    expect(isSymlinkOpenError(e)).toBe(true);
    expect(isSymlinkOpenError(Object.assign(new Error("x"), { code: "ENOENT" }))).toBe(false);
    expect(isSymlinkOpenError("nope")).toBe(false);
  });
});

describe("stdio-transport — 默认流与缓冲分支", () => {
  it("connect 缺省使用 process.stdin/stdout 且 close 清理", async () => {
    const t = new StdioTransport();
    await t.connect();
    expect(t.connected).toBe(true);
    await t.close();
    expect(t.connected).toBe(false);
  });

  it("注入流：无完整帧时静默等待（headerEnd=-1 分支）", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const outChunks: string[] = [];
    stdout.on("data", (c: Buffer) => outChunks.push(c.toString()));
    const t = new StdioTransport({ stdin, stdout });
    await t.connect();
    stdin.write("partial-frame-without-header");
    stdin.end();
    await new Promise((r) => setTimeout(r, 10));
    expect(outChunks).toHaveLength(0);
    // 未连接时 send 抛错
    await t.close();
    await expect(t.send({ jsonrpc: "2.0" as never })).rejects.toThrow("Transport not connected");
  });

  it("完整帧解析并分发消息", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const received: unknown[] = [];
    const t = new StdioTransport({ stdin, stdout });
    t.onMessage((m) => received.push(m));
    await t.connect();
    const msg = { jsonrpc: "2.0", id: 1 };
    const json = JSON.stringify(msg);
    stdin.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
    stdin.end();
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(1);
  });

  it("非法头部帧被跳过继续处理", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const received: unknown[] = [];
    const t = new StdioTransport({ stdin, stdout });
    t.onMessage((m) => received.push(m));
    await t.connect();
    const json = JSON.stringify({ ok: 1 });
    const bad = `X-Unknown: 1\r\n\r\njunk`;
    stdin.write(bad);
    stdin.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
    stdin.end();
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(1);
  });
});

// ============================================================
// End of infra-branch-closure.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
