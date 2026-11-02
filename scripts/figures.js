// 모의고사 그림(SVG) 정의. render_figures.js 가 PNG로 변환한다.
// 모든 그림은 개념도(척도 없음)이며 문제의 기호·치수 이름과 맞춰 그렸다.

const INK = '#222';
const BLUE = '#1f4e8c';
const RED = '#c0392b';
const GRAY = '#9aa3ab';
const FONT = "font-family='WenQuanYi Zen Hei, Noto Sans CJK KR, sans-serif'";

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="${INK}"/></marker>
<marker id="arb" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="${BLUE}"/></marker>
<marker id="arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="${RED}"/></marker>
<pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${GRAY}" stroke-width="1.5"/></pattern>
</defs>
<rect width="100%" height="100%" fill="#fff"/>
${body}
</svg>`;

const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${FONT} font-size="${o.size ?? 15}" fill="${o.color ?? INK}" text-anchor="${o.anchor ?? 'middle'}" ${o.bold ? "font-weight='bold'" : ''} ${o.rot ? `transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.color ?? INK}" stroke-width="${o.w ?? 1.6}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} ${o.m ? `marker-end="url(#${o.m})"` : ''} ${o.ms ? `marker-start="url(#${o.ms})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill ?? 'none'}" stroke="${o.color ?? INK}" stroke-width="${o.w ?? 1.8}" ${o.rx ? `rx="${o.rx}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill ?? 'none'}" stroke="${o.color ?? INK}" stroke-width="${o.w ?? 1.8}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>`;
const PATH = (d, o = {}) => `<path d="${d}" fill="${o.fill ?? 'none'}" stroke="${o.color ?? INK}" stroke-width="${o.w ?? 1.8}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>`;
// 치수선: 양쪽 화살표 + 라벨
function dimH(x1, x2, y, label, o = {}) {
  const ext = o.ext ?? null; // [y_from1, y_from2] 보조선 시작점
  let s = '';
  if (ext) { s += L(x1, ext[0], x1, y + (y > ext[0] ? 6 : -6), { w: 1, color: GRAY }); s += L(x2, ext[1], x2, y + (y > ext[1] ? 6 : -6), { w: 1, color: GRAY }); }
  s += L(x1, y, x2, y, { w: 1.2, m: o.blue ? 'arb' : 'ar', ms: o.blue ? 'arb' : 'ar', color: o.blue ? BLUE : INK });
  s += t((x1 + x2) / 2, y - 6, label, { size: o.size ?? 14, color: o.blue ? BLUE : INK, bold: o.bold });
  return s;
}
function dimV(y1, y2, x, label, o = {}) {
  const ext = o.ext ?? null;
  let s = '';
  if (ext) { s += L(ext[0], y1, x + (x > ext[0] ? 6 : -6), y1, { w: 1, color: GRAY }); s += L(ext[1], y2, x + (x > ext[1] ? 6 : -6), y2, { w: 1, color: GRAY }); }
  s += L(x, y1, x, y2, { w: 1.2, m: o.blue ? 'arb' : 'ar', ms: o.blue ? 'arb' : 'ar', color: o.blue ? BLUE : INK });
  s += t(x + (o.left ? -8 : 8), (y1 + y2) / 2 + 5, label, { size: o.size ?? 14, anchor: o.left ? 'end' : 'start', color: o.blue ? BLUE : INK, bold: o.bold });
  return s;
}
// 기하공차 기입틀
function fcf(x, y, cells, h = 26) {
  let s = ''; let cx = x;
  cells.forEach((c) => {
    const w = Math.max(30, c.length * 11 + 14);
    s += R(cx, y, w, h, { w: 1.4 }); s += t(cx + w / 2, y + h / 2 + 5, c, { size: 14 }); cx += w;
  });
  return s;
}
// 데이텀 기호 (삼각형 + 네모 문자)
function datum(x, y, ch, dir = 'down') {
  // (x,y)는 형체에 붙는 삼각형 밑변 중심
  const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir];
  const px = -d[1], py = d[0];
  const tri = `M${x + px * 8},${y + py * 8} L${x - px * 8},${y - py * 8} L${x + d[0] * 12},${y + d[1] * 12} z`;
  const bx = x + d[0] * 32, by = y + d[1] * 32;
  return PATH(tri, { fill: INK, w: 1 }) + L(x + d[0] * 12, y + d[1] * 12, bx - d[0] * 12, by - d[1] * 12, { w: 1.4 })
    + R(bx - 12, by - 12, 24, 24, { w: 1.4 }) + t(bx, by + 6, ch, { size: 15, bold: true });
}
const hatchRect = (x, y, w, h) => R(x, y, w, h, { fill: 'url(#hatch)', w: 1.4 });

// ---------------------------------------------------------------- 그림들
const F = {};

// 수준기로 두 구멍의 평행도
F.level = svg(640, 270, [
  hatchRect(160, 205, 320, 26), t(320, 252, '정반', { size: 13 }),
  R(230, 70, 180, 135, { fill: '#f4f6f8' }), t(320, 196, '부품', { size: 13 }),
  // 심봉 (구멍에 끼운 막대) 측면
  R(60, 98, 520, 16, { fill: '#e3e8ee' }), R(60, 158, 520, 16, { fill: '#e3e8ee' }),
  C(320, 106, 12, { dash: '4 3' }), C(320, 166, 12, { dash: '4 3' }),
  // 수준기
  R(90, 74, 110, 24, { fill: '#fff8d6', rx: 4 }), C(145, 86, 6, { fill: '#9bd' }), t(145, 66, '수준기 t₁', { size: 13, color: BLUE }),
  R(440, 134, 110, 24, { fill: '#fff8d6', rx: 4 }), C(495, 146, 6, { fill: '#9bd' }), t(495, 128, '수준기 t₀', { size: 13, color: BLUE }),
  t(600, 110, '측정 구멍', { size: 12, anchor: 'end' }), t(600, 192, '데이텀 A 구멍', { size: 12, anchor: 'end' }),
  t(30, 112, '심봉', { size: 12 }), t(30, 172, '심봉', { size: 12 }),
  dimH(60, 580, 30, 'L (심봉 위 수준기 사이 기준 길이)', { size: 13 }),
].join(''));

