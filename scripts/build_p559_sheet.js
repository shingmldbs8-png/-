// 교재 p.559 과제 2-3 기하편차(1) 공식 정리 1장 (Word, A4 가로)
// 사용법: node scripts/build_p559_sheet.js <output.docx>
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, BorderStyle, PageOrientation, VerticalAlign } = require('docx');
const out = process.argv[2];
const W = 14400; // A4 가로 본문 폭(DXA, 여백 720)
const BLUE = '1F4E8C';
const run = (t, o = {}) => new TextRun({ text: t, bold: o.b, size: o.s ?? 19, color: o.c, font: o.mono ? 'Consolas' : undefined });
const para = (parts, o = {}) => new Paragraph({ alignment: o.align, spacing: { after: o.after ?? 40, before: o.before ?? 0 }, children: (Array.isArray(parts) ? parts : [parts]).map((p) => typeof p === 'string' ? run(p, o) : p) });
const cell = (content, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: 60, bottom: 60, left: 90, right: 90 },
  children: (Array.isArray(content) ? content : [content]).map((c) => typeof c === 'string' ? para(c, { s: o.s ?? 18, b: o.b, align: o.align, c: o.c }) : c),
});
const table = (widths, header, rows, o = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { fill: 'DCE6F2', b: true, align: AlignmentType.CENTER })) }),
    ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: i === (o.fcol ?? -1) ? 'FFF6D5' : (i === 0 ? 'F3F6FA' : undefined), b: i === 0 || i === o.fcol, s: i === o.fcol ? 19 : 18 })) }))],
});

const main = table([1500, 1300, 2600, 3300, 2900, 2800],
  ['항목', '기호 · 데이텀', '놓는 법', '측정 방법', '공식', '계산 예시 (예시 값)'],
  [
    ['① 진직도', '—\n데이텀 없음', '측정면이 위로 오게 정반 위에', '테스트 인디케이터를 한 직선(길이 방향)을 따라 이동하며 지시값 기록', '진직도 = 지시값 최대 − 최소', '0, +2, +4, +1, −1 µm\n→ 4 − (−1) = 5 µm = 0.005 mm'],
    ['② 평면도', '▱\n데이텀 없음', '측정면이 위로 오게 정반 위에', '면 전체를 격자로 9점 이상(가로 3 × 세로 3) 지시값 기록', '평면도 = 전체 지시값 최대 − 최소', '0, +2, +3, −1, +1, +4, −2, 0, +2 µm\n→ 4 − (−2) = 6 µm = 0.006 mm'],
    ['③ 평행도', '//\n데이텀 B (아래 면)', '데이텀 B(아래 면)를 정반에 밀착', '윗면(측정면) 전체를 훑으며 지시값 기록', '평행도 = 측정면 지시값 최대 − 최소', '0, +3, +5, +2, +1 µm\n→ 5 − 0 = 5 µm = 0.005 mm'],
    ['④ 대칭도', '≡\n데이텀 A (전체 높이의 중심면)', '데이텀 한쪽 면을 정반에 → 뒤집어 반대쪽 면을 정반에', '하이트 마이크로미터 + 인디케이터로 돌기 면까지 높이 a, 뒤집어서 b 측정', '대칭도 = |a − b|', 'a = 15.012, b = 15.020\n→ |15.012 − 15.020| = 0.008 mm'],
  ].map((r) => r.map((c) => c.includes('\n') ? c.split('\n').map((x) => para(x, { s: 18 })) : c)), { fcol: 4 });

