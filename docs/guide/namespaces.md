# 🗂️ 命名空间管理

> 用 `createNamespace` 为大型应用的不同模块建立独立的翻译作用域。

## 为什么需要命名空间

当键数量增长到数百个时，扁平键名会失控：

```
app.title
app.description
settings.profile.heading
settings.profile.saveButton   ← 冗长且易拼错
```

命名空间翻译器把公共前缀收敛一次，模块内只写短键。

## 创建命名空间翻译器

```ts
const settingsT = i18n.createNamespace('settings.profile');

settingsT.t('heading');      // 等同于 t('settings.profile.heading')
settingsT.t('saveButton');
settingsT.getLocale();       // 当前语言
```

返回对象包含三个方法：

| 方法 | 签名 | 说明 |
| ------ | ------ | ------ |
| `t` | `t(key, params?) => string` | 自动拼接前缀翻译 |
| `batchTranslate` | `batchTranslate(keys) => Record<string, string>` | 批量翻译命名空间内多个键 |
| `getLocale` | `getLocale() => Locale` | 读取当前语言 |

## 资源组织建议

命名空间与资源嵌套结构一一对应，按模块拆分文件：

```ts
// locales/zh-CN/settings.ts
export const settings = {
  profile: {
    heading: '个人资料',
    saveButton: '保存',
    email: '邮箱：{email}',
  },
  notifications: {
    heading: '通知设置',
  },
};
```

```ts
// 注册时合并
import { settings } from './locales/zh-CN/settings';
import { common } from './locales/zh-CN/common';

i18n.registerTranslation('zh-CN', { settings, common });
```

## 按需拆分与批量翻译

模块初始化时一次性拉取全部键，避免模板中散落调用：

```ts
const profileT = i18n.createNamespace('settings.profile');

const labels = profileT.batchTranslate(['heading', 'saveButton']);
// => { 'heading': '个人资料', 'saveButton': '保存' }
```

## 与插件协作

命名空间只是键前缀语法糖，插件钩子看到的仍是完整键名，因此 [MissingKeyReporter](/guide/plugins) 的缺失统计对命名空间键完全透明。

## 下一步

- [插件系统](/guide/plugins) —— 定制翻译管线
- [最佳实践](/guide/best-practices#project-structure) —— 项目结构建议