// 게이지블록 비교측정
F.gaugeBlock = svg(640, 290, [
  hatchRect(40, 240, 560, 24), t(320, 284, '정반', { size: 13 }),
  // 계단 부품: A=10, B=30, C=40, D=50 (높이 비율 3px/mm)
  PATH('M330,240 L330,210 L380,210 L380,150 L430,150 L430,120 L480,120 L480,90 L530,90 L530,240 z', { fill: '#f4f6f8' }),
  dimV(240, 210, 352, 'A', { bold: true }), dimV(240, 150, 402, 'B', { bold: true }), dimV(240, 120, 452, 'C', { bold: true }), dimV(240, 90, 502, 'D', { bold: true }),
  // 게이지블록 스택
  R(90, 120, 70, 120, { fill: '#e9eef5' }), L(90, 180, 160, 180, { w: 1 }), t(125, 215, '30', { size: 13 }), t(125, 155, '10', { size: 13 }),
  t(125, 110, '게이지블록', { size: 13 }), t(125, 95, '(최소 개수 조합)', { size: 11 }),
  // 인디케이터
  L(250, 40, 250, 230, { w: 4, color: GRAY }), R(200, 40, 70, 18, { fill: GRAY, color: GRAY }),
  L(250, 70, 300, 70, { w: 3 }), C(300, 70, 20, { fill: '#fff' }), L(300, 70, 312, 60, { w: 1.5, color: RED }), L(320, 70, 340, 88, { w: 2 }),
  t(300, 30, '다이얼테스트인디케이터', { size: 12 }), t(272, 225, '스탠드', { size: 11, anchor: 'start' }),
  L(160, 120, 330, 210, { dash: '5 4', w: 1, color: BLUE }), t(210, 150, '0점 → 비교', { size: 12, color: BLUE }),
].join(''));

// 투영기 동심도: X1~X4, Y1~Y4
F.concentric = svg(620, 380, [
  C(250, 190, 140), C(250, 190, 60, { fill: '#f4f6f8' }), t(250, 196, '데이텀 A', { size: 13, bold: true }), t(250, 214, 'φ15±0.005', { size: 12 }),
  t(120, 30, '바깥 원 φ35±0.01', { size: 13 }),
  L(70, 190, 440, 190, { dash: '10 4 2 4', w: 1, color: GRAY }), L(250, 20, 250, 360, { dash: '10 4 2 4', w: 1, color: GRAY }),
  ...[[110, 'X1'], [190, 'X2'], [310, 'X3'], [390, 'X4']].map(([x, s]) => L(x, 190, x, 372, { w: 1, color: BLUE, dash: '3 3' }) + t(x, 376 - 4, s, { size: 13, color: BLUE, bold: true })),
  ...[[330, 'Y1'], [250, 'Y2'], [130, 'Y3'], [50, 'Y4']].map(([y, s]) => L(250, y, 470, y, { w: 1, color: RED, dash: '3 3' }) + t(492, y + 5, s, { size: 13, color: RED, bold: true })),
  fcf(430, 270, ['◎', 'φ0.02 Ⓜ', 'A']), L(430, 283, 372, 250, { w: 1.2, m: 'ar' }),
  t(540, 150, '좌표는 스테이지', { size: 12 }), t(540, 168, '카운터로 읽음', { size: 12 }),
].join(''));

// 3차원 측정기 위치도
F.cmmPosition = svg(640, 330, [
  R(60, 40, 520, 250, { fill: '#f7f9fb' }),
  C(140, 220, 26, { fill: '#fff' }), t(140, 268, '데이텀 A  φ12±0.05', { size: 13 }), L(140, 220, 140, 220),
  // 홈 B (아랫변에서 파인 홈)
  PATH('M440,290 L440,240 L470,240 L470,290', { fill: '#fff' }), t(455, 312, '데이텀 B 홈 폭 8 +0.05/0', { size: 13 }),
  C(140, 220, 2, { fill: INK }),
  C(330, 120, 22, { fill: '#fff' }), C(330, 120, 2, { fill: INK }), t(330, 160, '#1  φ10±0.05', { size: 13, bold: true }),
  L(140, 220, 455, 220, { dash: '8 4', w: 1, color: GRAY }), L(140, 220, 140, 70, { dash: '8 4', w: 1, color: GRAY }),
  dimH(140, 330, 66, '30', { blue: true }), R(222, 46, 34, 20, { color: BLUE, w: 1 }),
  dimV(220, 120, 104, '25', { blue: true, left: true }), R(66, 158, 30, 20, { color: BLUE, w: 1 }),
  fcf(370, 88, ['⌖', 'φ0.05 Ⓜ', 'A Ⓜ', 'B Ⓜ']), L(370, 101, 350, 108, { w: 1.2, m: 'ar' }),
  t(600, 60, '□ = 이론적으로', { size: 11, anchor: 'end', color: BLUE }), t(600, 76, '정확한 치수', { size: 11, anchor: 'end', color: BLUE }),
].join(''));

// 탭 위치도
(() => {
  const cx = 230, cy = 170, R0 = 120, Rb = 55;
  let tabs = '';
  for (let i = 0; i < 11; i++) {
    const a = (i * 360) / 11;
    tabs += `<g transform="rotate(${a} ${cx} ${cy})">${R(cx - 12, cy - R0 - 26, 24, 30, { fill: '#e9eef5' })}</g>`;
  }
  F.tab = svg(620, 370, [`<g transform="translate(0,30)">`,
    tabs, C(cx, cy, R0, { fill: '#f4f6f8' }), C(cx, cy, Rb, { fill: '#fff' }),
    // 키홈
    R(cx - 10, cy - Rb - 12, 20, 14, { fill: '#fff' }),
    t(cx, cy + 6, '데이텀 B', { size: 13, bold: true }), t(cx, cy + 24, 'φ30.0~30.2', { size: 12 }),
    dimH(cx - 12, cx + 12, cy - R0 - 40, '7.8~8.0', { size: 12 }),
    fcf(380, 40, ['⌖', '0.4 Ⓜ', 'A', 'B Ⓜ']), L(380, 53, cx + 16, cy - R0 - 16, { w: 1.2, m: 'ar' }),
    t(480, 110, '탭(돌기) 11개', { size: 13 }), t(480, 130, '= 외측형체', { size: 13, color: RED }),
    t(480, 170, '구멍 B', { size: 13 }), t(480, 190, '= 내측형체', { size: 13, color: BLUE }),
    t(480, 240, '데이텀 A = 앞면', { size: 12 }), '</g>',
  ].join(''));
})();

