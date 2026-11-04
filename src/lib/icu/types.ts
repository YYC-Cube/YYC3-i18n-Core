// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file types.ts
 * description @yyc3/i18n-core 类型定义
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[i18n]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core 类型定义
 */
export type ICUNodeType =
  | "literal"
  | "argument"
  | "plural"
  | "select"
  | "selectOrdinal"
  | "number"
  | "date"
  | "time";

export interface ICULiteral {
  type: "literal";
  value: string;
}

export interface ICUArgument {
  type: "argument";
  name: string;
}

export interface ICUPluralClause {
  selector: string;
  content: ICUNode[];
}

export interface ICUPlural {
  type: "plural";
  name: string;
  offset: number;
  clauses: ICUPluralClause[];
}

export interface ICUSelectClause {
  selector: string;
  content: ICUNode[];
}

export interface ICUSelect {
  type: "select";
  name: string;
  clauses: ICUSelectClause[];
}

export interface ICUSelectOrdinal {
  type: "selectOrdinal";
  name: string;
  clauses: ICUSelectClause[];
}

export interface ICUNumber {
  type: "number";
  name: string;
  format?: string;
}

export interface ICUDate {
  type: "date";
  name: string;
  format?: "short" | "medium" | "long" | "full";
}

export interface ICUTime {
  type: "time";
  name: string;
  format?: "short" | "medium" | "long" | "full";
}

export type ICUNode =
  | ICULiteral
  | ICUArgument
  | ICUPlural
  | ICUSelect
  | ICUSelectOrdinal
  | ICUNumber
  | ICUDate
  | ICUTime;

export interface ICUParseError {
  message: string;
  position: number;
}

export interface ICUParseResult {
  nodes: ICUNode[];
  errors: ICUParseError[];
}

// ============================================================
// End of types.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
