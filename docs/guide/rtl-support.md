# ↔️ RTL 支持

> 阿拉伯语、希伯来语、波斯语等 RTL 语言的布局镜像工具集，与 CSS 逻辑属性配合实现全站方向自适应。

## 判断与获取方向

```ts
import {
  isRTL,
  getDirection,
  RTL_LOCALES,
} from '@yyc3/i18n-core/browser';

isRTL('ar');            // true
isRTL('zh-CN');         // false

getDirection('ar');     // 'rtl'
getDirection('en');     // 'ltr'

console.log(RTL_LOCALES); // 内置 RTL 语言清单
```

## 设置文档方向

切换语言时同步修改 `<html dir>`，CSS 逻辑属性即自动生效：

```ts
import { setupDocumentDirection } from '@yyc3/i18n-core/browser';

i18n.subscribe((locale) => {
  setupDocumentDirection(locale); // <html dir="rtl"> / <html dir="ltr">
});

await i18n.setLocale('ar');
```

本站的阿拉伯语文档页即由该机制（VitePress `dir: 'rtl'` locale 配置）驱动，整页导航、侧栏、正文自动右到左。

## 对齐与镜像

### 对齐翻转

```ts
import { getAlignment, getOppositeAlignment } from '@yyc3/i18n-core/browser';

getAlignment('rtl');              // 'right'
getAlignment('ltr');              // 'left'
getOppositeAlignment('right');    // 'left'
```

### 间距属性翻转

物理属性（`marginLeft` 等）在 RTL 下需要左右互换：

```ts
import { flipSpacing } from '@yyc3/i18n-core/browser';

flipSpacing({ marginLeft: 10, marginRight: 20 }, 'rtl');
// => { marginLeft: 20, marginRight: 10 }
```

### 绝对定位镜像

```ts
import { mirrorPosition } from '@yyc3/i18n-core/browser';

mirrorPosition({ left: 10, right: 'auto' }, 'rtl');
// => { left: 'auto', right: 10 }
```

### 一次性镜像整套布局

```ts
import { createMirroredLayout, transformClassForRTL } from '@yyc3/i18n-core/browser';

const layout = createMirroredLayout('rtl'); // 生成镜像后的布局对象
transformClassForRTL('pl-4 text-left');     // 工具类方向改写
```

## 与 CSS 逻辑属性的关系

现代 CSS 的逻辑属性（`margin-inline-start`、`text-align: start`）会依据文档方向自动翻转，**优先使用逻辑属性**；`flipSpacing / mirrorPosition` 系列工具用于无法迁移的存量物理属性代码。

```css
/* ✅ 推荐：方向自适应 */
.card { margin-inline-start: 1rem; text-align: start; }

/* ⚠️ 存量代码：用 RTL 工具在 JS 层翻转 */
.card.legacy { margin-left: 1rem; }
```

## 下一步

- [ICU MessageFormat](/guide/icu-messageformat) —— 阿拉伯语六形复数
- [最佳实践](/guide/best-practices) —— 多语言发布检查清单