// 현과 높이 → 반경
F.chord = svg(560, 270, [
  PATH('M60,220 A260,260 0 0 1 500,220', { w: 2.2 }),
  L(60, 220, 500, 220, { w: 1.4, color: BLUE }), t(280, 244, '현 c', { size: 15, color: BLUE, bold: true }),
  L(280, 220, 280, 120, { w: 1.4, color: RED, m: 'arr', ms: 'arr' }), t(292, 176, 'h', { size: 16, color: RED, bold: true, anchor: 'start' }),
  L(280, 220, 280, 262, { dash: '6 4', w: 1, color: GRAY }), t(110, 40, 'R = (h² + (c/2)²) ÷ 2h', { size: 15, bold: true }),
  dimH(60, 280, 205, 'c/2', { size: 13 }),
].join(''));

// 3발 곡률게이지
F.threeLeg = svg(560, 260, [
  PATH('M40,210 A300,300 0 0 1 520,210', { w: 2.2 }), t(500, 236, '측정면(곡면)', { size: 12, anchor: 'end' }),
  R(140, 50, 280, 30, { fill: '#e9eef5' }), t(280, 40, '3발 곡률게이지', { size: 13 }),
  L(160, 80, 160, 148, { w: 4 }), L(400, 80, 400, 148, { w: 4 }), L(280, 80, 280, 120, { w: 4, color: RED }),
  dimH(160, 400, 235, 'L (양쪽 다리 사이)', { size: 13 }), L(160, 148, 160, 240, { dash: '4 3', w: 1, color: GRAY }), L(400, 148, 400, 240, { dash: '4 3', w: 1, color: GRAY }),
  L(300, 148, 300, 120, { w: 1.2, color: RED, m: 'arr', ms: 'arr' }), t(310, 140, 'h', { size: 15, color: RED, bold: true, anchor: 'start' }),
  L(150, 148, 410, 148, { dash: '4 3', w: 1, color: BLUE }),
].join(''));

// 옵티컬플랫 + 게이지블록 + 핀게이지
F.flatPin = svg(640, 310, [
  R(40, 210, 560, 20, { fill: '#dff0f7' }), t(600, 250, '옵티컬플랫(아래)', { size: 13, anchor: 'end' }),
  R(120, 110, 90, 100, { fill: '#e9eef5' }), t(165, 168, '블록 H', { size: 13, bold: true }),
  C(480, 160, 50, { fill: '#f4f6f8' }), t(480, 165, '핀 D', { size: 13, bold: true }),
  PATH('M90,104 L560,114 L560,96 L90,86 z', { fill: '#dff0f7' }), t(330, 82, '옵티컬플랫(위)', { size: 13 }),
  ...[130, 145, 160, 175, 190, 200].map((x) => L(x, 104, x, 110, { color: RED, w: 1.4 })), t(160, 128 - 26, '', {}),
  t(250, 140, '간섭무늬 n개', { size: 12, color: RED, anchor: 'start' }), L(248, 136, 205, 112, { w: 1, color: RED, m: 'arr' }),
  dimH(120, 210, 62, 'W', { bold: true }), L(120, 110, 120, 56, { w: 1, color: GRAY }), L(210, 110, 210, 56, { w: 1, color: GRAY }),
  dimH(165, 480, 290, 'L (블록 중심~핀 중심)', { size: 13 }), L(165, 210, 165, 296, { w: 1, color: GRAY }), L(480, 210, 480, 296, { w: 1, color: GRAY }),
  t(600, 160, 'X = 높이차', { size: 13, anchor: 'end', color: BLUE }),
].join(''));

// 구면 위 옵티컬플랫 간섭무늬
F.sphereFringe = svg(620, 260, [
  ...[1, 2, 3, 4].map((n) => C(150, 130, 28 * Math.sqrt(n), { color: RED, w: 1.4 })),
  C(150, 130, 2, { fill: INK }), L(150, 130, 150 + 56, 130, { w: 1.4, color: BLUE, m: 'arb' }), t(176, 124, 'r', { size: 15, color: BLUE, bold: true }),
  t(150, 230, '위에서 본 간섭무늬', { size: 13 }), t(150, 250, '(중심에서 n번째 무늬 반경 r)', { size: 12 }),
  PATH('M330,200 A300,300 0 0 1 590,200', { w: 2, fill: '#f4f6f8' }), L(310, 172, 610, 172, { w: 3, color: '#6aaed6' }), t(460, 160, '옵티컬플랫', { size: 12 }),
  L(460, 172, 460, 184, { w: 1.2, color: RED }), t(470, 192, 'h = n × λ/2', { size: 13, color: RED, anchor: 'start' }),
  t(460, 240, '옆에서 본 모습 (구면)', { size: 13 }),
].join(''));

// 오토콜리메이터 진직도
F.autocollimator = svg(680, 230, [
  hatchRect(120, 150, 520, 24), t(380, 196, '공작기계 베드 (측정면)', { size: 13 }),
  R(20, 90, 80, 50, { fill: '#e9eef5' }), t(60, 158, '오토콜리메이터', { size: 12 }),
  L(100, 115, 600, 115, { dash: '6 4', w: 1, color: RED }),
  R(250, 100, 18, 40, { fill: '#dff0f7' }), L(250, 140, 250, 150, { w: 3 }), L(330, 140, 330, 150, { w: 3 }), L(250, 140, 330, 140, { w: 3 }),
  t(290, 92, '반사경 (발 간격 100 mm)', { size: 12 }),
  ...[0, 1, 2, 3, 4, 5].map((i) => L(130 + i * 100, 174, 130 + i * 100, 184, { w: 1.4 }) + t(130 + i * 100, 222, String(i), { size: 13, bold: true })),
  t(130, 205, '측정점 →', { size: 12, anchor: 'end' }),
].join(''));

