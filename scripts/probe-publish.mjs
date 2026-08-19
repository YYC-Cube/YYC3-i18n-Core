/**
 * file probe-publish.mjs
 * description 发版诊断探针 v2——鉴别 Cloudflare WAF 拦截的触发维度:
 *   1) 尺寸阶梯:不同体积的 PUT 到目标包 URL,定位阈值(若存在);
 *   2) 外部包对照:同 token PUT 到无关包,鉴别账户级封锁;
 *   3) 完整捕获 HTML 拦截页的可读文本(含 Ray ID 与规则提示)。
 *   小体积 junk 期望 registry JSON 400(认证通过、到达应用层);
 *   HTML 403 = WAF 层拦截。
 * module YYC3-i18n-Core/scripts
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.0.0
 * created 2026-08-20
 * status active
 * tags [diagnostics],[publish]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 */
import fs from "node:fs";
import path from "node:path";

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
const headers = { "Content-Type": "application/json" };
if (token) headers.Authorization = `Bearer ${token}`;
headers["User-Agent"] = "npm/12.0.2 node/v22.22.3 linux x64";

const report = [];

async function put(url, body, label) {
  const res = await fetch(url, { method: "PUT", headers, body });
  const text = await res.text();
  const isHtml = text.trimStart().startsWith("<");
  let info = "";
  if (isHtml) {
    // 抽取拦截页可读文本(标题 + 正文段落 + Ray ID)
    const title = text.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const paras = [...text.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" | ");
    const ray = text.match(/Ray ID:\s*([0-9a-f]+)/i)?.[1] ?? text.match(/cf-ray/i) ? text.match(/Ray ID:\s*([0-9a-f]+)/i)?.[1] ?? "" : "";
    info = `HTML title="${title}" text="${paras}" ray=${ray}`;
  } else {
    info = text.slice(0, 200);
  }
  const line = `[${label}] status=${res.status} ct=${res.headers.get("content-type")} :: ${info}`;
  console.log(line);
  report.push(line);
}

const target = "https://registry.npmjs.org/@yyc3%2fi18n-core";
const foreign = "https://registry.npmjs.org/lodash";

// 1) 基线读
const g = await fetch(target);
console.log(`[get-target] status=${g.status}`);

// 2) 小体积 junk(认证层+文档校验层均可达)
await put(target, JSON.stringify({}), "put-100B");

// 3) 尺寸阶梯
for (const kb of [10, 50, 100, 150, 210]) {
  const pad = "x".repeat(kb * 1024);
  await put(target, JSON.stringify({ pad }), `put-${kb}KB`).catch((e) =>
    console.log(`[put-${kb}KB] FETCH-ERROR ${e.cause?.code ?? e.message}`)
  );
}

// 4) 外部包对照(小体积)
await put(foreign, JSON.stringify({}), "put-lodash-100B");

console.log("[probe] done");
