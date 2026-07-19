/* API 示例覆盖率核查:每个组件文档页的 props / events / extraApis 中的每个 API 名,
 * 必须出现在该页任一示例代码(importCode + sections[].code)里。
 * 数据源:页面暴露的 window.__DOCS__ 快照(registry.ts),一次加载全量核查。
 * 环境变量同 docsmoke:BROWSER_PATH / DOCS_URL;有缺失 → 退出码 1。 */
import puppeteer from 'puppeteer-core';

const BROWSER = process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = process.env.DOCS_URL || 'http://localhost:4173/';

/* 豁免:透传/说明性条目,不要求出现在示例代码中 */
const EXEMPT = new Set(['className', 'style', 'children', 'key', 'label', 'title']);
const exempt = (t) =>
  EXEMPT.has(t) || t.startsWith('aria-') || t.includes('...') || !/^[A-Za-z][A-Za-z0-9.]*$/.test(t);

/* 「value / defaultValue」拆分;「rowSelection.type」取末段作匹配词 */
const tokens = (name) =>
  name.split('/').map((s) => s.trim()).filter(Boolean);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const used = (code, t) => {
  const last = t.includes('.') ? t.split('.').pop() : t;
  return new RegExp(`\\b${esc(last)}\\b`).test(code);
};

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle0' });
const groups = await page.evaluate(() => window.__DOCS__);
await browser.close();

if (!Array.isArray(groups)) { console.error('BAD window.__DOCS__ 不可用'); process.exit(1); }

let pages = 0, apis = 0, missing = 0;
for (const g of groups) {
  if (g.guide) continue;
  for (const d of g.items) {
    pages++;
    const rows = [
      ...d.props.map((n) => ({ table: 'Props', n })),
      ...d.events.map((n) => ({ table: 'Events', n })),
      ...d.extraApis.flatMap((x) => x.rows.map((n) => ({ table: x.title, n }))),
    ];
    const miss = [];
    for (const { table, n } of rows) {
      for (const t of tokens(n)) {
        if (exempt(t)) continue;
        apis++;
        if (!used(d.code, t)) miss.push(`${table}: ${t}`);
      }
    }
    if (miss.length) {
      missing += miss.length;
      console.log(`BAD ${d.name}(${d.key})缺 ${miss.length} 项:\n    ${miss.join('\n    ')}`);
    }
  }
}
console.log(`\n${pages} 页 / ${apis} 个 API,缺失 ${missing} 项`);
process.exit(missing ? 1 : 0);
