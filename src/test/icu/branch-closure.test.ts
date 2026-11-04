// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file branch-closure.test.ts
 * description ICU parser/compiler 分支闭合测试 — 覆盖错误路径与边角分支（90% 策略线补强）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[icu],[branch-closure]
 *
 * test-target src/lib/icu/parser.ts, src/lib/icu/compiler.ts
 * coverage 90%+
 */
import { describe, expect, it } from "vitest";
import { ICUParser } from "../../lib/icu/parser.js";
import { ICUCompiler, type ICUCompileContext } from "../../lib/icu/compiler.js";

const parse = (input: string) => new ICUParser().parse(input);
const baseCtx: ICUCompileContext = { locale: "en", params: {} };
const compile = (input: string, params: Record<string, unknown> = {}, locale = "en") => {
  const { nodes, errors } = parse(input);
  return new ICUCompiler().compile(nodes, { locale, params });
};

describe("ICU parser — escape and literal edges", () => {
  it("顶层单引号转义：'' 产出字面引号", () => {
    const r = parse("it''s {n}");
    expect(errorsOf(r)).toHaveLength(0);
    expect(r.nodes.some((x) => x.type === "literal" && x.value.includes("'"))).toBe(true);
  });

  it("未闭合单引号：原样保留并携带引号", () => {
    const r = parse("'abc");
    expect(r.nodes[0]).toMatchObject({ type: "literal", value: "'abc" });
  });

  it("成对单引号包裹文本：闭合后继续解析", () => {
    const r = parse("'a' b {n}");
    expect(errorsOf(r)).toHaveLength(0);
    const literal = r.nodes.find((x) => x.type === "literal");
    expect(literal && (literal as { value: string }).value).toContain("a b");
  });

  it("子句内引号转义与 # 混排", () => {
    const out = compile("{x, plural, other {it''s #}}", { x: 3 });
    expect(out).toBe("it's 3");
  });
});

describe("ICU parser — argument error branches", () => {
  it("空参数 {} 产出错误（parseArgumentInner 无名返回 null）", () => {
    expect(errorsOf(parse("{}")).length).toBeGreaterThan(0);
  });

  it("{ } 空白参数名 → Expected argument name", () => {
    expect(errorsOf(parse("{ }")).some((e) => e.message === "Expected argument name")).toBe(true);
  });

  it("{x z} 名称后非法字符 → Unexpected character", () => {
    expect(errorsOf(parse("{x z}")).some((e) => e.message.startsWith("Unexpected character"))).toBe(true);
  });

  it("{#} 顶层无参数名 → 错误 + 残余字面量（# 特例仅在子句内生效）", () => {
    const r = parse("{#}");
    expect(errorsOf(r).some((e) => e.message === "Expected argument name")).toBe(true);
    expect(r.nodes[0]).toMatchObject({ type: "literal", value: "#}" });
    // 子句内的 {#} 才是特殊 # 参数分支
    const inner = parse("{x, plural, other {#}}");
    expect(errorsOf(inner)).toHaveLength(0);
    expect(JSON.stringify(inner.nodes)).toContain('"name":"#"');
  });
});

describe("ICU parser — format dispatch and errors", () => {
  it("{x, } 空格式类型 → Expected format type", () => {
    expect(errorsOf(parse("{x, }")).some((e) => e.message === "Expected format type")).toBe(true);
  });

  it("{x, bogus} 未知格式类型 → 错误且残余归并为字面量节点", () => {
    const r = parse("{x, bogus}");
    expect(r.errors.some((e) => e.message.startsWith("Unknown format type"))).toBe(true);
    expect(r.nodes[0]?.type).toBe("literal");
  });

  it("number 有无 format 两分支", () => {
    expect(errorsOf(parse("{n, number}"))).toHaveLength(0);
    expect(errorsOf(parse("{n, number, integer}"))).toHaveLength(0);
    expect(compile("{n, number, integer}", { n: 42 })).toContain("42");
  });

  it("date/time 有无 format 四分支", () => {
    for (const tpl of ["{d, date}", "{d, date, short}", "{t, time}", "{t, time, full}"]) {
      expect(errorsOf(parse(tpl))).toHaveLength(0);
    }
  });

  it("date/time 非法值回退为原始字符串", () => {
    expect(compile("{d, date}", { d: "not-a-date" })).toBe("not-a-date");
    expect(compile("{t, time}", { t: "junk" })).toBe("junk");
  });
});

