// 정밀측정산업기사 실기 모의고사 — 큐넷 공개문제 형식 (과제 1~8, 과제당 30분)
// 사용법: node scripts/build_qnet_exam_docx.js <output.docx> [--study]
// 형식 출처: 아티팩트 「정밀측정 실기 공개문제」(큐넷 공개문제 과제 1·4·5·6·7·8 정리)
// 문제 유형 보충: 「정밀측정산업기사 실기 강의 노트」(교재 Chapter 7). 숫자는 모두 새로 만듦.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, ShadingType, PageBreak, Footer, PageNumber, HeightRule, ImageRun,
} = require('docx');

const out = process.argv[2];
const STUDY = process.argv[3] === '--study'; // 과제 바로 밑에 해설을 넣는 공부용 버전
const FONT = '맑은 고딕';
const BLUE = '1F4E8C';
const W = 9638;

const run = (text, o = {}) => new TextRun({ text, bold: o.bold, size: o.size ?? 20, color: o.color });
const P = (text, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  indent: o.indent ? { left: o.indent } : undefined,
  alignment: o.align, keepNext: o.keepNext, shading: o.fill ? shade(o.fill) : undefined,
  children: Array.isArray(text) ? text : [run(text, o)],
});
function shade(fill) { return { type: ShadingType.CLEAR, fill, color: 'auto' }; }

function T(header, rows, widths) {
  const n = header.length;
  widths = widths ?? Array(n).fill(Math.floor(W / n));
  const total = widths.reduce((a, b) => a + b, 0);
  const mk = (txt, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: head ? shade('E8EEF7') : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(String(txt), { size: 18, bold: head })] })],
  });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => mk(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => mk(c, i, false)) }))] });
}

// 큐넷 답안지 형식: 번호 | 항목 | 요구정밀도 | 측정값(답) | 계산과정
function sheet(rows, answers) {
  const w = [800, 2300, 1300, 1700, W - 6100];
  return T(['번호', '항목', '요구정밀도', '답', '계산과정'], rows.map((r, i) => [r[0], r[1], r[2] ?? '', answers ? answers[i][2] : '', answers ? '아래 해설' : '']), w);
}


// ---- 상세 풀이 렌더링 (scripts/solutions.js) ----
const { S1, S2 } = require('./solutions');
function formulaBox(f, d) {
  const kids = [new Paragraph({ spacing: { after: d.length ? 30 : 0 }, children: [
    new TextRun({ text: '공식  ', bold: true, size: 17, color: 'B26B00' }),
    new TextRun({ text: f, bold: true, size: 21, color: '1A1A1A' })] })];
  d.forEach((x) => kids.push(new Paragraph({ spacing: { after: 10 }, indent: { left: 520 }, children: [new TextRun({ text: '– ' + x, size: 16, color: '555555' })] })));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ cantSplit: true, children: [new TableCell({
    width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'FFF6D5', color: 'auto' },
    margins: { top: 60, bottom: 60, left: 140, right: 100 },
    borders: { left: { style: BorderStyle.SINGLE, size: 24, color: 'E0A100' }, top: { style: BorderStyle.SINGLE, size: 4, color: 'F0D58A' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'F0D58A' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'F0D58A' } },
    children: kids })] })] });
}
function renderSol(items) {
  const out = [];
  items.forEach((s) => {
    if (typeof s === 'string') {
      const step = /^(\d단계|\d-\d|\(\d\)|[①-⑥]|7-\d)/.test(s) && !s.startsWith('·');
      const color = s.startsWith('확인') ? '2E7D32' : s.startsWith('실수') ? 'C0392B' : s.startsWith('※') ? '666666' : s.startsWith('핵심') ? BLUE : undefined;
      out.push(new Paragraph({ spacing: { before: step ? 80 : 0, after: 30 }, indent: { left: s.startsWith('·') ? 420 : 160 }, keepNext: step,
        children: [new TextRun({ text: s, size: 18, bold: step || /^(핵심|확인|실수)/.test(s), color })] }));
    } else if (s.f) { out.push(formulaBox(s.f, s.d || [])); out.push(new Paragraph({ spacing: { after: 40 }, children: [] })); }
    else { out.push(T(s.t, s.r, s.w)); out.push(new Paragraph({ spacing: { after: 40 }, children: [] })); }
  });
  return out;
}

