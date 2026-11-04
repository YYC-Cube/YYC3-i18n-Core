// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file identity.test.ts
 * description OIDC 身份验证测试（502 W2）——真实密钥对签验（crypto.subtle 生成）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[workflow],[oidc]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief RS256/ES256 双算法 + 全声明校验分支 + JWKS 缓存；fetchImpl 桩零网络
 */
import { describe, expect, it } from "vitest";
import { OidcIdentityError, OidcIdentityProvider, StaticIdentityProvider } from "../../lib/workflow/identity.js";

const ISSUER = "https://sso.example.com";
const AUDIENCE = "yyc3-i18n";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeJsonPart(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function makeRsaKeyPair(): Promise<{ privateKey: CryptoKey; jwk: JsonWebKey & { kid?: string } }> {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { privateKey: pair.privateKey, jwk };
}

async function makeEsKeyPair(): Promise<{ privateKey: CryptoKey; jwk: JsonWebKey & { kid?: string } }> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { privateKey: pair.privateKey, jwk };
}

async function signToken(privateKey: CryptoKey, header: Record<string, unknown>, payload: Record<string, unknown>): Promise<string> {
  const signedContent = `${encodeJsonPart(header)}.${encodeJsonPart(payload)}`;
  const algorithm: AlgorithmIdentifier | EcdsaParams = header.alg === "ES256"
    ? { name: "ECDSA", hash: "SHA-256" }
    : "RSASSA-PKCS1-v1_5";
  const signature = await crypto.subtle.sign(algorithm, privateKey, new TextEncoder().encode(signedContent));
  return `${signedContent}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

function makeProvider(jwks: { keys: Array<JsonWebKey & { kid?: string }> }, fetchCalls?: { count: number }): OidcIdentityProvider {
  const fetchImpl = (async () => {
    if (fetchCalls) fetchCalls.count += 1;
    return new Response(JSON.stringify(jwks), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return new OidcIdentityProvider({ jwksUri: "https://sso.example.com/certs", issuer: ISSUER, audience: AUDIENCE, fetchImpl });
}

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: "user-42",
    name: "小方",
    roles: ["translator"],
    iss: ISSUER,
    aud: AUDIENCE,
    exp: Math.floor(Date.now() / 1000) + 600,
    ...overrides,
  };
}

describe("StaticIdentityProvider", () => {
  it("登记 token 可验、未知 token 抛错、返回拷贝", async () => {
    const provider = new StaticIdentityProvider({ t: { userId: "u", roles: ["admin"] } });
    const identity = await provider.verify("t");
    expect(identity.userId).toBe("u");
    identity.roles.push("reviewer");
    expect((await provider.verify("t")).roles).toEqual(["admin"]);
    await expect(provider.verify("x")).rejects.toThrow(/Unknown token/);
  });
});

describe("OidcIdentityProvider（RS256 主路径）", () => {
  it("合法令牌：验签+声明+角色映射+displayName", async () => {
    const { privateKey, jwk } = await makeRsaKeyPair();
    const provider = makeProvider({ keys: [{ ...jwk, kid: "k1" }] });
    const token = await signToken(privateKey, { alg: "RS256", kid: "k1", typ: "JWT" }, validPayload());

    const identity = await provider.verify(token);
    expect(identity).toMatchObject({ userId: "user-42", displayName: "小方", roles: ["translator"] });
  });

  it("preferred_username 兜底 displayName；角色逗号字符串形态", async () => {
    const { privateKey, jwk } = await makeRsaKeyPair();
    const provider = makeProvider({ keys: [{ ...jwk, kid: "k1" }] });
    const token = await signToken(privateKey, { alg: "RS256", kid: "k1" },
      validPayload({ name: undefined, preferred_username: "ada", roles: "translator, admin,root" }));

    const identity = await provider.verify(token);
    expect(identity.displayName).toBe("ada");
    expect(identity.roles).toEqual(["translator", "admin"]); // 非法角色静默丢弃
  });

  it("aud 数组形态含目标即通过；JWKS 按 kid 缓存（fetch 一次）", async () => {
    const { privateKey, jwk } = await makeRsaKeyPair();
    const calls = { count: 0 };
    const provider = makeProvider({ keys: [{ ...jwk, kid: "k1" }, { ...jwk, kid: "k2" }] }, calls);
    const token = await signToken(privateKey, { alg: "RS256", kid: "k1" }, validPayload({ aud: ["other", AUDIENCE] }));

    await provider.verify(token);
    await provider.verify(token);
    expect(calls.count).toBe(1);
  });

  it("失败分支矩阵：签名/算法/格式/声明/JWKS", async () => {
    const { privateKey: good, jwk } = await makeRsaKeyPair();
    const other = await makeRsaKeyPair();
    const provider = makeProvider({ keys: [{ ...jwk, kid: "k1" }] });

    // 签名不匹配（他钥签发）
    const forged = await signToken(other.privateKey, { alg: "RS256", kid: "k1" }, validPayload());
    await expect(provider.verify(forged)).rejects.toThrow(/Signature verification failed/);

    // 不支持算法
    const hsToken = await signToken(good, { alg: "HS256", kid: "k1" }, validPayload());
    await expect(provider.verify(hsToken)).rejects.toThrow(/Unsupported alg/);

    // 格式错误
    await expect(provider.verify("not.a")).rejects.toThrow(/Malformed JWT/);
    await expect(provider.verify("###.###.###")).rejects.toThrow(/段解码失败/);

    // exp 过期（须超过 60s 时钟偏移容忍）
    const expired = await signToken(good, { alg: "RS256", kid: "k1" }, validPayload({ exp: Math.floor(Date.now() / 1000) - 120 }));
    await expect(provider.verify(expired)).rejects.toThrow(/expired/);

    // iss/aud 不符
    await expect(provider.verify(await signToken(good, { alg: "RS256", kid: "k1" }, validPayload({ iss: "https://evil" }))))
      .rejects.toThrow(/iss mismatch/);
    await expect(provider.verify(await signToken(good, { alg: "RS256", kid: "k1" }, validPayload({ aud: "other-app" }))))
      .rejects.toThrow(/aud mismatch/);

    // 无有效角色
    await expect(provider.verify(await signToken(good, { alg: "RS256", kid: "k1" }, validPayload({ roles: [] }))))
      .rejects.toThrow(/无有效工作流角色/);

    // kid 不匹配 / JWK 导入失败
    await expect(provider.verify(await signToken(good, { alg: "RS256", kid: "nope" }, validPayload())))
      .rejects.toThrow(/JWKS 无匹配密钥/);
    const badJwkProvider = makeProvider({ keys: [{ kty: "oct", kid: "k1" }] });
    await expect(badJwkProvider.verify(await signToken(good, { alg: "RS256", kid: "k1" }, validPayload())))
      .rejects.toThrow(/JWK 导入失败/);
  });

  it("JWKS 拉取失败映射为 OidcIdentityError", async () => {
    const { privateKey, jwk } = await makeRsaKeyPair();
    const provider = new OidcIdentityProvider({
      jwksUri: "https://sso.example.com/certs",
      issuer: ISSUER,
      audience: AUDIENCE,
      fetchImpl: (async () => new Response("oops", { status: 503 })) as unknown as typeof fetch,
    });
    const token = await signToken(privateKey, { alg: "RS256", kid: (jwk as { kid?: string }).kid }, validPayload());
    await expect(provider.verify(token)).rejects.toThrow(/JWKS fetch 503/);
  });

  it("无 kid 令牌取 JWKS 首键；roles/name 非法类型的兜底分支", async () => {
    const { privateKey, jwk } = await makeRsaKeyPair();
    const provider = makeProvider({ keys: [{ ...jwk, kid: "only-one" }] });

    // 头部无 kid → JWKS 第一把密钥
    const token = await signToken(privateKey, { alg: "RS256", typ: "JWT" }, validPayload());
    expect((await provider.verify(token)).userId).toBe("user-42");

    // roles 为数字（非数组/非字符串）→ 无有效角色
    const badRoles = await signToken(privateKey, { alg: "RS256" }, validPayload({ roles: 42 }));
    await expect(provider.verify(badRoles)).rejects.toThrow(/无有效工作流角色/);

    // name 非字符串 → preferred_username 兜底；两者皆非法 → undefined
    const noName = await signToken(privateKey, { alg: "RS256" }, validPayload({ name: 7, preferred_username: "fallback" }));
    expect((await provider.verify(noName)).displayName).toBe("fallback");
    const neither = await signToken(privateKey, { alg: "RS256" }, validPayload({ name: 7, preferred_username: 9 }));
    expect((await provider.verify(neither)).displayName).toBeUndefined();
  });
});

describe("OidcIdentityProvider（ES256）", () => {
  it("EC P-256 验签通过", async () => {
    const { privateKey, jwk } = await makeEsKeyPair();
    const provider = makeProvider({ keys: [{ ...jwk, kid: "ec1" }] });
    const token = await signToken(privateKey, { alg: "ES256", kid: "ec1" }, validPayload({ roles: ["reviewer"] }));
    const identity = await provider.verify(token);
    expect(identity.roles).toEqual(["reviewer"]);
  });
});

// ============================================================
// End of identity.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