// 정반 평면도 ABCD
F.surfacePlate = svg(580, 330, [
  R(80, 50, 360, 240, { fill: '#f4f6f8' }),
  L(80, 290, 440, 50, { color: BLUE, w: 1.4 }), L(440, 290, 80, 50, { color: BLUE, w: 1.4 }),
  C(80, 290, 5, { fill: INK }), C(440, 290, 5, { fill: INK }), C(440, 50, 5, { fill: INK }), C(80, 50, 5, { fill: INK }),
  C(260, 290, 5, { fill: INK }), C(440, 170, 5, { fill: INK }), C(260, 50, 5, { fill: INK }), C(80, 170, 5, { fill: INK }), C(260, 170, 6, { fill: RED, color: RED }),
  t(64, 310, 'A', { size: 18, bold: true }), t(458, 310, 'B', { size: 18, bold: true }), t(458, 42, 'C', { size: 18, bold: true }), t(64, 42, 'D', { size: 18, bold: true }),
  t(260, 316, 'E', { size: 16, bold: true }), t(462, 176, 'F', { size: 16, bold: true }), t(260, 40, 'G', { size: 16, bold: true }), t(58, 176, 'H', { size: 16, bold: true }),
  t(282, 166, 'X', { size: 17, bold: true, color: RED }),
  t(470, 120, '측정선 6개:', { size: 12, anchor: 'start' }), t(470, 138, '대각선 2', { size: 12, anchor: 'start' }), t(470, 156, '변 4', { size: 12, anchor: 'start' }),
].join(''));

// 나사 피치 (투영기)
(() => {
  let d = 'M40,190';
  for (let i = 0; i < 7; i++) { const x = 40 + i * 80; d += ` L${x + 40},110 L${x + 80},190`; }
  const marks = [0, 1, 2, 3, 4, 5].map((i) => {
    const x = 80 + i * 80;
    return L(x, 90, x, 210, { dash: '4 3', w: 1, color: BLUE }) + t(x, 230, `A${'₀₁₂₃₄₅'[i]}`, { size: 14, color: BLUE, bold: true });
  });
  F.thread = svg(640, 260, [PATH(d, { w: 2.2, fill: '#f4f6f8' }), ...marks,
    dimH(80, 160, 70, 'P', { bold: true }), t(560, 70, '십자선을 나사산에', { size: 12 }), t(560, 88, '차례로 맞춰 이송량 읽기', { size: 12 })].join(''));
})();

// 기어 물림 그래프
(() => {
  const v = [0, 3, 1, 4, 6, 2, 5, 8, 7, 3, 1, 2, 0];
  const x0 = 70, y0 = 230, sx = 40, sy = 22;
  let grid = '';
  for (let i = 0; i <= 12; i++) grid += L(x0 + i * sx, y0, x0 + i * sx, y0 - 9 * sy, { w: 0.6, color: '#ddd' }) + t(x0 + i * sx, y0 + 20, String(i), { size: 12 });
  for (let j = 0; j <= 9; j++) grid += L(x0, y0 - j * sy, x0 + 12 * sx, y0 - j * sy, { w: 0.6, color: '#ddd' }) + t(x0 - 10, y0 - j * sy + 5, String(j), { size: 11, anchor: 'end' });
  const pts = v.map((y, i) => `${x0 + i * sx},${y0 - y * sy}`).join(' ');
  F.gearChart = svg(620, 280, [grid, L(x0, y0, x0 + 12 * sx + 10, y0, { w: 1.4 }), L(x0, y0, x0, y0 - 9 * sy - 10, { w: 1.4 }),
    `<polyline points="${pts}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`,
    ...v.map((y, i) => C(x0 + i * sx, y0 - y * sy, 3.5, { fill: BLUE, color: BLUE })),
    t(x0 + 6 * sx, y0 + 42, '잇수', { size: 13 }), t(26, 120, '변동 (µm)', { size: 13, rot: -90 })].join(''));
})();

