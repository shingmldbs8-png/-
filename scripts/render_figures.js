// figures.js 의 SVG를 PNG로 변환 → mock_exam/figures/<이름>.png + sizes.json
// 사용법: node scripts/render_figures.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const F = require('./figures');
(async () => {
  const outDir = path.join(__dirname, '..', 'mock_exam', 'figures');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const sizes = {};
  for (const [name, svg] of Object.entries(F)) {
    await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
    const el = await page.$('svg');
    const box = await el.boundingBox();
    await el.screenshot({ path: path.join(outDir, name + '.png') });
    sizes[name] = { w: Math.round(box.width), h: Math.round(box.height) };
  }
  fs.writeFileSync(path.join(outDir, 'sizes.json'), JSON.stringify(sizes, null, 1));
  await browser.close();
  console.log('rendered', Object.keys(sizes).length, 'figures');
})();
