/**
 * file probe-publish.mjs
 * description 发版诊断探针——以与 npm publish 完全相同的文档结构
 *   (现有 packument + 新版本清单 + base64 tarball 附件)直接 PUT,
 *   打印 registry 的逐字响应。npm 客户端对 403 不显示响应体,此脚本
 *   用于暴露真实拒绝原因;若 registry 放行,版本即完成发布。
 * module YYC3-i18n-Core/scripts
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
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

const PKG_SCOPE = "@yyc3/i18n-core";
const REG_URL = "https://registry.npmjs.org/@yyc3%2fi18n-core";
const CWD = process.cwd();

// token 优先级:NPM_TOKEN / NODE_AUTH_TOKEN(CI)→ ~/.npmrc(本地)
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
if (!token) {
  console.log("[probe] no token found — sending unauthenticated PUT (expected 401/403)");
}

const pkg = JSON.parse(fs.readFileSync(path.join(CWD, "package.json"), "utf8"));
const tgzName = `${PKG_SCOPE.replace("@", "").replace("/", "-")}-${pkg.version}.tgz`;
const tgzPath = path.join(CWD, tgzName);
if (!fs.existsSync(tgzPath)) {
  console.error(`[probe] tarball not found: ${tgzName} (run npm pack first)`);
  process.exit(1);
}
const tgz = fs.readFileSync(tgzPath);
const shasum = crypto.createHash("sha1").update(tgz).digest("hex");
const integrity = "sha512-" + crypto.createHash("sha512").update(tgz).digest("base64");

// 拉取现有 packument,以其最新版本清单为结构模板
const cur = await fetch(REG_URL).then((r) => r.json());
const latestVer = cur["dist-tags"].latest;
const template = cur.versions[latestVer];

const manifest = { ...template, ...pkg };
delete manifest.scripts;
delete manifest.devDependencies;
delete manifest.publishConfig;
manifest.dist = {
  integrity,
  shasum,
  tarball: `https://registry.npmjs.org/@yyc3/i18n-core/-/i18n-core-${pkg.version}.tgz`,
};

cur.versions[pkg.version] = manifest;
cur["dist-tags"].latest = pkg.version;
cur._attachments = {
  [tgzName]: { content_type: "application/octet-stream", data: tgz.toString("base64"), length: tgz.length },
};

const headers = { "Content-Type": "application/json" };
if (token) headers.Authorization = `Bearer ${token}`;

const res = await fetch(REG_URL, { method: "PUT", headers, body: JSON.stringify(cur) });
const body = await res.text();
console.log(`[probe] PUT ${pkg.version} → status=${res.status}`);
console.log(`[probe] headers: cf-mitigated=${res.headers.get("cf-mitigated")} content-type=${res.headers.get("content-type")}`);
console.log(`[probe] body: ${body.slice(0, 600)}`);
if (res.status >= 200 && res.status < 300) {
  console.log("[probe] SUCCESS — version published by probe");
}
