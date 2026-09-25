# 🌐 ICU MessageFormat

> 基于 Unicode ICU 规范的完整编译器：复数、选择、序数与数字/日期/时间格式化，多语言规则自动求值。

## 概述

引擎的 `t()` 在检测到 ICU 语法的模板时会自动调用内置 ICU 编译器（`ICUParser` + `ICUCompiler`），无需额外安装或配置：

```ts
i18n.registerTranslation('en', {
  apples: '{count, plural, one {# apple} other {# apples}}',
});

i18n.t('apples', { count: '1' }); // => "1 apple"
i18n.t('apples', { count: '5' }); // => "5 apples"
```

## 复数 plural

复数按**当前语言的 CLDR 规则**求值，各语言分支数不同：

```ts
// 英语：one / other
'{count, plural, one {# photo} other {# photos}}'
```

```ts
// 俄语：one / few / many / other
'{count, plural, one {# яблоко} few {# яблока} many {# яблок} other {# яблока}}'
```

```ts
// 阿拉伯语：zero / one / two / few / many / other 六形
'{count, plural, zero {لا تفاحات} one {تفاحة واحدة} two {تفاحتان} few {# تفاحات} many {# تفاحة} other {# تفاحة}}'
```

| 语言 | 需要的分支 |
| ------ | ----------- |
| 中文 / 日文 / 韩文 | 仅 `other`（无词形变化） |
| 英 / 法 / 德 / 西 / 葡 | `one` / `other` |
| 俄语 | `one` / `few` / `many`（+`other` 兜底） |
| 阿拉伯语 | `zero` / `one` / `two` / `few` / `many` / `other` |

`#` 占位符会被替换为格式化后的数字。

## 选择 select

按枚举值选分支，适合性别、称谓等：

```ts
i18n.registerTranslation('fr', {
  invite: "{gender, select, male {Il est invité} female {Elle est invitée} other {Cette personne est invitée}}",
});

t('invite', { gender: 'female' }); // => "Elle est invitée"
```

## 序数 selectordinal

```ts
i18n.registerTranslation('en', {
  place: '{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th} place}',
});

t('place', { n: '1' }); // => "1st place"
t('place', { n: '4' }); // => "4th place"
```

## 数字 / 日期 / 时间

```ts
'{price, number, ::.00}'          // 1234.5 → "1,234.50"
'{d, date, ::yyyyMMdd}'           // 日期骨架
'{ts, time, ::HHmm}'              // 时间骨架
```

## 底层 API：直接使用解析器与编译器

需要自定义管线（构建期预编译、语法校验工具）时，可直接导入：

```ts
import { ICUParser, ICUCompiler } from '@yyc3/i18n-core/browser';

// 解析：AST + 错误列表（parse 为实例方法）
const parsed = new ICUParser().parse('{count, plural, one {# item} other {# items}}');
if (parsed.errors.length === 0) {
  // 编译：AST + 参数 → 字符串
  const compiler = new ICUCompiler();
  const output = compiler.compile(
    parsed.ast,
    { locale: 'en', params: { count: '5' } },
  );
  console.log(output); // => "5 items"
}
```

AST 节点类型（`ICUNode` 联合类型）覆盖 `ICULiteral / ICUArgument / ICUPlural / ICUSelect / ICUSelectOrdinal / ICUNumber / ICUDate / ICUTime`，可用于编写构建期校验脚本。

## 下一步

- [RTL 支持](/guide/rtl-support) —— 阿拉伯语布局镜像
- [AI 翻译集成](/guide/ai-translation) —— 让 LLM 生成 ICU 合法译文
