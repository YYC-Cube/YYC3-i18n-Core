# 🚀 빠른 시작

> **5분 만에 프로덕션급 i18n 적용**. `@yyc3/i18n-core`는 런타임 종속성이 없고 gzip 20.5KB입니다.

## 전제 조건

| 요구사항 | 버전 | 비고 |
|----------|------|------|
| **Node.js** | >= 18 | LTS 권장 |
| **TypeScript** | >= 5.3 (선택) | 타입 정의 포함 |
| **패키지 관리자** | npm / yarn / pnpm | pnpm 권장 |

## 설치

::: code-group

```bash [pnpm]
pnpm add @yyc3/i18n-core
```

```bash [npm]
npm install @yyc3/i18n-core
```

```bash [yarn]
yarn add @yyc3/i18n-core
```

:::

## 30초 만의 첫 번역

브라우저 프로젝트(Vite, webpack, Next.js 등)에서는 **`/browser`** 하위 경로에서 가져오세요. Node.js 내장 모듈이 제외되어 번들이 깔끔합니다.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. 언어의 번역 맵 등록 (동기)
i18n.registerTranslation('ko', {
  greeting: '안녕하세요, {name}님!',
  messages: '새 메시지가 {count}개 있습니다',
});

// 2. 언어 활성화 (모든 구독자에게 알림)
await i18n.setLocale('ko');

// 3. 번역 — 보간은 자동
t('greeting', { name: 'YYC³' });
// => "안녕하세요, YYC³님!"

t('messages', { count: '3' });
// => "새 메시지가 3개 있습니다"
```

::: tip 가져오기 진입점
- 브라우저 번들러 → `@yyc3/i18n-core/browser`
- Node.js / 서버 사이드 → `@yyc3/i18n-core`
  :::

## 매개변수 보간

자리표시자를 중괄호로 감싸고, 값은 `t()`의 두 번째 인수로 전달합니다.

```ts
i18n.registerTranslation('ko', {
  welcome: '다시 오셨군요, {name}님. 장바구니에 상품이 {count}개 있습니다.',
});

t('welcome', { name: '앨리스', count: '2' });
// => "다시 오셨군요, 앨리스님. 장바구니에 상품이 2개 있습니다."
```

보간 매개변수는 기본적으로 HTML 이스케이프되어 XSS 주입을 방지합니다.

## ICU MessageFormat 복수 표현

ICU 컴파일러가 내장되어 있습니다. 한국어는 수량에 따른 형태 변화가 없으므로 `other`만으로 충분합니다.

```ts
i18n.registerTranslation('ko', {
  apples: '사과가 {count}개 있습니다',
});

t('apples', { count: '1' }); // => "사과가 1개 있습니다"
t('apples', { count: '5' }); // => "사과가 5개 있습니다"
```

`plural`, `select`, `selectordinal`, 숫자/날짜/시간 서식도 지원합니다.

## 반응형 언어 전환

`setLocale`은 비동기이며 언어 변경 이벤트를 발생시킵니다. 한 번 구독하면 전환할 때마다 UI를 다시 렌더링할 수 있습니다.

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('현재 언어:', locale);
  renderApp(); // 렌더링 로직 재실행
});

await i18n.setLocale('ko');
await i18n.setLocale('en');

// 필요 시 구독 해지
unsubscribe();
```

그 외 주요 메서드: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()`, `destroy()`.

## 독립 인스턴스 생성

내보내진 `i18n`은 바로 사용 가능한 싱글톤입니다. 여러 개의 격리된 인스턴스가 필요하면 엔진을 직접 생성하세요.

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'ko',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('ko', { hello: '안녕하세요' });
engine.t('hello'); // => "안녕하세요"
```

## 리소스

- [GitHub 저장소](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [NPM 패키지](https://www.npmjs.com/package/@yyc3/i18n-core)
- [변경 로그](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- API 참조(상단 탐색의 **API 참조** 항목을 확인하세요)
