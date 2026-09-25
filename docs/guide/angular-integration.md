# 🅰️ Angular 集成

> 基于引擎 `subscribe` 事件与 Angular Signal/服务的桥接模式。

## 思路

将 `I18nEngine` 封装为 Angular 注入服务，用 Signal 承载语言状态——`t()` 在模板中的重求值由 Signal 驱动。

::: info 说明
官方发布物为 `@yyc3/i18n-react`；Angular 推荐以下方服务模式集成，无第三方依赖。
:::

## 引擎服务

```ts
// i18n.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { I18nEngine } from '@yyc3/i18n-core/browser';
import type { Locale } from '@yyc3/i18n-core/browser';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly engine = new I18nEngine({ locale: 'zh-CN', fallbackLocale: 'en' });

  private readonly localeSignal = signal<Locale>(this.engine.getLocale());
  readonly locale = computed(() => this.localeSignal());

  constructor() {
    this.engine.subscribe((next) => this.localeSignal.set(next));
  }

  t(key: string, params?: Record<string, string>): string {
    return this.engine.t(key, params);
  }

  async setLocale(locale: Locale): Promise<void> {
    await this.engine.setLocale(locale);
  }
}
```

::: tip Signal 驱动原理
`locale` Signal 变化 → 依赖它的模板重新求值 → 求值过程中调用 `t()` 读取新语言文本。引擎切换由 `subscribe` 桥接进 Signal 世界，单向数据流保持清晰。
:::

## 组件中使用

```ts
// app.component.ts
import { Component, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-root',
  template: `
    <p>{{ i18n.t('greeting', { name: 'YYC³' }) }}</p>
    <p>{{ i18n.t('items', { count: '3' }) }}</p>
    <button (click)="toggle()">
      切换语言（当前：{{ i18n.locale() }}）
    </button>
  `,
})
export class AppComponent {
  readonly i18n = inject(I18nService);

  toggle() {
    this.i18n.setLocale(this.i18n.locale() === 'zh-CN' ? 'en' : 'zh-CN');
  }
}
```

## 应用初始化

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { i18n, setupDocumentDirection } from '@yyc3/i18n-core/browser';
import { AppComponent } from './app/app.component';
import { zhCN } from './locales/zh-CN';
import { en } from './locales/en';

i18n.registerTranslation('zh-CN', zhCN);
i18n.registerTranslation('en', en);

// RTL 自适应：阿语等语言切换时同步 <html dir>
i18n.subscribe(setupDocumentDirection);

await i18n.setLocale('zh-CN');

bootstrapApplication(AppComponent);
```

## 管道（Pipe）形式

偏好管道的项目可将 `t` 包装为纯管道：

```ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({ name: 't', pure: true })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string>): string {
    return this.i18n.t(key, params);
  }
}
```

```html
<p>{{ 'greeting' | t: { name: 'YYC³' } }}</p>
```

::: warning 纯管道与语言切换
纯管道依赖变更检测周期感知输入变化。切换语言后若视图未更新，在 `locale` Signal 上补一处模板引用（如标题区显示当前语言），或改用 Signal 版 `t` 组件。
:::

## 下一步

- [基础用法](/guide/basic-usage) —— 引擎全方法
- [RTL 支持](/guide/rtl-support) —— 方向镜像工具集
