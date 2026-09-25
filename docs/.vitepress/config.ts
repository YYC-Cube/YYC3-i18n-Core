import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'

const GITHUB_URL = 'https://github.com/YYC-Cube/YYC3-i18n-Core'
const NPM_URL = 'https://www.npmjs.com/package/@yyc3/i18n-core'
const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`

// ============================================================
// 10-language UI strings (root zh-CN is configured separately below)
// ============================================================

interface LocaleUI {
  guide: string
  gettingStarted: string
  apiReference: string
  searchButton: string
  edit: string
  updated: string
  prev: string
  next: string
  onThisPage: string
  theme: string
  toLight: string
  toDark: string
  menu: string
  backToTop: string
  skip: string
  language: string
  tip: string
  warning: string
  danger: string
  info: string
  details: string
  copyCode: string
  copied: string
  searchReset: string
  searchNoResults: string
  searchBack: string
  searchSelect: string
  searchNavigate: string
  searchClose: string
  footer: string
}

const enUI: LocaleUI = {
  guide: 'Guide', gettingStarted: 'Quick Start', apiReference: 'API Reference',
  searchButton: 'Search docs', edit: 'Edit this page on GitHub', updated: 'Last updated',
  prev: 'Prev', next: 'Next', onThisPage: 'On this page', theme: 'Theme',
  toLight: 'Switch to light mode', toDark: 'Switch to dark mode', menu: 'Menu',
  backToTop: 'Return to top', skip: 'Skip to content', language: 'Change language',
  tip: 'Tip', warning: 'Warning', danger: 'Danger', info: 'Info', details: 'Details',
  copyCode: 'Copy code', copied: 'Copied',
  searchReset: 'Reset', searchNoResults: 'No results found', searchBack: 'Back',
  searchSelect: 'Select', searchNavigate: 'Navigate', searchClose: 'Close',
  footer: 'Released under the MIT License · Maintained by the YYC³ Team',
}

const jaUI: LocaleUI = {
  guide: 'ガイド', gettingStarted: 'クイックスタート', apiReference: 'APIリファレンス',
  searchButton: 'ドキュメントを検索', edit: 'GitHubでこのページを編集', updated: '最終更新',
  prev: '前へ', next: '次へ', onThisPage: 'このページ', theme: 'テーマ',
  toLight: 'ライトモードに切替', toDark: 'ダークモードに切替', menu: 'メニュー',
  backToTop: '先頭に戻る', skip: '本文へスキップ', language: '言語を切り替え',
  tip: 'ヒント', warning: '警告', danger: '危険', info: '情報', details: '詳細',
  copyCode: 'コードをコピー', copied: 'コピー済み',
  searchReset: 'リセット', searchNoResults: '結果が見つかりません', searchBack: '戻る',
  searchSelect: '選択', searchNavigate: '移動', searchClose: '閉じる',
  footer: 'MITライセンスで公開 · YYC³チームが保守',
}

const koUI: LocaleUI = {
  guide: '가이드', gettingStarted: '빠른 시작', apiReference: 'API 참조',
  searchButton: '문서 검색', edit: 'GitHub에서 이 페이지 편집', updated: '마지막 업데이트',
  prev: '이전', next: '다음', onThisPage: '이 페이지에서', theme: '테마',
  toLight: '라이트 모드로 전환', toDark: '다크 모드로 전환', menu: '메뉴',
  backToTop: '맨 위로', skip: '본문으로 건너뛰기', language: '언어 변경',
  tip: '팁', warning: '경고', danger: '위험', info: '정보', details: '세부정보',
  copyCode: '코드 복사', copied: '복사됨',
  searchReset: '재설정', searchNoResults: '결과를 찾을 수 없습니다', searchBack: '뒤로',
  searchSelect: '선택', searchNavigate: '이동', searchClose: '닫기',
  footer: 'MIT 라이선스로 배포 · YYC³ 팀이 유지보수',
}

const frUI: LocaleUI = {
  guide: 'Guide', gettingStarted: 'Démarrage rapide', apiReference: 'Référence API',
  searchButton: 'Rechercher dans la doc', edit: 'Modifier cette page sur GitHub', updated: 'Dernière mise à jour',
  prev: 'Précédent', next: 'Suivant', onThisPage: 'Sur cette page', theme: 'Thème',
  toLight: 'Activer le mode clair', toDark: 'Activer le mode sombre', menu: 'Menu',
  backToTop: 'Retour en haut', skip: 'Aller au contenu', language: 'Changer de langue',
  tip: 'Conseil', warning: 'Avertissement', danger: 'Danger', info: 'Info', details: 'Détails',
  copyCode: 'Copier le code', copied: 'Copié',
  searchReset: 'Effacer', searchNoResults: 'Aucun résultat', searchBack: 'Retour',
  searchSelect: 'Sélectionner', searchNavigate: 'Naviguer', searchClose: 'Fermer',
  footer: 'Publié sous licence MIT · Maintenu par l’équipe YYC³',
}

const deUI: LocaleUI = {
  guide: 'Leitfaden', gettingStarted: 'Schnellstart', apiReference: 'API-Referenz',
  searchButton: 'Dokumentation durchsuchen', edit: 'Diese Seite auf GitHub bearbeiten', updated: 'Zuletzt aktualisiert',
  prev: 'Zurück', next: 'Weiter', onThisPage: 'Auf dieser Seite', theme: 'Design',
  toLight: 'Zum hellen Modus wechseln', toDark: 'Zum dunklen Modus wechseln', menu: 'Menü',
  backToTop: 'Nach oben', skip: 'Zum Inhalt springen', language: 'Sprache wechseln',
  tip: 'Tipp', warning: 'Warnung', danger: 'Gefahr', info: 'Info', details: 'Details',
  copyCode: 'Code kopieren', copied: 'Kopiert',
  searchReset: 'Zurücksetzen', searchNoResults: 'Keine Ergebnisse', searchBack: 'Zurück',
  searchSelect: 'Auswählen', searchNavigate: 'Navigieren', searchClose: 'Schließen',
  footer: 'Veröffentlicht unter der MIT-Lizenz · Verwaltet vom YYC³-Team',
}

const esUI: LocaleUI = {
  guide: 'Guía', gettingStarted: 'Inicio rápido', apiReference: 'Referencia de API',
  searchButton: 'Buscar en la documentación', edit: 'Editar esta página en GitHub', updated: 'Última actualización',
  prev: 'Anterior', next: 'Siguiente', onThisPage: 'En esta página', theme: 'Tema',
  toLight: 'Cambiar a modo claro', toDark: 'Cambiar a modo oscuro', menu: 'Menú',
  backToTop: 'Volver arriba', skip: 'Saltar al contenido', language: 'Cambiar idioma',
  tip: 'Consejo', warning: 'Advertencia', danger: 'Peligro', info: 'Información', details: 'Detalles',
  copyCode: 'Copiar código', copied: 'Copiado',
  searchReset: 'Restablecer', searchNoResults: 'No se encontraron resultados', searchBack: 'Atrás',
  searchSelect: 'Seleccionar', searchNavigate: 'Navegar', searchClose: 'Cerrar',
  footer: 'Publicado bajo la licencia MIT · Mantenido por el equipo YYC³',
}

const ptUI: LocaleUI = {
  guide: 'Guia', gettingStarted: 'Início rápido', apiReference: 'Referência da API',
  searchButton: 'Buscar na documentação', edit: 'Editar esta página no GitHub', updated: 'Última atualização',
  prev: 'Anterior', next: 'Próximo', onThisPage: 'Nesta página', theme: 'Tema',
  toLight: 'Ativar modo claro', toDark: 'Ativar modo escuro', menu: 'Menu',
  backToTop: 'Voltar ao topo', skip: 'Pular para o conteúdo', language: 'Alterar idioma',
  tip: 'Dica', warning: 'Aviso', danger: 'Perigo', info: 'Informação', details: 'Detalhes',
  copyCode: 'Copiar código', copied: 'Copiado',
  searchReset: 'Limpar', searchNoResults: 'Nenhum resultado', searchBack: 'Voltar',
  searchSelect: 'Selecionar', searchNavigate: 'Navegar', searchClose: 'Fechar',
  footer: 'Publicado sob a licença MIT · Mantido pela equipe YYC³',
}

const ruUI: LocaleUI = {
  guide: 'Руководство', gettingStarted: 'Быстрый старт', apiReference: 'Справочник API',
  searchButton: 'Поиск по документации', edit: 'Редактировать эту страницу на GitHub', updated: 'Последнее обновление',
  prev: 'Предыдущая', next: 'Следующая', onThisPage: 'На этой странице', theme: 'Тема',
  toLight: 'Переключить на светлую тему', toDark: 'Переключить на тёмную тему', menu: 'Меню',
  backToTop: 'Наверх', skip: 'Перейти к содержимому', language: 'Сменить язык',
  tip: 'Совет', warning: 'Предупреждение', danger: 'Опасность', info: 'Сведения', details: 'Подробности',
  copyCode: 'Копировать код', copied: 'Скопировано',
  searchReset: 'Сбросить', searchNoResults: 'Ничего не найдено', searchBack: 'Назад',
  searchSelect: 'Выбрать', searchNavigate: 'Перейти', searchClose: 'Закрыть',
  footer: 'Публикуется по лицензии MIT · Поддерживается командой YYC³',
}

const arUI: LocaleUI = {
  guide: 'الدليل', gettingStarted: 'البدء السريع', apiReference: 'مرجع API',
  searchButton: 'البحث في الوثائق', edit: 'تعديل هذه الصفحة على GitHub', updated: 'آخر تحديث',
  prev: 'السابق', next: 'التالي', onThisPage: 'في هذه الصفحة', theme: 'المظهر',
  toLight: 'التبديل إلى الوضع الفاتح', toDark: 'التبديل إلى الوضع الداكن', menu: 'القائمة',
  backToTop: 'العودة إلى الأعلى', skip: 'تخطَّ إلى المحتوى', language: 'تغيير اللغة',
  tip: 'تلميح', warning: 'تحذير', danger: 'خطر', info: 'معلومات', details: 'التفاصيل',
  copyCode: 'نسخ الكود', copied: 'تم النسخ',
  searchReset: 'مسح', searchNoResults: 'لا توجد نتائج', searchBack: 'رجوع',
  searchSelect: 'اختيار', searchNavigate: 'انتقال', searchClose: 'إغلاق',
  footer: 'منشور بموجب ترخيص MIT · يُحافظ عليه فريق YYC³',
}

type LocaleDef = {
  key: string
  label: string
  lang: string
  dir?: 'rtl'
  og: string
  description: string
  ui: LocaleUI
}

const localizedLocales: LocaleDef[] = [
  { key: 'en', label: 'English', lang: 'en', og: 'en_US', description: 'Production-grade i18n framework · AI-Powered · Zero dependencies · MCP · ICU MessageFormat', ui: enUI },
  { key: 'ja', label: '日本語', lang: 'ja', og: 'ja_JP', description: 'プロダクショングレードのi18nフレームワーク · AI翻訳 · ゼロ依存 · MCP · ICU MessageFormat', ui: jaUI },
  { key: 'ko', label: '한국어', lang: 'ko', og: 'ko_KR', description: '프로덕션급 i18n 프레임워크 · AI 번역 · 제로 종속성 · MCP · ICU MessageFormat', ui: koUI },
  { key: 'fr', label: 'Français', lang: 'fr', og: 'fr_FR', description: 'Framework i18n de qualité production · Traduction IA · Zéro dépendance · MCP · ICU MessageFormat', ui: frUI },
  { key: 'de', label: 'Deutsch', lang: 'de', og: 'de_DE', description: 'Produktionsreifes i18n-Framework · KI-Übersetzung · Keine Abhängigkeiten · MCP · ICU MessageFormat', ui: deUI },
  { key: 'es', label: 'Español', lang: 'es', og: 'es_ES', description: 'Framework i18n de nivel producción · Traducción con IA · Cero dependencias · MCP · ICU MessageFormat', ui: esUI },
  { key: 'pt', label: 'Português', lang: 'pt-BR', og: 'pt_BR', description: 'Framework i18n de nível produção · Tradução por IA · Zero dependências · MCP · ICU MessageFormat', ui: ptUI },
  { key: 'ru', label: 'Русский', lang: 'ru', og: 'ru_RU', description: 'Промышленный i18n-фреймворк · ИИ-перевод · Ноль зависимостей · MCP · ICU MessageFormat', ui: ruUI },
  { key: 'ar', label: 'العربية', lang: 'ar-SA', dir: 'rtl', og: 'ar_SA', description: 'إطار i18n إنتاجي · ترجمة بالذكاء الاصطناعي · صفر تبعيات · MCP · صيغة ICU MessageFormat', ui: arUI },
]

function localizedThemeConfig(loc: LocaleDef): DefaultTheme.Config {
  const s = loc.ui
  const base = `/${loc.key}/`
  return {
    nav: [
      {
        text: s.guide,
        items: [{ text: s.gettingStarted, link: `${base}guide/getting-started` }],
      },
      { text: s.apiReference, link: '/api/' },
    ],
    sidebar: {
      [`${base}guide/`]: [
        {
          text: s.guide,
          items: [{ text: s.gettingStarted, link: `${base}guide/getting-started` }],
        },
      ],
    },
    footer: {
      message: s.footer,
      copyright: 'Copyright © 2024-2026 YYC³ Team. All rights reserved.',
    },
    editLink: {
      pattern: `${GITHUB_URL}/edit/main/docs/:path`,
      text: s.edit,
    },
    lastUpdated: { text: s.updated },
    docFooter: { prev: s.prev, next: s.next },
    outline: { label: s.onThisPage },
    darkModeSwitchLabel: s.theme,
    lightModeSwitchTitle: s.toLight,
    darkModeSwitchTitle: s.toDark,
    sidebarMenuLabel: s.menu,
    returnToTopLabel: s.backToTop,
    langMenuLabel: s.language,
    skipToContentLabel: s.skip,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: s.searchButton, buttonAriaLabel: s.searchButton },
          modal: {
            backButtonTitle: s.searchBack,
            noResultsText: s.searchNoResults,
            resetButtonTitle: s.searchReset,
            footer: {
              selectText: s.searchSelect,
              navigateText: s.searchNavigate,
              closeText: s.searchClose,
            },
          },
        },
      },
    },
  }
}

export default defineConfig({
  title: '@yyc3/i18n-core',
  description: '生产级国际化框架 · 中文原生优化 · AI-Powered · MCP Integration',

  // markdown 配置为全局级(LocaleSpecificConfig 不接受该字段)。
  // root 为中文站;非中文页面的容器标题通过 `::: tip {title}` 内联本地化。
  // 注: VitePress 1.6 无 codeCopyButton 配置项,复制按钮文案不可配置。
  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详情',
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'og:site_name', content: '@yyc3/i18n-core' }],
  ],

  themeConfig: {
    nav: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '最佳实践', link: '/guide/best-practices' },
          { text: 'AI 翻译', link: '/guide/ai-translation' },
          { text: 'MCP 集成', link: '/guide/mcp-integration' },
        ],
      },
      {
        text: 'API 参考',
        link: '/api/',
      },
      {
        text: '资源',
        items: [
          { text: 'GitHub', link: GITHUB_URL },
          { text: 'NPM 包', link: NPM_URL },
          { text: '更新日志', link: CHANGELOG_URL },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装配置', link: '/guide/installation' },
            { text: '基础用法', link: '/guide/basic-usage' },
          ],
        },
        {
          text: '进阶功能',
          items: [
            { text: '命名空间管理', link: '/guide/namespaces' },
            { text: '插件系统', link: '/guide/plugins' },
            { text: 'ICU MessageFormat', link: '/guide/icu-messageformat' },
            { text: 'RTL 支持', link: '/guide/rtl-support' },
          ],
        },
        {
          text: '高级特性',
          items: [
            { text: 'AI 翻译集成', link: '/guide/ai-translation' },
            { text: 'MCP 协议集成', link: '/guide/mcp-integration' },
            { text: '安全防护', link: '/guide/security' },
            { text: '性能优化', link: '/guide/performance' },
          ],
        },
        {
          text: '框架集成',
          items: [
            { text: 'React 集成', link: '/guide/react-integration' },
            { text: 'Vue 集成', link: '/guide/vue-integration' },
            { text: 'Angular 集成', link: '/guide/angular-integration' },
            { text: 'Node.js 后端', link: '/guide/nodejs-backend' },
          ],
        },
        {
          text: '最佳实践',
          items: [
            { text: '项目结构建议', link: '/guide/best-practices#project-structure' },
            { text: '翻译管理流程', link: '/guide/best-practices#translation-workflow' },
            { text: '性能优化策略', link: '/guide/best-practices#performance-optimization' },
            { text: '错误处理模式', link: '/guide/best-practices#error-handling' },
          ],
        },
      ],
      '/api/': [
        { text: '核心引擎', link: '/api/' },
        { text: '类型定义', link: '/api/types' },
        { text: '缓存系统', link: '/api/cache' },
        { text: '插件 API', link: '/api/plugins' },
        { text: 'AI 翻译 API', link: '/api/ai' },
        { text: 'MCP 服务器 API', link: '/api/mcp' },
        { text: '安全模块', link: '/api/security' },
        { text: '基础设施', link: '/api/infrastructure' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: GITHUB_URL },
    ],

    footer: {
      message: '基于 MIT 许可发布 · YYC³ 团队维护',
      copyright: 'Copyright © 2024-2026 YYC³ Team. All rights reserved.',
    },

    editLink: {
      pattern: `${GITHUB_URL}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    ...Object.fromEntries(
      localizedLocales.map((loc) => [
        loc.key,
        {
          label: loc.label,
          lang: loc.lang,
          ...(loc.dir ? { dir: loc.dir } : {}),
          link: `/${loc.key}/`,
          title: '@yyc3/i18n-core',
          description: loc.description,
          head: [
            ['meta', { name: 'og:locale', content: loc.og }],
          ],
          // 注意: VitePress 的 markdown(container/codeCopyButton)为全局配置,
          // 不属于 LocaleSpecificConfig,无法按 locale 覆写。
          // 各语言页面的容器标题通过 `::: tip {本地语标题}` 内联提供。
          themeConfig: localizedThemeConfig(loc),
        },
      ]),
    ),
  },
})
