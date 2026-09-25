# 🚀 Início rápido

> **Vá do zero a uma solução i18n pronta para produção em 5 minutos** com `@yyc3/i18n-core` — zero dependências em runtime, 20,5 KB gzipped.

## Pré-requisitos

| Requisito | Versão | Observações |
|-----------|--------|-------------|
| **Node.js** | >= 18 | recomenda-se a versão LTS |
| **TypeScript** | >= 5.3 (opcional) | os tipos vêm inclusos no pacote |
| **Gerenciador de pacotes** | npm / yarn / pnpm | recomenda-se o pnpm |

## Instalação

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

## Sua primeira tradução em 30 segundos

Em um projeto para navegador (Vite, webpack, Next.js etc.), importe pelo subcaminho **`/browser`**: ele exclui os módulos embutidos do Node.js e empacota de forma limpa.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Registre a tabela de traduções de um idioma (síncrono)
i18n.registerTranslation('pt-BR', {
  greeting: 'Olá, {name}!',
  messages: '{count, plural, one {Você tem # nova mensagem} other {Você tem # novas mensagens}}',
});

// 2. Ative o idioma (notifica todos os assinantes)
await i18n.setLocale('pt-BR');

// 3. Traduza — a interpolação é automática
t('greeting', { name: 'YYC³' });
// => "Olá, YYC³!"

t('messages', { count: '3' });
// => "Você tem 3 novas mensagens"
```

::: tip Pontos de entrada
- Empacotadores de navegador → `@yyc3/i18n-core/browser`
- Node.js / servidor → `@yyc3/i18n-core`
  :::

## Interpolação de parâmetros

Envolva os marcadores com chaves e passe os valores no segundo argumento de `t()`.

```ts
i18n.registerTranslation('pt-BR', {
  welcome: 'Bem-vindo de volta, {name}. Você tem {count} itens no carrinho.',
});

t('welcome', { name: 'Alice', count: '2' });
// => "Bem-vindo de volta, Alice. Você tem 2 itens no carrinho."
```

Os parâmetros de interpolação passam por escape HTML por padrão, evitando injeção XSS.

## Plurais com ICU MessageFormat

O framework inclui um compilador ICU completo: as regras de plural são avaliadas conforme o idioma ativo, sem ramificações manuais.

```ts
i18n.registerTranslation('pt-BR', {
  apples: '{count, plural, one {# maçã} other {# maçãs}}',
});

t('apples', { count: '1' }); // => "1 maçã"
t('apples', { count: '5' }); // => "5 maçãs"
```

Também há suporte a `select`, `selectordinal` e formatos de número, data e hora.

## Troca reativa de idioma

`setLocale` é assíncrono e emite um evento de mudança. Assine uma vez e renderize a interface novamente a cada troca:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Idioma ativo:', locale);
  renderApp(); // execute novamente a lógica de renderização
});

await i18n.setLocale('pt-BR');
await i18n.setLocale('en');

// Cancele a assinatura depois, se necessário
unsubscribe();
```

Outros métodos comuns: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` e `destroy()`.

## Criando uma instância independente

O `i18n` exportado é um singleton pronto para uso. Para várias instâncias isoladas, instancie o motor diretamente:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'pt-BR',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('pt-BR', { hello: 'Olá' });
engine.t('hello'); // => "Olá"
```

## Recursos

- [Repositório no GitHub](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [Pacote NPM](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Registro de alterações](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- Referência da API (item **Referência da API** na navegação superior)
