---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: Framework i18n impulsado por IA
  tagline: Cero dependencias · Traducción con IA · Protocolo MCP · Compilador ICU · 10 idiomas · OWASP L4
  image:
    src: /Family-001.png
    alt: Familia YYC³
  actions:
    - theme: brand
      text: Inicio rápido
      link: /es/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: Traducción IA nativa
    details: Doble motor OpenAI + Ollama, traducción por lotes con un comando, puntuación de calidad y conciencia del contexto. El 73 % de los desarrolladores ya usa LLM para traducir.
  - icon: 🔌
    title: Servidor del protocolo MCP
    details: "El primer servidor MCP para i18n del sector: 7 herramientas permiten a agentes de IA como Claude y Cursor operar directamente sobre los recursos de traducción."
  - icon: 📦
    title: Cero dependencias en tiempo de ejecución
    details: Sin dependencias, 20,5 KB gzipped, sin riesgo en la cadena de suministro. Compatible con tree-shaking.
  - icon: 🌐
    title: ICU MessageFormat
    details: "Un compilador ICU completo: plural/selección/ordinal/desplazamiento/números/fechas/horas en los 10 idiomas."
  - icon: 🔒
    title: Matriz de seguridad OWASP N4
    details: Protección ReDoS, comparación de secretos en tiempo constante, limitación de tasa y retroceso exponencial. Cumplimiento empresarial.
  - icon: 🎨
    title: Soporte RTL nativo
    details: Diseño RTL automático para árabe, hebreo y persa, inversión de propiedades CSS y detección de dirección.
  - icon: ⚡
    title: Sistema de caché LRU
    details: Aciertos de caché O(1) por debajo de 0,1 ms, expiración TTL configurable, estadísticas y calentamiento de caché.
  - icon: 🧩
    title: Ciclo de vida de plugins
    details: "Cadena completa de ganchos: beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError."
---