// 과제 해설 블록 (시험지 뒤 해설 페이지와 공부용 버전에서 같이 사용)
function taskSolution(t) {
  const out = [];
  out.push(P('정답', { bold: true, size: 18, indent: 120, after: 20 }));
  t.ans.forEach((a) => {
    out.push(P([run(`${a[0]} ${a[1]}  `, { bold: true, size: 19 }), run(a[2], { bold: true, size: 19, color: BLUE })], { indent: 240, keepNext: true, after: 20 }));
    if (!S2[t.no]) out.push(P(a[3], { indent: 360, size: 18 }));
  });
  if (S2[t.no]) { out.push(P('풀이', { bold: true, size: 18, indent: 120, before: 80, after: 20 })); out.push(...renderSol(S2[t.no])); }
  if (t.tips.length) {
    out.push(P('포인트', { bold: true, size: 17, indent: 120, before: 60, after: 20 }));
    t.tips.forEach((s) => out.push(P('· ' + s, { indent: 360, size: 17, after: 20 })));
  }
  return out;
}
function calcBox(lines = 5) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [
    new TableRow({ height: { value: 320 * lines, rule: HeightRule.ATLEAST }, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, children: [P('[계산과정 및 답]', { size: 17, color: '666666' })] })] })] });
}
const gap = (a = 80) => new Paragraph({ spacing: { after: a }, children: [] });


// ---- 그림 (scripts/render_figures.js 로 만든 PNG) ----
const path = require('path');
const FIGDIR = path.join(__dirname, '..', 'mock_exam', 'figures');
const SIZES = JSON.parse(fs.readFileSync(path.join(FIGDIR, 'sizes.json'), 'utf8'));
let figNo = 0;
function figure(name, maxW = 560) {
  const s = SIZES[name];
  if (!s) throw new Error('그림 없음: ' + name);
  const w = Math.min(maxW, s.w), h = Math.round((s.h * w) / s.w);
  figNo += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 20 }, keepNext: true,
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(FIGDIR, name + '.png')), transformation: { width: w, height: h } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: `[그림 ${figNo}]`, size: 16, color: '666666' })] }),
  ];
}
const FIG = { 1: ['task1', 'micReading24512'], 2: ['height'], 3: ['projector', 'chord'], 4: ['micCalib'], 7: ['task7'], 8: ['dof'] };
const SOLFIG = { 8: ['dofAxes'] }; // 해설에만 넣는 그림