// 3차원 데이텀 블록 (등각) — (-1,-1,+1) 방향에서 본 모습: X는 오른쪽 위, Y는 왼쪽 위, Z는 위
function isoBlock(opts) {
  const ox = 290, oy = 320;
  const P2 = (x, y, z) => [ox + (x - y) * 0.866, oy - (x + y) * 0.5 - z];
  const pt = (p) => p.join(',');
  const X = 200, Y = 150, Z = 110;
  const poly = (ps, fill) => `<polygon points="${ps.map(pt).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>`;
  let s = '';
  s += poly([P2(0, 0, Z), P2(X, 0, Z), P2(X, Y, Z), P2(0, Y, Z)], '#f4f6f8');          // 윗면
  s += poly([P2(0, 0, 0), P2(0, Y, 0), P2(0, Y, Z), P2(0, 0, Z)], '#dfe6ee');          // x=0 (B, 왼쪽 면)
  s += poly([P2(0, 0, 0), P2(X, 0, 0), P2(X, 0, Z), P2(0, 0, Z)], '#e9eef5');          // y=0 (C, 앞면)
  const hc = P2(X * 0.55, Y * 0.55, Z);
  s += `<ellipse cx="${hc[0]}" cy="${hc[1]}" rx="24" ry="13" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  s += t(hc[0], hc[1] - 20, opts.hole, { size: 13, bold: true });
  const lb = (p, txt, o = {}) => t(p[0], p[1], txt, { size: 14, bold: true, color: BLUE, ...o });
  const pb = P2(0, Y * 0.5, Z * 0.45); s += lb([pb[0], pb[1]], opts.B);
  const pc = P2(X * 0.5, 0, Z * 0.45); s += lb([pc[0], pc[1]], opts.C);
  // 바닥면 A (보이지 않음) 표시
  const pa = P2(X * 0.5, 0, 0);
  s += L(pa[0] + 40, pa[1] + 40, pa[0] + 4, pa[1] + 4, { w: 1.2, color: BLUE, m: 'arb' }) + lb([pa[0] + 46, pa[1] + 56], opts.A, { anchor: 'start' });
  if (opts.axes) {
    const og = P2(0, 0, 0);
    const ax = (to, lab, dx, dy) => L(og[0], og[1], to[0], to[1], { w: 2.6, color: RED, m: 'arr' }) + t(to[0] + dx, to[1] + dy, lab, { size: 18, bold: true, color: RED });
    s += ax(P2(X + 60, 0, 0), 'X', 14, 4) + ax(P2(0, Y + 60, 0), 'Y', -14, 4) + ax(P2(0, 0, Z + 70), 'Z', 0, -8);
    s += C(og[0], og[1], 5, { fill: RED, color: RED }) + t(og[0], og[1] + 22, '원점', { size: 13, color: RED, bold: true });
  }
  return svg(600, 400, s + (opts.note ? t(300, 392, opts.note, { size: 12 }) : ''));
}
F.dof = isoBlock({ hole: 'E (Z방향 구멍)', A: 'A = 바닥면 (X-Y)', B: 'B = 왼쪽 면 (Y-Z)', C: 'C = 앞면 (X-Z)' });
F.dofAxes = isoBlock({ hole: 'E (Z방향 구멍)', A: 'A = 바닥면 (X-Y)', B: 'B = 왼쪽 면 (Y-Z)', C: 'C = 앞면 (X-Z)', axes: true, note: '원점 = A·B·C 세 면의 교점 · 오른손 법칙 (엄지 X, 검지 Y, 중지 Z)' });

// 핀 2개 중심거리 (버니어 Lo/Li)
F.pins = svg(620, 250, [
  R(60, 150, 500, 50, { fill: '#f4f6f8' }), t(310, 225, '판', { size: 12 }),
  C(180, 110, 40, { fill: '#e9eef5' }), C(420, 110, 50, { fill: '#e9eef5' }), C(180, 110, 2, { fill: INK }), C(420, 110, 2, { fill: INK }),
  t(180, 116, 'd₁', { size: 15, bold: true }), t(420, 116, 'd₂', { size: 15, bold: true }),
  dimH(140, 470, 40, 'Lₒ (바깥쪽 거리)', { ext: [110, 110] }),
  dimH(220, 370, 110, 'Lᵢ', { size: 14 }),
  dimH(180, 420, 140, 'C (중심거리)', { blue: true, size: 13 }),
].join(''));

// 두 핀 함께 물린 M (마이크로미터)
F.pinsM = svg(560, 230, [
  R(40, 70, 40, 60, { fill: '#d5dbe2' }), t(60, 150, '앤빌', { size: 12 }),
  R(480, 70, 60, 60, { fill: '#d5dbe2' }), t(510, 150, '스핀들', { size: 12 }),
  C(150, 100, 70, { fill: '#e9eef5' }), C(390, 100, 90, { fill: '#e9eef5' }),
  t(150, 106, 'd₁', { size: 15, bold: true }), t(390, 106, 'd₂', { size: 15, bold: true }),
  dimH(80, 480, 214, 'M (두 핀을 함께 물린 치수)', { size: 13 }),
].join(''));

// 마이크로미터 눈금 (슬리브 + 딤블)
function micrometer(mm, half, thimble) {
  // mm: 슬리브에서 보이는 마지막 정수 눈금, half: 0.5 눈금 보임 여부, thimble: 기준선에 걸린 딤블 눈금(소수 가능)
  const y0 = 120, sx = 26, tx = 360;
  const xOf = (v) => tx - 8 - (half ? sx / 2 : 0) - (mm - v) * sx;
  let s = R(30, y0 - 30, tx - 30, 60, { fill: '#eef1f4' }) + L(30, y0, tx, y0, { w: 1.6 });
  for (let v = mm; v >= 0; v--) {
    const x = xOf(v); if (x < 40) break;
    s += L(x, y0, x, y0 - 16, { w: 1.4 });
    if (v % 5 === 0 || v === mm) s += t(x, y0 - 21, String(v), { size: 12, bold: v === mm });
    if (v < mm || half) { const xh = x + sx / 2; s += L(xh, y0, xh, y0 + 12, { w: 1.4 }); }
  }
  s += R(tx, y0 - 70, 140, 140, { fill: '#dfe6ee', rx: 6 });
  const step = 10;
  for (let k = -7; k <= 7; k++) {
    const val = Math.round(thimble) + k;
    const y = y0 - (val - thimble) * step;
    if (y < y0 - 66 || y > y0 + 66) continue;
    const vv = ((val % 50) + 50) % 50;
    s += L(tx, y, tx + (vv % 5 === 0 ? 22 : 14), y, { w: 1.3 });
    if (vv % 5 === 0) s += t(tx + 40, y + 5, String(vv), { size: 12 });
  }
  s += L(30, y0, tx + 26, y0, { w: 1.2, color: RED, dash: '5 3' }) + t(tx + 130, y0 + 5, '◀ 기준선', { size: 12, color: RED, anchor: 'end' });
  s += t(190, 62, '슬리브 (위: 1 mm, 아래: 0.5 mm)', { size: 12 }) + t(tx + 70, y0 + 92, '딤블 (1칸 0.01 mm)', { size: 12 });
  return svg(520, 230, s);
}
F.micReading12875 = micrometer(12, true, 37.5);
F.micReading24512 = micrometer(24, true, 1.2);

// 하이트 마이크로미터 구멍 중심 높이 + 대칭도
F.height = svg(660, 290, [
  hatchRect(20, 240, 330, 22), t(185, 282, '정반', { size: 12 }),
  R(60, 80, 200, 160, { fill: '#f4f6f8' }), C(160, 150, 40, { fill: '#fff' }),
  L(160, 190, 300, 190, { dash: '4 3', w: 1, color: GRAY }), L(160, 110, 330, 110, { dash: '4 3', w: 1, color: GRAY }),
  dimV(240, 190, 296, 'H₁', { bold: true }), dimV(240, 110, 326, 'H₂', { bold: true }),
  L(160, 150, 360, 150, { dash: '8 3 2 3', w: 1, color: BLUE }), t(200, 144, '중심 = (H₁+H₂)/2', { size: 12, color: BLUE, anchor: 'start' }),
  // 대칭도
  hatchRect(400, 240, 240, 22),
  PATH('M440,240 L440,120 L500,120 L500,90 L560,90 L560,120 L600,120 L600,240 z', { fill: '#f4f6f8' }),
  dimV(240, 120, 620, 'a', { bold: true }), t(520, 80, '돌기', { size: 12 }),
  t(520, 282, '한쪽 면 측정 → 뒤집어 반대쪽 b → 대칭도 = |a − b|', { size: 11 }),
].join(''));

// 투영기: 원 지름·중심, 각도
F.projector = svg(660, 270, [
  C(130, 130, 70, { fill: '#f4f6f8' }), L(40, 130, 230, 130, { dash: '8 3 2 3', w: 1, color: GRAY }),
  L(60, 130, 60, 240, { w: 1, dash: '3 3', color: BLUE }), L(200, 130, 200, 240, { w: 1, dash: '3 3', color: BLUE }),
  t(60, 258, 'X1', { size: 13, bold: true, color: BLUE }), t(200, 258, 'X2', { size: 13, bold: true, color: BLUE }),
  t(130, 40, '지름 = X2 − X1', { size: 12 }), t(130, 56, '중심 = (X1 + X2)/2', { size: 12 }),
  // 각도
  L(340, 220, 600, 220, { w: 2.2 }), L(340, 220, 470, 40, { w: 2.2 }),
  PATH('M410,220 A70,70 0 0 0 381,163', { color: RED, w: 1.6 }), t(420, 186, 'θ', { size: 16, color: RED, bold: true }),
  t(520, 140, '스크린 각도 눈금을', { size: 12 }), t(520, 158, '한 변 → 다른 변에 맞춰', { size: 12 }), t(520, 176, '읽은 값의 차', { size: 12 }),
].join(''));

// 마이크로미터 교정 (옵티컬플랫·패러렐)
F.micCalib = svg(660, 240, [
  R(40, 90, 70, 70, { fill: '#d5dbe2' }), t(75, 180, '앤빌', { size: 12 }),
  R(110, 95, 16, 60, { fill: '#dff0f7' }), t(118, 80, '옵티컬플랫', { size: 12 }),
  ...[1, 2].map((n) => `<ellipse cx="118" cy="125" rx="${4 * n}" ry="${12 * n}" fill="none" stroke="${RED}" stroke-width="1.2"/>`),
  t(160, 220, '① 평면도: 측정면에 플랫을 대고 무늬 수 n × 0.3 µm', { size: 12, anchor: 'start' }),
  R(330, 90, 70, 70, { fill: '#d5dbe2' }), R(400, 92, 30, 66, { fill: '#dff0f7' }), R(430, 90, 120, 70, { fill: '#d5dbe2' }),
  t(365, 180, '앤빌', { size: 12 }), t(415, 80, '옵티컬패러렐', { size: 12 }), t(490, 180, '스핀들', { size: 12 }),
  t(490, 40, '② 평행도: 두께 다른 4장을', { size: 12 }), t(490, 58, '물려 (앤빌 + 스핀들) 무늬 합', { size: 12 }),
].join(''));

// 실린더 게이지 기준 잡기
F.cylinderGauge = svg(620, 220, [
  R(40, 70, 60, 70, { fill: '#d5dbe2' }), R(200, 70, 80, 70, { fill: '#d5dbe2' }), t(160, 60, '외측 마이크로미터 32.000', { size: 12 }),
  L(100, 105, 200, 105, { w: 4, color: BLUE }), t(150, 160, '① 기준치수에서 0점', { size: 12 }),
  R(360, 50, 220, 120, { fill: '#f4f6f8' }), R(380, 80, 180, 60, { fill: '#fff' }), L(390, 110, 550, 110, { w: 4, color: BLUE }),
  t(470, 190, '② 구멍에 넣고 반전점에서 읽기', { size: 12 }), t(470, 208, 'D = 기준 − 바늘(+)', { size: 12, color: RED }),
].join(''));

// 큐넷형 과제1 부품도 (L1, L2, L3, V1, K1, A1)
F.task1 = svg(660, 330, [
  PATH('M80,260 L80,120 L330,120 L330,170 L560,170 L560,260 z', { fill: '#f4f6f8' }),
  // 홈 V1 (위에서 파인 홈) 과 깊이 K1
  PATH('M150,120 L150,190 L230,190 L230,120', { fill: '#fff' }),
  // 보스 A1
  R(420, 130, 60, 40, { fill: '#e9eef5' }),
  dimH(80, 330, 300, 'L1', { bold: true, ext: [260, 175] }),
  dimH(80, 560, 322, 'L2', { bold: true, ext: [260, 260] }),
  dimH(330, 560, 88, 'L3', { bold: true, ext: [170, 170] }),
  dimH(150, 230, 100, 'V1 (내측)', { size: 13 }),
  dimV(120, 190, 250, 'K1 (깊이)', { size: 13 }),
  dimH(420, 480, 120, 'φA1', { size: 13 }),
  t(560, 40, '※ 치수 이름만 표시한 개념도', { size: 12, anchor: 'end' }),
].join(''));

// 큐넷형 과제7 부품도
(() => {
  const k = 2.2, ox = 250, oy = 330; // 1 mm = 2.2 px, 원점 = 왼쪽 아래 모서리
  const X = (x) => ox + x * k, Y = (y) => oy - y * k;
  const outline = `M${X(0)},${Y(0)} L${X(52)},${Y(0)} L${X(52)},${Y(15)} L${X(68)},${Y(15)} L${X(68)},${Y(0)} L${X(120)},${Y(0)} L${X(120)},${Y(100)} L${X(0)},${Y(100)} L${X(0)},${Y(75)} L${X(20)},${Y(75)} L${X(20)},${Y(45)} L${X(0)},${Y(45)} z`;
  const body = [
    PATH(outline, { fill: '#f4f6f8' }), C(X(60), Y(45), 10 * k, { fill: '#fff' }), C(X(60), Y(45), 2, { fill: INK }),
    L(X(60), Y(-6), X(60), Y(106), { dash: '10 3 2 3', w: 1, color: GRAY }), L(X(-6), Y(60), X(26), Y(60), { dash: '10 3 2 3', w: 1, color: GRAY }),
    datum(X(30), Y(0), 'B', 'down'), datum(X(0), Y(20), 'C', 'left'),
    t(X(120) + 8, Y(-14), 'D = 전체 폭 120의 중심면', { size: 12, color: BLUE, anchor: 'start' }),
    t(X(60), Y(7) + 5, '㉠', { size: 14, bold: true, color: RED }), t(X(10), Y(60) + 5, '㉡', { size: 14, bold: true, color: RED }),
    t(X(60) + 14, Y(45) - 8, '㉢', { size: 14, bold: true, color: RED }), t(X(100), Y(100) - 8, '㉣', { size: 14, bold: true, color: RED }),
    // 이론 치수 (파랑)
    dimV(Y(0), Y(60), X(-6) - 60, '60', { blue: true, left: true }),
    dimV(Y(0), Y(45), X(120) + 24, '45', { blue: true }), dimV(Y(0), Y(100), X(120) + 64, '100', { blue: true }),
    dimH(X(0), X(60), Y(100) - 22, '60', { blue: true }), dimH(X(0), X(120), Y(100) - 48, '120', { size: 13 }),
    // 기입틀 + 지시선
    fcf(X(70), Y(0) + 40, ['≡', '0 Ⓜ', 'A', 'D']), L(X(70), Y(0) + 53, X(66), Y(10), { w: 1.2, m: 'ar' }),
    fcf(X(-6) - 200, Y(100) - 10, ['⌖', '0.2 Ⓜ', 'A', 'B']), L(X(-6) - 60, Y(100) + 16, X(14), Y(70), { w: 1.2, m: 'ar' }),
    fcf(X(120) + 92, Y(84), ['⌖', '∅0.2 Ⓜ', 'A', 'B', 'C']), L(X(120) + 92, Y(84) + 13, X(68), Y(51), { w: 1.2, m: 'ar' }),
    fcf(X(70), Y(100) - 92, ['⌓', '0.4', 'A', 'B']), L(X(80), Y(100) - 66, X(96), Y(100), { w: 1.2, m: 'ar' }),
  ];
  const notes = [
    '데이텀 A = 앞면(종이 면)', '파란 치수 = 이론적으로 정확한 치수', '홈 ㉠ 16±0.2 (아랫면)', '홈 ㉡ 30±0.2 (왼쪽 면)', '구멍 ㉢ ∅20±0.1', '㉣ 윗면 윤곽도',
  ].map((s2, i) => t(20, 40 + i * 18, s2, { size: 12, anchor: 'start', color: i === 1 ? BLUE : INK }));
  F.task7 = svg(820, 480, `<g transform="translate(0,50)">${body.join('')}</g>` + `<g transform="translate(600,10)">${notes.join('')}</g>`);
})();

// 1회 3번 해설: 두 중심의 차이 → 피타고라스 → ×2
(() => {
  const k = 15, ax = 330, ay = 170; // 1 µm = 15 px
  const ox = ax - 3 * k, oy = ay + 9 * k;
  const r = Math.sqrt(90) * k;
  F.concentricSol = svg(680, 400, [
    C(ax, ay, r, { color: BLUE, dash: '6 4', w: 1.4 }),
    t(ax + r * 0.72 + 6, ay - r * 0.72, '공차역 원: 지름 = 2e', { size: 13, color: BLUE, anchor: 'start' }),
    L(ox, oy, ax, oy, { w: 1.6, color: RED }), L(ax, oy, ax, ay, { w: 1.6, color: RED }),
    L(ax, ay, ox, oy, { w: 2.2 }),
    C(ax, ay, 6, { fill: BLUE, color: BLUE }), C(ox, oy, 6, { fill: INK }),
    t(ax + 10, ay - 10, '데이텀 A 중심 (27.502, 27.502)', { size: 13, color: BLUE, anchor: 'start', bold: true }),
    t(ox - 10, oy + 24, '바깥 원 중심 (27.499, 27.493)', { size: 13, anchor: 'middle', bold: true }),
    t((ox + ax) / 2, oy - 8, 'ΔX = 0.003', { size: 14, color: RED, bold: true }),
    t(ax + 8, (ay + oy) / 2 + 30, 'ΔY = 0.009', { size: 14, color: RED, bold: true, anchor: 'start' }),
    t((ox + ax) / 2 - 16, (ay + oy) / 2, 'e', { size: 18, bold: true, anchor: 'end' }),
    t(20, 30, 'e = √(ΔX² + ΔY²) = √(0.003² + 0.009²) = 0.00949', { size: 14, anchor: 'start' }),
    t(20, 52, '동심도 = 2 × e = 0.019  (중심이 e 벗어나면 그 점을 담는 원의 지름은 2e)', { size: 14, anchor: 'start' }),
    t(660, 390, '(1 µm 단위를 크게 확대한 그림)', { size: 11, anchor: 'end', color: GRAY }),
  ].join(''));
})();

// 1회 9번 해설: 누적 곡선 · 양단 기준선 · 벗어난 양
(() => {
  const cum = [0, 2, 1, 4, 5, 3];
  const x0 = 70, y0 = 300, sx = 100, sy = 45; // 1 µm = 45 px
  const P2 = (i, v) => [x0 + i * sx, y0 - v * sy];
  let g = '';
  for (let v = -1; v <= 5; v++) g += L(x0 - 10, y0 - v * sy, x0 + 5 * sx + 10, y0 - v * sy, { w: 0.6, color: '#e2e2e2' }) + t(x0 - 16, y0 - v * sy + 5, String(v), { size: 11, anchor: 'end', color: GRAY });
  for (let i = 0; i <= 5; i++) g += t(x0 + i * sx, y0 + 70, `점${i}`, { size: 12 });
  const ref = cum.map((_, i) => 3 * i / 5);
  const bars = cum.map((v, i) => {
    if (i === 0 || i === 5) return '';
    const [x, y1] = P2(i, v), [, y2] = P2(i, ref[i]);
    const d = (v - ref[i]).toFixed(1);
    return L(x, y2, x, y1, { w: 2, color: RED }) + t(x + 8, (y1 + y2) / 2 + 5, (d > 0 ? '+' : '') + d, { size: 13, color: RED, bold: true, anchor: 'start' });
  }).join('');
  const poly = cum.map((v, i) => P2(i, v).join(',')).join(' ');
  // 최고·최저 평행선
  const par = (off, col) => { const a = P2(0, off), b = P2(5, 3 + off); return L(a[0], a[1], b[0], b[1], { w: 1, color: col, dash: '3 4' }); };
  F.straightnessSol = svg(640, 400, [
    g,
    L(...P2(0, 0), ...P2(5, 3), { w: 1.8, color: GRAY, dash: '8 5' }), t(P2(5, 3)[0] + 6, P2(5, 3)[1] + 22, '기준선(양 끝 연결)', { size: 12, color: GRAY, anchor: 'end' }),
    par(2.6, BLUE), par(-0.2, BLUE),
    `<polyline points="${poly}" fill="none" stroke="${INK}" stroke-width="2.4"/>`,
    ...cum.map((v, i) => C(...P2(i, v), 4.5, { fill: INK })), bars,
    t(20, 28, '검은 선 = 누적(실제 모양), 빨간 막대 = 기준선 대비 값', { size: 13, anchor: 'start' }),
    t(20, 48, '파란 점선 두 줄 사이 폭 = 진직도 = 2.6 − (−0.2) = 2.8 µm', { size: 13, anchor: 'start', color: BLUE, bold: true }),
    t(26, 190, '높이 (µm)', { size: 12, rot: -90 }),
  ].join(''));
})();

// 1회 10번 해설 ①: 측정선 ② B→X→D 를 B 중심으로 돌려 D를 0에 맞추기
(() => {
  const x0 = 90, y0 = 245, sx = 220, sy = 26; // 1 µm = 26 px
  const P2 = (i, v) => [x0 + i * sx, y0 - v * sy];
  const meas = [0, 1, 4], corr = [0, -1, 0], line = [0, -2, -4];
  const names = ['B (시작)', 'X (가운데)', 'D (끝)'];
  let g = '';
  for (let v = -5; v <= 5; v++) g += L(x0 - 20, y0 - v * sy, x0 + 2 * sx + 20, y0 - v * sy, { w: 0.5, color: '#e6e6e6' }) + (v % 1 === 0 ? t(x0 - 26, y0 - v * sy + 4, String(v), { size: 10, anchor: 'end', color: GRAY }) : '');
  const pl = (arr, col, w, dash) => `<polyline points="${arr.map((v, i) => P2(i, v).join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  F.planeRotationSol = svg(680, 430, [
    g,
    pl(meas, INK, 2.2), ...meas.map((v, i) => C(...P2(i, v), 5, { fill: INK })),
    pl(line, RED, 1.6, '7 4'),
    pl(corr, BLUE, 2.4), ...corr.map((v, i) => C(...P2(i, v), 5, { fill: BLUE, color: BLUE })),
    // 보정 화살표
    L(P2(1, 1)[0] + 14, P2(1, 1)[1], P2(1, -1)[0] + 14, P2(1, -1)[1], { w: 1.6, color: RED, m: 'arr' }), t(P2(1, 0)[0] + 22, P2(1, 0)[1] + 5, '보정 −2', { size: 14, color: RED, bold: true, anchor: 'start' }),
    L(P2(2, 4)[0] + 14, P2(2, 4)[1], P2(2, 0)[0] + 14, P2(2, 0)[1], { w: 1.6, color: RED, m: 'arr' }), t(P2(2, 2)[0] + 22, P2(2, 2)[1] + 5, '보정 −4', { size: 14, color: RED, bold: true, anchor: 'start' }),
    t(P2(1, 1)[0], P2(1, 1)[1] - 12, '측정 +1', { size: 13 }), t(P2(2, 4)[0] - 10, P2(2, 4)[1] - 12, '측정 +4', { size: 13, anchor: 'end' }),
    t(P2(1, -1)[0] + 10, P2(1, -1)[1] + 24, '보정 후 −1', { size: 13, color: BLUE, bold: true, anchor: 'start' }), t(P2(2, 0)[0] - 10, P2(2, 0)[1] + 22, '보정 후 0', { size: 13, color: BLUE, bold: true, anchor: 'end' }),
    ...names.map((n, i) => t(P2(i, 0)[0], 412, n, { size: 13, bold: true })),
    t(20, 26, '측정선 ② B→X→D: D는 기준평면 위(0)여야 하는데 +4로 측정됨', { size: 13, anchor: 'start' }),
    t(20, 46, '→ B를 중심으로 선을 돌려 D를 −4 내리면, 거리가 절반인 X는 −2만 내려감', { size: 13, anchor: 'start', color: RED }),
    t(20, 66, '검은 선 = 측정값, 빨간 점선 = 보정량(0 → −2 → −4), 파란 선 = 보정 후', { size: 12, anchor: 'start', color: GRAY }),
  ].join(''));
})();

