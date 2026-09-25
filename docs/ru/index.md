---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: i18n-фреймворк на базе ИИ
  tagline: Ноль зависимостей · ИИ-перевод · Протокол MCP · Компилятор ICU · 10 языков · OWASP L4
  image:
    src: /Family-001.png
    alt: Семейство YYC³
  actions:
    - theme: brand
      text: Быстрый старт
      link: /ru/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: Встроенный ИИ-перевод
    details: Два движка OpenAI + Ollama, пакетный перевод одной командой, оценка качества и учёт контекста. 73% разработчиков уже применяют LLM для перевода.
  - icon: 🔌
    title: Сервер протокола MCP
    details: "Первый в отрасли MCP-сервер для i18n: 7 инструментов позволяют ИИ-агентам вроде Claude и Cursor напрямую управлять переводческими ресурсами."
  - icon: 📦
    title: Ноль зависимостей в рантайме
    details: Полное отсутствие зависимостей, 20,5 КБ в gzip, нулевой риск цепочки поставок. Полная поддержка tree-shaking.
  - icon: 🌐
    title: ICU MessageFormat
    details: "Полноценный компилятор ICU: множественное число/выбор/порядковые/смещение/числа/даты/время на всех 10 языках."
  - icon: 🔒
    title: Матрица безопасности OWASP L4
    details: Защита от ReDoS, сравнение секретов за постоянное время, ограничение частоты и экспоненциальная задержка. Корпоративное соответствие.
  - icon: 🎨
    title: Нативная поддержка RTL
    details: Автоматическая RTL-раскладка для арабского, иврита и персидского, зеркалирование CSS-свойств и определение направления.
  - icon: ⚡
    title: Система LRU-кэша
    details: Попадания в кэш O(1) быстрее 0,1 мс, настраиваемый TTL, статистика и прогрев кэша.
  - icon: 🧩
    title: Жизненный цикл плагинов
    details: "Полная цепочка хуков: beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError."
---