// ---------------- 과제 ----------------
// body 요소: 문자열 | {t, r, w} 표 | {sheet: rows} 답안표 | {box: n} 계산칸
const TASKS = [
  {
    no: 1, title: '마이크로미터 사용하기', basis: '큐넷 공개문제 과제 1 (10-3쪽)',
    body: [
      '외측·내측·깊이 마이크로미터로 부품을 측정하였다. 아래 3회 측정 읽음값과 영점(기준봉) 확인값으로 각 항목의 측정값을 구하시오. (측정값 = 3회 평균 − 영점오차, mm 소수점 셋째자리)',
      { t: ['항목', '측정기', '1회', '2회', '3회', '영점오차'], r: [
        ['L1', '외측 0~25', '(가)', '24.513', '24.511', '+0.002'],
        ['L2', '외측 25~50', '38.205', '38.207', '38.206', '−0.001'],
        ['V1', '내측 5~30', '18.034', '18.036', '18.035', '0'],
        ['K1', '깊이 0~25', '12.468', '12.470', '12.469', '+0.001'],
        ['A1 (φ)', '외측 0~25', '9.996', '9.998', '9.997', '+0.002']] },
      '(가) L1 1회 읽음: 슬리브 위쪽 24 눈금, 아래쪽 0.5 눈금 보임, 딤블 1과 2 사이 1/5 지점에 기준선.',
      'L3는 도면상 L2와 L1의 차(단차)이다.',
      { sheet: [['1-1', 'L1', '±0.006'], ['1-2', 'L2', '±0.006'], ['1-3', 'L3 (= L2 − L1)', '±0.006'], ['1-4', 'V1', '±0.006'], ['1-5', 'K1', '±0.006'], ['1-6', 'A1 (지름)', '±0.024']] },
    ],
    ans: [['1-1', 'L1', '24.510', '(가) 24 + 0.5 + 0.012 = 24.512 → 평균 (24.512 + 24.513 + 24.511)/3 = 24.512 → 24.512 − 0.002 = 24.510'],
      ['1-2', 'L2', '38.207', '평균 38.206 − (−0.001) = 38.207'],
      ['1-3', 'L3', '13.697', 'L2 − L1 = 38.207 − 24.510 = 13.697'],
      ['1-4', 'V1', '18.035', '평균 18.035 − 0 = 18.035'],
      ['1-5', 'K1', '12.468', '평균 12.469 − 0.001 = 12.468'],
      ['1-6', 'A1', '9.995', '평균 9.997 − 0.002 = 9.995']],
    tips: ['딤블 1.2칸 = 0.012 mm. 기준선이 눈금 사이면 0.001 단위로 어림합니다.',
      '실치수 = 읽음값 − 영점오차. 영점이 +이면 빼고, −이면 더해집니다.',
      '깊이 마이크로미터는 슬리브 눈금 방향이 외측과 반대입니다. 읽는 방향을 먼저 확인하세요.',
      '큐넷 규칙: 계산이 필요한 값은 계산과정(공식 포함)이 없으면 정답이어도 0점.'],
  },
  {
    no: 2, title: '하이트 마이크로미터·테스트 인디케이터 측정 (추정 과제)', basis: '큐넷 원문 없음 → 교재 B-2 과제 2-1~2-4 유형으로 구성 (확인 필요)',
    body: [
      '(1) 하이트 마이크로미터로 구멍 ①의 아랫면 H₁ = 20.004, 윗면 H₂ = 32.010을 얻었다.',
      '(2) 데이텀 B면을 정반에 놓고 테스트 인디케이터(0.002 mm)로 윗면 5점의 바늘 변화를 읽었다: 0, +3, +5, +2, −1 µm',
      '(3) 데이텀 측면을 정반에 놓고 돌기 면까지 a = 15.012, 뒤집어 반대쪽 b = 15.020을 얻었다.',
      { sheet: [['2-1', '구멍 ① 중심 높이', '±0.006'], ['2-2', '윗면 평행도', '±0.004'], ['2-3', '돌기 대칭도', '±0.004']] },
    ],
    ans: [['2-1', '중심 높이', '26.007', 'H = (H₁ + H₂)/2 = (20.004 + 32.010)/2 = 26.007'],
      ['2-2', '평행도', '0.006', '최대 − 최소 = 5 − (−1) = 6 µm = 0.006 mm'],
      ['2-3', '대칭도', '0.008', '|a − b| = |15.012 − 15.020| = 0.008']],
    tips: ['과제 2·3은 큐넷 공개문제 자료에 없어서 교재 유형으로 대신했습니다. 실제 과제 내용은 확인 필요.'],
  },
  {
    no: 3, title: '투영기 측정 (추정 과제)', basis: '큐넷 원문 없음 → 교재 B-2 과제 2-7~2-9 유형으로 구성 (확인 필요)',
    body: [
      '투영기 카운터로 다음 값을 읽었다.',
      '(1) 구멍 ① X방향 양 끝: 10.120, 22.140 / 구멍 ② X방향 양 끝: 40.205, 52.195 (두 구멍은 같은 Y 위치)',
      '(2) 호의 현 c = 24.000, 높이 h = 3.000',
      '(3) 스크린 각도: 한 변 45°12′30″, 다른 변 105°40′10″ (도면의 각은 예각)',
      { sheet: [['3-1', '구멍 ①, ② 지름', '±0.010'], ['3-2', '두 구멍 중심거리', '±0.010'], ['3-3', '반경 R', '±0.020'], ['3-4', '각도', '±0°5′']] },
    ],
    ans: [['3-1', '지름', '① 12.020 / ② 11.990', '① 22.140 − 10.120 = 12.020, ② 52.195 − 40.205 = 11.990'],
      ['3-2', '중심거리', '30.070', '중심 ① (10.120 + 22.140)/2 = 16.130, ② (40.205 + 52.195)/2 = 46.200 → 46.200 − 16.130 = 30.070'],
      ['3-3', 'R', '25.500', 'R = (h² + (c/2)²) ÷ 2h = (9 + 144) ÷ 6 = 25.500'],
      ['3-4', '각도', '60°27′40″', '105°40′10″ − 45°12′30″ = 60°27′40″ (큐넷 규칙: 각도는 초 단위까지)']],
    tips: ['스테이지는 항상 같은 방향으로 접근(백래시 방지). 각도 계산 시 분·초 받아내림 주의.'],
  },
  {
    no: 4, title: '마이크로미터 교정하기', basis: '큐넷 공개문제 과제 4 (10-6쪽)',
    body: [
      '외측 마이크로미터(0~25 mm)를 교정하였다. 단색광 파장 λ = 0.6 µm.',
      '(1) 앤빌 측정면에 옵티컬플랫을 올리니 둥근 간섭무늬 2개, 스핀들 측정면에서는 1개가 보였다.',
      '(2) 옵티컬패러렐 4장의 (앤빌 + 스핀들) 무늬 수: (1+2), (2+2), (1+1), (3+2)',
      '(3) 게이지블록 5개의 읽음값',
      { t: ['기준값(mm)', '2.500', '5.100', '10.300', '17.600', '25.000'], r: [['읽음값(mm)', '2.501', '5.098', '10.302', '17.600', '25.003']] },
      { sheet: [['4-1', '평면도 — 앤빌', '±0.002'], ['4-1', '평면도 — 스핀들', '±0.002'], ['4-2', '평행도', '±0.002'], ['4-3', '기차 #1 ~ #5', '±0.004']] },
    ],
    ans: [['4-1', '평면도 앤빌', '0.60 µm (0.001 mm)', '무늬 1개 = λ/2 = 0.30 µm → 2 × 0.30 = 0.60 µm'],
      ['4-1', '평면도 스핀들', '0.30 µm (0.000 mm)', '1 × 0.30 = 0.30 µm'],
      ['4-2', '평행도', '1.50 µm (0.002 mm)', '무늬 합 3, 4, 2, 5 → 최대 5 × 0.30 = 1.50 µm'],
      ['4-3', '기차 #1~#5', '+0.001, −0.002, +0.002, 0.000, +0.003', '기차 = 읽음값 − 기준값']],
    tips: ['큐넷 규칙: µm 값은 소수점 둘째자리, mm 값은 셋째자리. 답란 단위(mm)를 먼저 확인하세요.',
      '교정과제는 피교정 측정기의 일련번호를 기록지에 적어야 합니다.'],
  },
  {
    no: 5, title: '데이터 통계 처리하기', basis: '큐넷 공개문제 과제 5 (10-7쪽)',
    body: [
      '[표1] 지름 측정 결과 (mm)',
      { t: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], r: [['8.05', '7.92', '8.10', '8.00', '7.95', '8.12', '8.03', '7.98', '8.08', '8.07']] },
      '(1) 도면에 ∅8 ± 0.3으로 원통을 생산하였다. 이 부품 10개를 모집단으로 가정할 때 모평균(μ)과 모표준편차(σ)를 구하시오.',
      '(2) 500개의 축을 생산하여 그중 10개를 샘플링한 결과가 [표1]이다. 표본평균이 모평균과 같다고 가정하고 표본표준편차(s)를 구하시오.',
      '(3) ∅8 ± 0.3 축을 가공하는 공정에서 100개를 측정한 평균과 표준편차가 각각 8.060, 0.080이었다. 이 공정의 공정능력지수(Cp)를 구하시오.',
      { box: 7 },
    ],
    ans: [['5-1', 'μ, σ', 'μ = 8.030, σ = 0.063', 'μ = 80.30 ÷ 10 = 8.030, 편차제곱합 S = 0.0394, σ = √(S/n) = √(0.0394/10) = 0.063'],
      ['5-2', 's', '0.066', 's = √(S/(n − 1)) = √(0.0394/9) = 0.066'],
      ['5-3', 'Cp', '1.250', 'Cp = (USL − LSL)/6σ = (8.3 − 7.7)/(6 × 0.080) = 0.6/0.48 = 1.250 (참고: Cpk = (8.3 − 8.06)/(3 × 0.08) = 1.000)']],
    tips: ['‘모집단’이면 n으로, ‘표본(샘플링)’이면 n − 1로 나눕니다(계산기 σx / sx).',
      '편차제곱합: 편차 +0.02, −0.11, +0.07, −0.03, −0.08, +0.09, 0, −0.05, +0.05, +0.04 → 제곱합 0.0394',
      '큐넷 원문은 Cp만 묻습니다. 평균이 치우쳐 있으면 Cpk도 함께 알아 두면 좋습니다.'],
  },
  {
    no: 6, title: '불확도 계산하기', basis: '큐넷 공개문제 과제 6 (10-8쪽)',
    body: [
      '측정범위 0~25 mm, 최소눈금 0.001 mm인 디지털 외측 마이크로미터의 불확도를 구한다.',
      '[표1] 게이지블록 반복측정 결과 (mm)',
      { t: ['기준값', '1회', '2회', '3회', '4회', '5회', '표준편차 s'], r: [
        ['5', '5.001', '4.999', '5.002', '5.000', '5.003', '0.0016'],
        ['10', '10.002', '9.999', '10.001', '10.003', '10.000', '0.0016'],
        ['15', '14.998', '15.002', '15.001', '15.003', '15.000', '0.0019'],
        ['20', '20.003', '19.997', '20.001', '20.002', '19.999', '0.0024']] },
      '(1) 반복측정에 대한 표준불확도 u1 (n = 5, t분포)',
      '(2) 기준기(게이지블록)에 의한 표준불확도 u2 (정규분포, 확장불확도 0.6 µm, k = 2)',
      '(3) 분해능(1 µm)에 의한 표준불확도 u3 (직사각형분포)',
      '(4) 합성표준불확도 uc   (5) 확장불확도 U (k = 2, 약 95 %)   ※ 모두 µm, 소수점 둘째자리',
      { box: 7 },
    ],
    ans: [['6-1', 'u1', '1.08 µm', '가장 큰 표준편차(20 mm, s = 2.41 µm) 사용 → u1 = s/√n = 2.41/√5 = 1.08 µm'],
      ['6-2', 'u2', '0.30 µm', 'u2 = U/k = 0.6/2 = 0.30 µm'],
      ['6-3', 'u3', '0.29 µm', 'u3 = (1/2)/√3 = 0.29 µm'],
      ['6-4', 'uc', '1.15 µm', 'uc = √(1.08² + 0.30² + 0.29²) = 1.15 µm'],
      ['6-5', 'U', '2.31 µm', 'U = k × uc = 2 × 1.15 = 2.31 µm (k = 2)']],
    tips: ['u1을 구할 때 4개 기준값 중 어느 표준편차를 쓰는지(최대값 / 합동표준편차)는 문제 지시를 따릅니다. 이 해설은 보수적으로 최대값을 사용했습니다 — 채점 기준 확인 필요.',
      '분해능은 반으로 나눈 뒤 √3 (1 µm → 0.5/√3). 합성은 제곱합의 제곱근.'],
  },
  {
    no: 7, title: '기하편차 계산하기', basis: '큐넷 공개문제 과제 7 (10-9쪽)',
    body: [
      '[그림]과 같은 폭 120, 높이 100인 판 부품. 데이텀 A = 앞면, B = 아랫면, C = 왼쪽 면, D = 전체 폭 120의 중심면. 측정값은 모두 해당 데이텀 면에서 잰 거리(mm)이다.',
      { t: ['기호', '형체', '크기', '기하공차 기입틀', '이론 위치'], r: [
        ['㉠', '아랫면 홈', '16 ± 0.2', '≡ 0Ⓜ | A | D', '폭 중심(60)'],
        ['㉡', '왼쪽 홈', '30 ± 0.2', '⌖ 0.2Ⓜ | A | B', 'B에서 60'],
        ['㉢', '중앙 구멍', '∅20 ± 0.1', '⌖ ∅0.2Ⓜ | A | B | C', 'C에서 60, B에서 45'],
        ['㉣', '윗면', '—', '⌓ 0.4 | A | B', 'B에서 100']], w: [700, 1500, 1500, 3138, 2800] },
      { t: ['번호', '측정 위치', '측정값'], r: [
        ['①', '왼쪽 면 → 홈 왼쪽 벽', '51.990'], ['②', '왼쪽 면 → 홈 오른쪽 벽', '68.130'], ['③', '전체 폭', '120.100'],
        ['④', '아랫면 → 왼쪽 홈 아래 벽', '45.230'], ['⑤', '아랫면 → 왼쪽 홈 위 벽', '75.370'],
        ['⑥', '구멍 중심 X (C 기준)', '60.060'], ['⑦', '구멍 중심 Y (B 기준)', '45.080'], ['⑧', '구멍 지름', '20.050'],
        ['⑨', '윗면 높이 (B 기준)', '100.130']], w: [900, 5738, 3000] },
      '각 항목은 측정값, 허용값(Ⓜ 보너스 포함), 합부 판정을 함께 쓰시오.',
      { sheet: [['7-1', '㉠ 홈의 대칭도', '±0.010'], ['7-2', '㉡ 홈의 위치도', '±0.010'], ['7-3', '㉢ 구멍의 위치도', '±0.010'], ['7-4', '㉣ 윤곽도', '±0.010']] },
    ],
    ans: [['7-1', '대칭도', '0.020 (허용 0.340, 합격)', '홈 폭 = 68.130 − 51.990 = 16.140, 홈 중심 = 60.060 / D 중심 = 120.100/2 = 60.050 → 대칭도 = 2 × |60.060 − 60.050| = 0.020. 보너스 = 16.140 − 15.8(MMC) = 0.340 → 허용 0 + 0.340 = 0.340 → 0.020 ≤ 0.340 합격'],
      ['7-2', '홈 위치도', '0.600 (허용 0.540, 불합격)', '홈 폭 = 75.370 − 45.230 = 30.140, 중심 = 60.300 → 위치도 = 2 × |60.300 − 60| = 0.600. 보너스 = 30.140 − 29.8 = 0.340 → 허용 0.2 + 0.340 = 0.540 → 0.600 > 0.540 불합격'],
      ['7-3', '구멍 위치도', '0.200 (허용 0.350, 합격)', '2√(0.060² + 0.080²) = 2 × 0.100 = 0.200. 보너스 = 20.050 − 19.9 = 0.150 → 허용 0.2 + 0.150 = 0.350 → 합격'],
      ['7-4', '윤곽도', '0.260 (허용 0.4, 합격)', '2 × |100.130 − 100| = 0.260 ≤ 0.4 → 합격']],
    tips: ['폭 형체(홈)의 위치도·대칭도는 공차역이 폭이라 중심 차의 2배, 구멍은 2√(ΔX² + ΔY²).',
      '데이텀 뒤에 Ⓜ이 없으면 데이텀 이동량은 더하지 않습니다(이 문제는 모두 없음).',
      '큐넷 원문 ㉣은 ‘⌓ 0.4 UZ −0.2’(비대칭 공차역)입니다. UZ 해석은 ISO 1101과 ASME Y14.5-2018의 표기 방식이 달라 판정이 달라질 수 있으므로 확인 필요. 이 모의고사는 균등(±0.2) 공차역으로 출제했습니다.',
      '※ ASME Y14.5-2018에서는 대칭도 기호가 삭제되었지만 큐넷 문제는 대칭도 + Ⓜ으로 출제됩니다. 시험은 문제 지시대로 계산합니다.'],
  },
  {
    no: 8, title: '3차원 측정하기', basis: '큐넷 공개문제 과제 8 (10-10쪽)',
    body: [
      '좌표계: X = 가로, Y = 세로(앞→뒤), Z = 높이. 직선운동 Tx, Ty, Tz / 회전운동 Rx, Ry, Rz로 표기한다.',
      '(1) 구멍 ∅12 ± 0.1에 ⌖ ∅0.1Ⓜ | A | B | C. A = 바닥면(X-Y 평면), B = 왼쪽 면(Y-Z 평면), C = 앞면(X-Z 평면). 제1·2·3차 데이텀을 순서대로 설정할 때 각 데이텀이 구속하는 자유도를 쓰시오.',
      '(2) 같은 부품에서 데이텀 순서가 A(바닥면) → E(Z방향 구멍) → B(왼쪽 면)일 때 각 데이텀이 구속하는 자유도를 쓰시오.',
      '(3) (1)의 데이텀 순서로 만들어지는 3차원 좌표계(원점과 X, Y, Z축)를 아래 그림에 작도하시오.',
      { t: ['', '제1차 데이텀', '제2차 데이텀', '제3차 데이텀'], r: [['(1) 직선 / 회전', '', '', ''], ['(2) 직선 / 회전', '', '', '']], w: [1900, 2579, 2579, 2580] },
      { box: 4 },
    ],
    ans: [['8-1', '(1)', 'A: Tz / Rx, Ry · B: Tx / Rz · C: Ty / —', '평면 데이텀은 그 평면에 수직인 축 방향 이동을 막음. 1차 평면은 회전 2개, 2차는 남은 회전 1개'],
      ['8-2', '(2)', 'A: Tz / Rx, Ry · E: Tx, Ty / — · B: — / Rz', 'Z방향 구멍은 X, Y 이동을 한꺼번에 막고 원점이 구멍 중심이 됨 → 남은 Rz는 B가 막음'],
      ['8-3', '(3)', '원점 = A·B·C 세 면의 교점(왼쪽 앞 아래 모서리)', 'Z축: A면에서 수직 위로, X축: B면에서 수직으로 부품 쪽(오른쪽), Y축: C면에서 수직으로 부품 쪽(뒤). 오른손 법칙(엄지 X, 검지 Y, 중지 Z)으로 확인']],
    tips: ['스스로 확인: 세 데이텀의 구속을 모으면 Tx, Ty, Tz, Rx, Ry, Rz가 한 번씩 나와야 합니다.'],
  },
];

