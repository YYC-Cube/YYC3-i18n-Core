# 💚 Vue 集成

> 基于引擎 `subscribe` 事件的轻量组合式集成，无需额外依赖包。

## 思路

`@yyc3/i18n-core` 的响应式原语是 `subscribe`：语言切换时通知订阅者。Vue 侧用 `ref` + `watchEffect`（或 `computed`）桥接即可获得与官方 React 绑定等价的体验。

::: info 说明
当前官方发布物为 `@yyc3/i18n-react`；Vue 集成推荐以下方的组合式函数模式，约 20 行代码即可覆盖绝大多数场景。
:::

## 组合式函数封装

```ts
// composables/useI18n.ts
import { computed, ref, onUnmounted } from 'vue';
import { i18n, t as engineT } from '@yyc3/i18n-core/browser';
import type { Locale } from '@yyc3/i18n-core/browser';

const locale = ref<Locale>(i18n.getLocale());

const unsubscribe = i18n.subscribe((next) => {
  locale.value = next;
});
onUnmounted(unsubscribe); // 单例场景可省略

export function useI18n() {
  const t = (key: string, params?: Record<string, string>) =>
    i18n.t(key, params);

  async function setLocale(next: Locale) {
    await i18n.setLocale(next);
  }

  return {
    locale: computed(() => locale.value),
    setLocale,
    t,
  };
}
```

::: tip 为什么 t 不需要包响应式
`locale` 变化会触发依赖它的组件重渲染，渲染过程中重新调用 `t()` 即得新语言文本；将 `t` 保持为普通函数可让模板静态分析更友好。
:::

## 模板中使用

```vue
<script setup lang="ts">
import { useI18n } from './composables/useI18n';

const { t, locale, setLocale } = useI18n();
</script>

<template>
  <p>{{ t('greeting', { name: 'YYC³' }) }}</p>
  <p>{{ t('items', { count: '3' }) }}</p>
  <button @click="setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')">
    切换语言（当前：{{ locale }})
  </button>
</template>
```

## 应用初始化

```ts
// main.ts
import { createApp } from 'vue';
import { i18n } from '@yyc3/i18n-core/browser';
import { setupDocumentDirection } from '@yyc3/i18n-core/browser';
import App from './App.vue';
import { zhCN } from './locales/zh-CN';
import { en } from './locales/en';

i18n.registerTranslation('zh-CN', zhCN);
i18n.registerTranslation('en', en);

// 语言切换时同步 <html dir>（阿语等 RTL 自适应）
i18n.subscribe((locale) => setupDocumentDirection(locale));

await i18n.setLocale('zh-CN');

createApp(App).mount('#app');
```

## RTL 与方向

阿拉伯语切换时配合 [`setupDocumentDirection`](/guide/rtl-support) 设置 `<html dir="rtl">`，模板中优先使用 CSS 逻辑属性（`margin-inline-start` 等）实现零成本镜像。

## SSR（Nuxt / Vue 服务端渲染）

服务端为每个请求创建独立引擎，避免跨请求状态串扰：

```ts
import { I18nEngine } from '@yyc3/i18n-core';

export async function useServerI18n(locale: Locale) {
  const engine = new I18nEngine({ locale, fallbackLocale: 'en' });
  await engine.setLocale(locale);
  return engine;
}
```

## 下一步

- [基础用法](/guide/basic-usage) —— 引擎全方法
- [RTL 支持](/guide/rtl-support) —— 方向镜像工具集