// 1회 10번 해설 ②: 보정 후 각 점의 높이
(() => {
  const pts = { A: [80, 290, 0], E: [260, 290, 2], B: [440, 290, 0], H: [80, 170, 1], X: [260, 170, -1], F: [440, 170, 0], D: [80, 50, 0], G: [260, 50, -4], C: [440, 50, -10] };
  const body = [R(80, 50, 360, 240, { fill: '#f4f6f8' }), L(80, 290, 440, 50, { color: GRAY, w: 1 }), L(440, 290, 80, 50, { color: GRAY, w: 1 })];
  for (const [n, [x, y, v]] of Object.entries(pts)) {
    const col = v === 2 ? RED : v === -10 ? BLUE : INK;
    body.push(C(x, y, 6, { fill: col, color: col }));
    body.push(t(x + (x === 440 ? 14 : x === 80 ? -14 : 0), y + (y === 290 ? 26 : y === 50 ? -12 : -12), `${n} ${v > 0 ? '+' : ''}${v}`, { size: 15, bold: true, color: col, anchor: x === 440 ? 'start' : x === 80 ? 'end' : 'middle' }));
  }
  body.push(t(480, 140, '최고 E = +2', { size: 14, color: RED, bold: true, anchor: 'start' }));
  body.push(t(480, 162, '최저 C = −10', { size: 14, color: BLUE, bold: true, anchor: 'start' }));
  body.push(t(480, 190, '평면도 = 2 − (−10)', { size: 14, anchor: 'start' }));
  body.push(t(480, 210, '= 12 µm', { size: 14, anchor: 'start', bold: true }));
  F.planeValuesSol = svg(640, 330, body.join(''));
})();

module.exports = F;