// ---------------- 문서 조립 ----------------
const children = [];
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [run(`정밀측정산업기사 실기 모의고사 (큐넷 공개문제형)${STUDY ? ' — 해설 포함 공부용' : ''}`, { bold: true, size: 32 })] }));
children.push(P('정밀측정실무 · 과제 8개 × 30분 = 4시간 · 100점 / 60점 이상 합격', { align: AlignmentType.CENTER, size: 19 }));
children.push(P('수험번호: ______________     성명: ______________     점수: ________ / 100', { align: AlignmentType.CENTER, size: 19, after: 160 }));
children.push(P('※ 큐넷 공개문제(과제 1·4·5·6·7·8)의 형식과 문항 구성을 그대로 따르고 숫자를 새로 바꾼 연습용 모의고사입니다. 과제 2·3은 공개문제 자료에 없어 교재(실기 강의 노트) 유형으로 대신했습니다(확인 필요). 과제 1~3은 실제 시험에서 측정기로 직접 재는 과제라, 여기서는 읽음값으로 답안을 작성하는 연습으로 바꿨습니다.', { size: 17, fill: 'EEF2F8' }));
children.push(P('수험자 유의사항(큐넷 공개문제 요약)', { bold: true, size: 19, before: 120 }));
['계산이 필요한 값은 계산과정(공식 포함)을 반드시 기록. 누락 시 정답이어도 0점.',
  '검은색 필기구만 사용(연필·유색·지워지는 펜 0점). 정정은 두 줄(=) 또는 수정테이프.',
  '단위가 없으면 mm로 채점. mm는 소수점 셋째자리(넷째자리에서 반올림), µm는 소수점 둘째자리, 각도는 초 단위까지.',
  '교정과제는 피교정 측정기의 일련번호를 기록. 1개 과정이라도 불참하거나 시간 내 미완성이면 실격.',
].forEach((t) => children.push(P('· ' + t, { indent: 200, size: 17 })));
if (STUDY) children.push(P('이 버전은 공부용으로 각 과제 바로 밑에 정답과 해설이 있습니다. 시험처럼 풀려면 시험지 버전을 쓰세요.', { size: 17, bold: true, color: BLUE }));
children.push(P('배점: 과제당 12.5점 (8과제 = 100점) — 실제 배점은 비공개이므로 자가 채점용 가정입니다.', { size: 16, color: '666666', after: 120 }));