describe("ICU parser — plural/select/selectOrdinal edges", () => {
  it("offset 解析与 = 精确匹配、# 计数", () => {
    expect(compile("{x, plural, offset:2 =3 {exactly #} other {oth #}}", { x: 5 })).toBe("exactly 3");
  });

  it("负数精确选择器 =-1", () => {
    expect(compile("{x, plural, =-1 {neg} other {o}}", { x: -1 })).toBe("neg");
  });

  it("选择器后缺 { → Expected '{' after selector 错误", () => {
    const r = parse("{x, plural, bogus}");
    expect(r.errors.some((e) => e.message.includes("Expected '{'"))).toBe(true);
  });

  it("空选择器子句终止解析", () => {
    const r = parse("{x, select, }");
    expect(r.nodes[0]).toHaveProperty("clauses");
    expect((r.nodes[0] as { clauses: unknown[] }).clauses).toHaveLength(0);
  });

  it("select 多子句与缺 other 兜底", () => {
    expect(compile("{g, select, a{A} b{B}}", { g: "b" })).toBe("B");
    expect(compile("{g, select, a{A}}", { g: "zz" })).toBe("zz");
  });

  it("selectOrdinal 类别与数字选择器、缺 other 兜底", () => {
    expect(compile("{n, selectOrdinal, one{1st} other{#th}}", { n: 1 })).toBe("1st");
    expect(compile("{n, selectOrdinal, =7{seven} }", { n: 9 })).toBe("9");
  });

  it("plural 无匹配类别且无 other → 显示数字", () => {
    expect(compile("{n, plural, one{single}}", { n: 5 })).toBe("5");
  });

  it("子句内容嵌套参数与字面量混排", () => {
    expect(compile("{x, plural, other {a {y} b}}", { x: 1, y: "Y" })).toBe("a Y b");
  });

  it("locale 前缀复数规则：pt-BR/zh/fr/de/es/ar 分支", () => {
    expect(compile("{n, plural, two{two} one{one} other{o}}", { n: 2 }, "pt-BR")).toBe("two");
    expect(compile("{n, plural, one{one} other{o}}", { n: 1 }, "pt-BR")).toBe("one");
    expect(compile("{n, plural, other{oth}}", { n: 2 }, "zh-CN")).toBe("oth");
    expect(compile("{n, plural, one{one} other{o}}", { n: 0 }, "fr")).toBe("one");
    expect(compile("{n, plural, one{one} other{o}}", { n: 1 }, "de")).toBe("one");
    expect(compile("{n, plural, one{one} other{o}}", { n: 1 }, "es")).toBe("one");
    expect(compile("{n, plural, few{few} other{o}}", { n: 5 }, "ar")).toBe("few");
    expect(compile("{n, plural, many{many} other{o}}", { n: 25 }, "ar")).toBe("many");
    expect(compile("{n, plural, zero{z} one{1} two{2} other{o}}", { n: 2 }, "en")).toBe("2");
  });

  it("无复数规则语言回退 en 规则", () => {
    expect(compile("{n, plural, one{one} other{o}}", { n: 1 }, "it-IT")).toBe("one");
  });

  it("自定义 pluralRule 与 formatNumber/formatDate/formatTime 回调", () => {
    const { nodes } = parse("{n, plural, big{BIG} other{o}}");
    const c = new ICUCompiler();
    expect(
      c.compile(nodes, {
        locale: "en",
        params: { n: 4 },
        pluralRule: (_loc, count) => (count > 3 ? "big" : "other"),
      }),
    ).toBe("BIG");
    const num = parse("{n, number}").nodes;
    expect(
      c.compile(num, { locale: "en", params: { n: 7 }, formatNumber: () => "SEVEN" }),
    ).toBe("SEVEN");
    const d = parse("{d, date, long}").nodes;
    expect(
      c.compile(d, { locale: "en", params: { d: "2026-01-02" }, formatDate: () => "DATE!" }),
    ).toBe("DATE!");
    const t = parse("{t, time, short}").nodes;
    expect(
      c.compile(t, { locale: "en", params: { t: "2026-01-02T10:00:00Z" }, formatTime: () => "TIME!" }),
    ).toBe("TIME!");
  });

  it("compileNode 未知类型返回空串", () => {
    const c = new ICUCompiler();
    const ghost = { type: "alien" } as unknown as Parameters<ICUCompiler["compile"]>[0][number];
    expect(c.compile([ghost], baseCtx)).toBe("");
  });

  it("argument 参数缺省输出空串", () => {
    expect(compile("hi {missing}", {})).toBe("hi ");
  });
});

function errorsOf(r: { errors: { message: string }[] }) {
  return r.errors;
}

// ============================================================
// End of branch-closure.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
