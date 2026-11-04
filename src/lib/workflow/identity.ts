// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file identity.ts
 * description 工作流身份抽象（502 方案 W2）——IdentityProvider + Static + OIDC JWT 零依赖验证
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[workflow],[sso],[oidc]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief OIDC 验证仅做「令牌验证」（JWKS 拉取缓存 + RS256/ES256 crypto.subtle
 *       原生验签 + iss/aud/exp 声明校验）；授权码流程属应用层，显式非目标
 */
import { isWorkflowRole } from "./state-machine.js";
import type { WorkflowRole } from "./state-machine.js";

/** 已验证身份：用户标识 + 工作流角色。 */
export interface IdentityContext {
  userId: string;
  displayName?: string;
  roles: WorkflowRole[];
}

/** 身份提供方抽象（SSO 衔接点）：令牌 → 身份。 */
export interface IdentityProvider {
  verify(token: string): Promise<IdentityContext>;
}

/** 静态身份提供方：token → 身份 静态映射（本地开发/测试/单机部署）。 */
export class StaticIdentityProvider implements IdentityProvider {
  private readonly map: Map<string, IdentityContext>;

  constructor(entries: Record<string, IdentityContext> = {}) {
    this.map = new Map(Object.entries(entries));
  }

  async verify(token: string): Promise<IdentityContext> {
    const identity = this.map.get(token);
    if (!identity) throw new Error(`Unknown token（StaticIdentityProvider 未登记）`);
    return { ...identity, roles: [...identity.roles] };
  }
}

export class OidcIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OidcIdentityError";
  }
}

export interface OidcIdentityProviderConfig {
  /** JWKS 端点（如 https://sso.example.com/realms/main/protocol/openid-connect/certs）。 */
  jwksUri: string;
  /** 预期 issuer（iss 声明必须相等）。 */
  issuer: string;
  /** 预期 audience（aud 声明须含）。 */
  audience: string;
  /** 角色声明名（默认 "roles"；值为数组或逗号分隔字符串均可）。 */
  rolesClaim?: string;
  /** fetch 实现注入（默认 globalThis.fetch；测试零网络）。 */
  fetchImpl?: typeof fetch;
  /** 时钟偏移容忍（默认 60s）。 */
  clockSkewMs?: number;
}

interface JwtParts {
  header: { alg: string; kid?: string; typ?: string };
  payload: Record<string, unknown>;
  signedContent: string;
  signature: Uint8Array<ArrayBuffer>;
}

function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwt(token: string): JwtParts {
  const parts = token.split(".");
  if (parts.length !== 3) throw new OidcIdentityError("Malformed JWT（须三段）");
  const [headerPart = "", payloadPart = "", signaturePart = ""] = parts;
  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerPart))) as JwtParts["header"];
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart))) as Record<string, unknown>;
    return { header, payload, signedContent: `${headerPart}.${payloadPart}`, signature: base64UrlToBytes(signaturePart) };
  } catch (err) {
    if (err instanceof OidcIdentityError) throw err;
    throw new OidcIdentityError(`JWT 段解码失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** OIDC 兼容身份提供方（502 W2）：JWKS 缓存验签 + 声明校验。 */
export class OidcIdentityProvider implements IdentityProvider {
  private readonly config: Required<Pick<OidcIdentityProviderConfig, "rolesClaim" | "clockSkewMs">> & OidcIdentityProviderConfig;
  private jwkCache = new Map<string, JsonWebKey & { kid?: string }>();

  constructor(config: OidcIdentityProviderConfig) {
    this.config = { rolesClaim: "roles", clockSkewMs: 60_000, ...config };
  }

  async verify(token: string): Promise<IdentityContext> {
    const { header, payload, signedContent, signature } = decodeJwt(token);
    if (header.alg !== "RS256" && header.alg !== "ES256") {
      throw new OidcIdentityError(`Unsupported alg "${header.alg}"（仅 RS256/ES256）`);
    }

    const jwk = await this.loadJwk(header.kid);
    const key = await this.importKey(jwk, header.alg);
    // 验签算法参数：RS256 由密钥内带 hash；ES256 须在 verify 参数声明 hash
    const verifyAlgorithm: AlgorithmIdentifier | EcdsaParams = header.alg === "RS256"
      ? "RSASSA-PKCS1-v1_5"
      : { name: "ECDSA", hash: "SHA-256" };
    const valid = await crypto.subtle.verify(
      verifyAlgorithm,
      key,
      signature,
      new TextEncoder().encode(signedContent),
    );
    if (!valid) throw new OidcIdentityError("Signature verification failed");

    this.assertClaims(payload);
    const rolesRaw = payload[this.config.rolesClaim];
    const rolesList = Array.isArray(rolesRaw)
      ? rolesRaw.map((r) => String(r))
      : typeof rolesRaw === "string" ? rolesRaw.split(",").map((s) => s.trim()) : [];
    const roles = rolesList.filter(isWorkflowRole);
    if (roles.length === 0) throw new OidcIdentityError(`Token 无有效工作流角色（claim "${this.config.rolesClaim}"）`);

    const displayName = typeof payload.name === "string" ? payload.name
      : typeof payload.preferred_username === "string" ? payload.preferred_username
        : undefined;
    return { userId: String(payload.sub ?? ""), displayName, roles };
  }

  private assertClaims(payload: Record<string, unknown>): void {
    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : Number.NaN;
    if (!Number.isFinite(exp) || exp + this.config.clockSkewMs / 1000 < now) {
      throw new OidcIdentityError("Token expired（exp）");
    }
    if (payload.iss !== this.config.issuer) {
      throw new OidcIdentityError(`iss mismatch: ${String(payload.iss)} ≠ ${this.config.issuer}`);
    }
    const aud = payload.aud;
    const audMatch = aud === this.config.audience
      || (Array.isArray(aud) && aud.includes(this.config.audience));
    if (!audMatch) throw new OidcIdentityError(`aud mismatch: ${String(aud)} 不含 ${this.config.audience}`);
  }

  private async loadJwk(kid: string | undefined): Promise<JsonWebKey> {
    const cacheKey = kid ?? "_default_";
    const cached = this.jwkCache.get(cacheKey);
    if (cached) return cached;

    const doFetch = this.config.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const response = await doFetch(this.config.jwksUri);
    if (!response.ok) throw new OidcIdentityError(`JWKS fetch ${response.status}`);
    const body = (await response.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
    const keys = body.keys ?? [];
    const match = (kid ? keys.find((k) => k.kid === kid) : keys[0]) ?? null;
    if (!match) throw new OidcIdentityError(`JWKS 无匹配密钥（kid=${kid ?? "无"}）`);
    this.jwkCache.set(cacheKey, match);
    return match;
  }

  private async importKey(jwk: JsonWebKey & { kid?: string }, alg: string): Promise<CryptoKey> {
    try {
      return alg === "RS256"
        ? await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"])
        : await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    } catch (err) {
      throw new OidcIdentityError(`JWK 导入失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// ============================================================
// End of identity.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