TASKS.forEach((t, idx) => {
  if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ spacing: { before: 120, after: 80 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: BLUE, space: 2 } },
    children: [run(`과제 ${t.no}. ${t.title}`, { bold: true, size: 24, color: BLUE }), run('   (30분)', { size: 18, color: '666666' })] }));
  let figPlaced = false;
  const placeFigs = () => { if (!figPlaced) { (FIG[t.no] || []).forEach((n) => children.push(...figure(n))); figPlaced = true; } };
  t.body.forEach((b) => {
    if (typeof b === 'string') children.push(P(b, { indent: 120 }));
    else if (b.sheet) {
      placeFigs();
      children.push(P(STUDY ? '[답안지 — 정답 기입]' : '[답안지]', { bold: true, size: 18, before: 80 }));
      children.push(sheet(b.sheet, STUDY ? t.ans : null)); children.push(gap());
      if (!STUDY) children.push(calcBox(4));
    }
    else if (b.box) { placeFigs(); if (!STUDY) children.push(calcBox(b.box)); }
    else { children.push(T(b.t, b.r, b.w)); children.push(gap()); }
  });
  placeFigs();
  if (STUDY) {
    children.push(new Paragraph({ spacing: { before: 120, after: 60 }, keepNext: true, shading: shade('EEF2F8'),
      children: [run('▶ 해설', { bold: true, size: 20, color: BLUE }), run(`  (근거: ${t.basis})`, { size: 16, color: '666666' })] }));
    children.push(...taskSolution(t));
    (SOLFIG[t.no] || []).forEach((n) => children.push(...figure(n, 480)));
  }
});

if (!STUDY) {

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
  children: [run('정답 및 해설', { bold: true, size: 32 })] }));
children.push(T(['과제', '번호', '정답'], TASKS.flatMap((t) => t.ans.map((a, i) => [i === 0 ? `과제 ${t.no}` : '', a[0], `${a[1]}: ${a[2]}`])), [1300, 1000, W - 2300]));
children.push(gap(200));
TASKS.forEach((t) => {
  children.push(new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 2 } },
    children: [run(`과제 ${t.no}. ${t.title}`, { bold: true, size: 21, color: BLUE }), run(`  (근거: ${t.basis})`, { size: 16, color: '666666' })] }));
  children.push(...taskSolution(t));
  (SOLFIG[t.no] || []).forEach((n) => children.push(...figure(n, 480)));
});
}
children.push(P('— 끝 —', { align: AlignmentType.CENTER, before: 240 }));

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 20 } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 16 })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('wrote', out); });
