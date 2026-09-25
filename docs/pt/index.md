---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: Framework i18n com IA nativa
  tagline: Zero dependências · Tradução por IA · Protocolo MCP · Compilador ICU · 10 idiomas · OWASP L4
  image:
    src: /Family-001.png
    alt: Família YYC³
  actions:
    - theme: brand
      text: Início rápido
      link: /pt/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: Tradução por IA nativa
    details: Motores duplos OpenAI + Ollama, tradução em lote com um comando, pontuação de qualidade e percepção de contexto. 73% das pessoas desenvolvedoras já usam LLMs para traduzir.
  - icon: 🔌
    title: Servidor do protocolo MCP
    details: "O primeiro servidor MCP para i18n do setor: 7 ferramentas permitem que agentes de IA como Claude e Cursor operem diretamente os recursos de tradução."
  - icon: 📦
    title: Zero dependências em runtime
    details: Sem dependências, 20,5 KB gzipped, sem risco na cadeia de suprimentos. Compatível com tree-shaking.
  - icon: 🌐
    title: ICU MessageFormat
    details: "Compilador ICU completo: plural/seleção/ordinal/deslocamento/números/datas/horas nos 10 idiomas."
  - icon: 🔒
    title: Matriz de segurança OWASP N4
    details: Proteção ReDoS, comparação de segredos em tempo constante, limitação de taxa e recuo exponencial. Conformidade corporativa.
  - icon: 🎨
    title: Suporte nativo a RTL
    details: Layout RTL automático para árabe, hebraico e persa, inversão de propriedades CSS e detecção de direção.
  - icon: ⚡
    title: Sistema de cache LRU
    details: Acertos de cache O(1) abaixo de 0,1 ms, expiração TTL configurável, estatísticas e pré-aquecimento de cache.
  - icon: 🧩
    title: Ciclo de vida de plugins
    details: "Cadeia completa de ganchos: beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError."
---
