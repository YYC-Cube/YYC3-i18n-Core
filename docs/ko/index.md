---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: AI 네이티브 i18n 프레임워크
  tagline: 제로 종속성 · AI 번역 · MCP 프로토콜 · ICU 컴파일러 · 10개 언어 · OWASP L4
  image:
    src: /Family-001.png
    alt: YYC³ 패밀리
  actions:
    - theme: brand
      text: 빠른 시작
      link: /ko/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: AI 번역 네이티브 통합
    details: OpenAI + Ollama 듀얼 엔진, 원-커맨드 일괄 번역, 품질 점수화, 컨텍스트 인식. 개발자의 73%가 이미 LLM 번역을 사용합니다.
  - icon: 🔌
    title: MCP 프로토콜 서버
    details: 업계 최초의 i18n MCP Server. 7개 도구로 Claude, Cursor 등 AI 에이전트가 번역 리소스를 직접 조작할 수 있습니다.
  - icon: 📦
    title: 런타임 종속성 제로
    details: 완전한 무종속, gzip 20.5KB, 공급망 위험 없음. Tree-shaking 친화.
  - icon: 🌐
    title: ICU MessageFormat
    details: 복수/선택/서수/오프셋/숫자/날짜/시간 서식을 10개 언어 모두에서 지원하는 완전한 ICU 컴파일러.
  - icon: 🔒
    title: OWASP L4 보안 매트릭스
    details: ReDoS 방어, 타이밍 공격 방지 상수 시간 비교, 속도 제한, 지수 백오프. 엔터프라이즈 보안 규정 준수.
  - icon: 🎨
    title: RTL 네이티브 지원
    details: 아랍어/히브리어/페르시아어 RTL 레이아웃 자동 처리, CSS 속성 반전, 방향 감지.
  - icon: ⚡
    title: LRU 캐시 시스템
    details: O(1) 캐시 적중 0.1ms 미만, 구성 가능한 TTL 만료, 캐시 통계 및 예열.
  - icon: 🧩
    title: 플러그인 라이프사이클
    details: beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError 완전한 훅 체인.
---
