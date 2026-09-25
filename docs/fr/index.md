---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: Framework i18n piloté par IA
  tagline: Zéro dépendance · Traduction IA · Protocole MCP · Compilateur ICU · 10 langues · OWASP L4
  image:
    src: /Family-001.png
    alt: Famille YYC³
  actions:
    - theme: brand
      text: Démarrage rapide
      link: /fr/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: Traduction IA native
    details: Double moteur OpenAI + Ollama, traduction par lots en une commande, score de qualité et perception du contexte. 73 % des développeurs utilisent déjà les LLM pour traduire.
  - icon: 🔌
    title: Serveur de protocole MCP
    details: "Le premier serveur MCP dédié à l’i18n : 7 outils permettant aux agents IA comme Claude et Cursor de manipuler directement les ressources de traduction."
  - icon: 📦
    title: Zéro dépendance à l’exécution
    details: Aucune dépendance, 20,5 Ko gzippé, aucun risque de chaîne d’approvisionnement. Compatible tree-shaking.
  - icon: 🌐
    title: ICU MessageFormat
    details: "Un compilateur ICU complet : pluriel/choix/ordinal/décalage/nombres/dates/heures dans les 10 langues."
  - icon: 🔒
    title: Matrice de sécurité OWASP N4
    details: Protection ReDoS, comparaison à temps constant, limitation de débit et temporisation exponentielle. Conformité d’entreprise.
  - icon: 🎨
    title: Prise en charge RTL native
    details: Mise en page RTL automatique pour l’arabe, l’hébreu et le persan, inversion des propriétés CSS et détection de la direction.
  - icon: ⚡
    title: Système de cache LRU
    details: Accès au cache en O(1) sous 0,1 ms, expiration TTL configurable, statistiques et préchauffage du cache.
  - icon: 🧩
    title: Cycle de vie des plugins
    details: "Chaîne de crochets complète : beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError."
---
