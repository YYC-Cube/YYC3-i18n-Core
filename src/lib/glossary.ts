// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file glossary.ts
 * description 术语表模块 — 跨语言术语强制一致性与查询（G2 glossary_lookup / G3 glossary 插件同源）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [module],[glossary],[i18n]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 术语表：源语言术语 → 各目标语言固定译法；支持精确/前缀查询、
 *       译文违规检测（禁止自造译法的词出现在译文中）
 */

/** 单条术语：源词 + 各目标语言的固定译法。 */
export interface GlossaryEntry {
  /** 源语言术语（通常为英文键值原文） */
  term: string;
  /** 是否禁止在目标语言译文中使用源词（默认 true——必须用固定译法） */
  forbidSourceTerm?: boolean;
  /** 各目标语言固定译法；缺某语言 = 该语言无强制约束 */
  translations: Partial<Record<string, string>>;
  /** 备注（业务语境说明） */
  note?: string;
}

/** 术语违规：译文中出现了应使用固定译法的源词。 */
export interface GlossaryViolation {
  term: string;
  locale: string;
  /** 违规译文中源词出现的上下文（前后各 20 字符） */
  excerpt: string;
  /** 应使用的固定译法 */
  expected: string;
}

export interface GlossaryCheckResult {
  checked: number;
  violations: GlossaryViolation[];
}

/**
 * 术语表。零依赖纯数据结构 + 确定性算法；词汇表经 freeze 防运行时篡改
 * （与插件合同 v2 的 capability 冻结策略一致）。
 */
export class Glossary {
  private readonly entries = new Map<string, GlossaryEntry>();

  /** 批量导入术语（重复 term 以最后者为准）。返回词条总数。 */
  load(entries: readonly GlossaryEntry[]): number {
    for (const entry of entries) {
      this.entries.set(entry.term, {
        ...entry,
        forbidSourceTerm: entry.forbidSourceTerm ?? true,
        translations: Object.freeze({ ...entry.translations }),
      });
    }
    return this.entries.size;
  }

  /** 精确查询（大小写不敏感，术语表惯例）。 */
  lookup(term: string): GlossaryEntry | undefined {
    const lower = term.toLowerCase();
    for (const [key, entry] of this.entries) {
      if (key.toLowerCase() === lower) return entry;
    }
    return undefined;
  }

  /** 前缀查询（供 MCP glossary_lookup 的模糊模式）。 */
  search(prefix: string): GlossaryEntry[] {
    const lower = prefix.toLowerCase();
    const out: GlossaryEntry[] = [];
    for (const [key, entry] of this.entries) {
      if (key.toLowerCase().startsWith(lower)) out.push(entry);
    }
    return out.sort((a, b) => a.term.localeCompare(b.term));
  }

  size(): number {
    return this.entries.size;
  }

  /** 取某语言的全部固定译法（term → translation），供翻译前注入提示词/校验。 */
  translationsFor(locale: string): Array<{ term: string; translation: string; forbidSourceTerm: boolean }> {
    const out: Array<{ term: string; translation: string; forbidSourceTerm: boolean }> = [];
    for (const entry of this.entries.values()) {
      const t = entry.translations[locale];
      if (typeof t === "string") out.push({ term: entry.term, translation: t, forbidSourceTerm: entry.forbidSourceTerm ?? true });
    }
    return out.sort((a, b) => a.term.localeCompare(b.term));
  }

  /**
   * 校验一批译文的术语一致性：译文含源词而该语言有固定译法 → 违规。
   * 仅对 forbidSourceTerm=true 的词条生效；大小写不敏感匹配。
   */
  checkTranslations(items: ReadonlyArray<{ locale: string; sourceText: string; translatedText: string }>): GlossaryCheckResult {
    const violations: GlossaryViolation[] = [];
    let checked = 0;

    for (const item of items) {
      checked++;
      const lowerText = item.translatedText.toLowerCase();
      for (const entry of this.entries.values()) {
        const expected = entry.translations[item.locale];
        if (!entry.forbidSourceTerm || typeof expected !== "string") continue;

        const sourceLower = item.sourceText.toLowerCase();
        // 源文确实含该术语才检查译文（避免源文不含术语时误伤）
        if (!sourceLower.includes(entry.term.toLowerCase())) continue;

        const idx = lowerText.indexOf(entry.term.toLowerCase());
        if (idx !== -1) {
          const start = Math.max(0, idx - 20);
          const excerpt = item.translatedText.slice(start, Math.min(item.translatedText.length, idx + entry.term.length + 20));
          violations.push({ term: entry.term, locale: item.locale, excerpt, expected });
        }
      }
    }

    return { checked, violations };
  }
}

// ============================================================
// End of glossary.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
