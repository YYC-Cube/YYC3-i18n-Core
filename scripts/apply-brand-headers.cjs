// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
// @Project : YYC3-i18n-Core
// @File    : apply-brand-headers.cjs
// @Author  : YYC³ Team
// @Date    : 2026-11-04
// @Desc    : 一次性回灌工具 — 按《标头标尾规范 v1.1.0》为全仓代码文件加品牌标头与标准标尾（幂等）
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.v2c', '.trae', '.mimosa', '.video_agent', '.vscode', '.github', '.zcode', '.vite']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);

function brandHeader() {
  return [
    '// ============================================================',
    '// YYC³（YanYuCloudCube™ · 注册商标）',
    '// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future',
    '// 万象归元于云枢 | 深栈智启新纪元',
    '// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence',
    '// ============================================================',
    '// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email',
    '// ============================================================',
    '',
  ].join('\n');
}

function brandFooter(fileName) {
  return [
    '',
    '// ============================================================',
    `// End of ${fileName} | YYC³（YanYuCloudCube™ · 注册商标）`,
    '// 万象归元于云枢 · 深栈智启新纪元',
    '// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence',
    '// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email',
    '// ============================================================',
    '',
  ].join('\n');
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (CODE_EXTS.has(path.extname(name))) out.push(p);
  }
  return out;
}

const files = walk(ROOT, []);
let added = 0;
let skipped = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const fileName = path.basename(file);
  let text = fs.readFileSync(file, 'utf8');
  const head = text.split('\n').slice(0, 30).join('\n');
  const hasBrand = head.includes('YYC³') && head.includes('YanYuCloudCube');
  const tail = text.slice(-800);
  const hasFooter = /End of [^\n|]+ \| YYC³/.test(tail);

  if (hasBrand && hasFooter) { skipped++; continue; }

  if (!hasBrand) text = brandHeader() + text;
  if (!hasFooter) {
    text = text.replace(/\s*$/, '\n') + brandFooter(fileName).replace(/^\n/, '\n');
  }
  fs.writeFileSync(file, text);
  added++;
  console.log(`  ✏️  ${rel}${!hasBrand ? ' [+标头]' : ''}${!hasFooter ? ' [+标尾]' : ''}`);
}

console.log(`\n回灌完成：新增 ${added} 个文件，已合规跳过 ${skipped} 个，共 ${files.length} 个`);

// ============================================================
// End of apply-brand-headers.cjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