const why = table([2400, 12000], ['공식', '왜 이렇게 계산하나'], [
  ['최대 − 최소 (①②③)', '기하편차는 ‘이상적인 직선·평면에서 가장 높이 튄 점과 가장 낮게 꺼진 점 사이의 폭’입니다. 그래서 같은 기준(정반·인디케이터 0점)에서 읽은 값의 최대에서 최소를 빼면 그 폭이 됩니다. 지시값의 부호(+, −)를 그대로 살려서 뺍니다.'],
  ['|a − b| (④)', '돌기 중심이 데이텀 중심면에서 e만큼 치우치면 한쪽은 e만큼 높고 반대쪽은 e만큼 낮아 a와 b는 2e 차이가 납니다. 대칭도 공차역은 폭(2e)으로 표시하므로 차이 |a − b|를 그대로 답으로 씁니다.'],
  ['µm → mm', '테스트 인디케이터(0.002 mm) 1눈금 = 2 µm. 답란이 mm이면 µm ÷ 1000 (예: 6 µm = 0.006 mm), 소수점 셋째자리까지.'],
]);

const steps = table([1000, 13400], ['순서', '시험장 측정 순서 (과제 2-3, 30분)'], [
  ['1', '정반·부품 청소, 면장갑 착용. 도면에서 데이텀 A(전체 높이 중심면)와 B(아래 면) 위치 확인'],
  ['2', '테스트 인디케이터 측정자를 측정면과 거의 평행(15° 이내)하게 세팅 — 기울면 코사인 오차(실제값 = 읽음 × cosθ)'],
  ['3', '① 진직도 → ② 평면도: 측정면을 위로 두고 한 번에 측정 (평면도 9점 중 한 줄이 진직도 측정선이 되도록 하면 시간 절약)'],
  ['4', '③ 평행도: 데이텀 B를 정반에 밀착한 상태에서 윗면 전체 훑기'],
  ['5', '④ 대칭도: 한쪽 면을 정반에 두고 돌기 면 높이 a → 부품을 뒤집어 b. 같은 위치·같은 방향으로 접근'],
  ['6', '답안: 공식 → 숫자 대입 → 결과(mm, 셋째자리). 계산과정이 없으면 정답이어도 0점'],
]);

const caution = table([3600, 10800], ['자주 하는 실수', '막는 법'], [
  ['지시값 부호 무시 (예: 4 − 1 = 3)', '− 값은 그대로 빼기: 4 − (−1) = 5'],
  ['평행도에서 데이텀 면이 아닌 면을 정반에', '기입틀의 데이텀 문자(B) 면을 정반에 밀착'],
  ['대칭도를 |a − b| ÷ 2로 계산', '공차역이 폭(2e)이므로 나누지 않음'],
  ['µm 값을 mm 답란에 그대로', '6 µm → 0.006 mm로 환산'],
  ['측정자 각도가 커서 값이 작게 나옴', '측정자를 면과 평행하게, 접근 방향 통일'],
]);

const doc = new Document({
  styles: { default: { document: { run: { font: '맑은 고딕', size: 19 } } } },
  sections: [{
    properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 }, margin: { top: 700, bottom: 700, left: 720, right: 720 } } },
    children: [
      para([run('교재 p.559 과제 2-3  기하편차(1) — 공식 정리', { b: true, s: 30 })], { after: 40 }),
      para([run('측정기: 테스트 인디케이터(0.002), 하이트 마이크로미터, 하이트게이지 · 요구정밀도 ±0.006 · 근거: ISO 1101 / KS B ISO 1101 (기호·정의), 교재 실기 노트 B-2-2', { s: 17, c: '555555' })], { after: 120 }),
      main,
      para([run('※ 계산 예시의 숫자는 설명용 예시입니다. p.559 네 항목은 진직도·평면도·평행도·대칭도(≡)이며 위치도(⌖)가 아닙니다(실기 노트 기준 — 교재 원본으로 확인 필요).', { s: 16, c: '666666' })], { before: 60, after: 160 }),
      why,
      para('', { after: 120 }),
      steps,
      para('', { after: 120 }),
      caution,
      para([run('참고 — 위치도(⌖)가 나오는 경우: 구멍 = 2√(ΔX² + ΔY²), 홈·폭 = 2 × |중심 − 이론 위치|, 허용값 = 공차 + Ⓜ 보너스 + Ⓜ 데이텀 이동량', { s: 17, c: BLUE, b: true })], { before: 160 }),
    ],
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('wrote', out); });
