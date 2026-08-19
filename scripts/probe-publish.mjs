/**
 * file probe-publish.mjs
 * description 发版诊断探针 v3——文档二分,定位 WAF 拦截的触发内容:
 *   A) 真实 manifest + 无附件         → 期望 JSON 应用层错误
 *   B) 真实 manifest + 哑弹 base64 附件 → 期望 JSON 应用层错误
 *   C) 真实 manifest + 真实 tarball 附件 → 若 HTML 403 则锁定附件内容
 *   D) 最小 manifest + 真实附件       → 反向验证 manifest 无关性
 *   E) 逐段哑弹替换真实附件的二进制   → 定位附件内部触发区段(粗分四段)
 * module YYC3-i18n-Core/scripts
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.0.0
 * created 2026-08-20
 * status active
 * tags [diagnostics],[publish]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function readToken() {
  for (const k of ["NPM_TOKEN", "NODE_AUTH_TOKEN"]) {
    if (process.env[k]) return process.env[k];
  }
  const rc = path.join(process.env.HOME ?? "", ".npmrc");
  if (fs.existsSync(rc)) {
    const m = fs.readFileSync(rc, "utf8").match(/\/\/registry\.npmjs\.org\/:_authToken=(\S+)/);
    if (m) return m[1];
  }
  return null;
}

const token = readToken();
const headers = { "Content-Type": "application/json", "User-Agent": "npm/12.0.2 node/v22.22.3 linux x64" };
if (token) headers.Authorization = `Bearer ${token}`;

const URL_ = "https://registry.npmjs.org/@yyc3%2fi18n-core";
const CWD = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(CWD, "package.json"), "utf8"));
const tgzName = `yyc3-i18n-core-${pkg.version}.tgz`;
const tgz = fs.readFileSync(path.join(CWD, tgzName));
const realB64 = tgz.toString("base64");
const shasum = crypto.createHash("sha1").update(tgz).digest("hex");
const integrity = "sha512-" + crypto.createHash("sha512").update(tgz).digest("base64");

const cur = await fetch(URL_).then((r) => r.json());
const template = cur.versions[cur["dist-tags"].latest];

function makeManifest() {
  const m = { ...template, ...pkg };
  delete m.scripts;
  delete m.devDependencies;
  delete m.publishConfig;
  m.dist = { integrity, shasum, tarball: `https://registry.npmjs.org/@yyc3/i18n-core/-/i18n-core-${pkg.version}.tgz` };
  return m;
}

function buildDoc({ manifest, attachment }) {
  const doc = JSON.parse(JSON.stringify(cur));
  doc.versions[pkg.version] = manifest;
  doc["dist-tags"].latest = pkg.version;
  if (attachment === null) delete doc._attachments;
  else doc._attachments = { [tgzName]: { content_type: "application/octet-stream", data: attachment, length: attachment.length * 0.75 } };
  return doc;
}

let blocked = 0;
async function put(doc, label) {
  const res = await fetch(URL_, { method: "PUT", headers, body: JSON.stringify(doc) });
  const text = await res.text();
  const isHtml = text.trimStart().startsWith("<");
  const title = isHtml ? text.match(/<title>([^<]+)<\/title>/)?.[1] : "";
  console.log(`[${label}] status=${res.status} ct=${res.headers.get("content-type")} ${isHtml ? `HTML "${title}"` : text.slice(0, 160)}`);
  if (isHtml || res.status === 403) blocked++;
  return { status: res.status, isHtml };
}

const M = makeManifest();

// A) 无附件
await put(buildDoc({ manifest: M, attachment: null }), "A-manifest-only");
// B) 哑弹附件(与真实附件同长)
await put(buildDoc({ manifest: M, attachment: "A".repeat(realB64.length) }), "B-dummy-attachment");
// C) 真实附件
const c = await put(buildDoc({ manifest: M, attachment: realB64 }), "C-real-attachment");
// D) 最小 manifest + 真实附件
const minM = { name: pkg.name, version: pkg.version, dist: M.dist };
await put(buildDoc({ manifest: minM, attachment: realB64 }), "D-min-manifest-real-att");

// E) 附件四分位哑弹替换(仅当 C 被 WAF 拦时有意义)
if (c.isHtml) {
  const q = Math.floor(realB64.length / 4);
  for (let i = 0; i < 4; i++) {
    const mixed = realB64.slice(0, i * q) + "B".repeat(q) + realB64.slice((i + 1) * q);
    await put(buildDoc({ manifest: M, attachment: mixed }), `E-quarter-${i + 1}-real`);
  }
}

console.log(`[probe] done, html/403 responses: ${blocked}`);
