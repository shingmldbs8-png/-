// 사용법: node scripts/build_mock_exam_docx.js <exam.json> <output.docx>
// exam.json 은 build_mock_exam.py 의 문제 데이터를 내보낸 것.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, ShadingType, PageBreak, Footer, PageNumber,
  SectionType, HeadingLevel,
} = require('docx');

const [inp, out] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(inp, 'utf8'));
const C = ['①', '②', '③', '④'];
const FONT = '맑은 고딕';
const BLUE = '1F4E8C';

const p = (text, opt = {}) => new Paragraph({
  spacing: { after: opt.after ?? 40 },
  indent: opt.indent ? { left: opt.indent } : undefined,
  alignment: opt.align,
  keepNext: opt.keepNext,
  children: [new TextRun({ text, bold: opt.bold, size: opt.size ?? 19, color: opt.color })],
});

const subjHeading = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 120 },
  keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 2 } },
  children: [new TextRun({ text: t, bold: true, size: 22, color: BLUE })],
});

// ---------- 문제 페이지 ----------
const header = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: data.title, bold: true, size: 32 })] }),
  p('총 80문항 (4과목 × 20문항)  |  시험시간 2시간  |  합격: 과목별 40점 이상, 평균 60점 이상', { align: AlignmentType.CENTER, size: 18 }),
  p('수험번호: ______________     성명: ______________     점수: ________', { align: AlignmentType.CENTER, size: 18, after: 120 }),
  new Paragraph({
    spacing: { after: 120 },
    shading: { type: ShadingType.CLEAR, fill: 'EEF2F8', color: 'auto' },
    children: [new TextRun({ size: 16, text: '※ 큐넷 공개 출제기준과 반복 출제 유형을 바탕으로 재구성한 연습용 모의고사입니다(실제 기출 원문 아님). 정답과 해설은 마지막 페이지에 있습니다.' })],
  }),
];

let no = 0;
const questionSections = [];
data.subjects.forEach((s, si) => {
  const body = [];
  for (const it of s.items) {
    no++;
    body.push(p(`${no}. ${it.q}`, { bold: true, keepNext: true, after: 40 }));
    it.c.forEach((c, i) => body.push(p(`${C[i]} ${c}`, { indent: 240, keepNext: i < 3, after: i === 3 ? 160 : 10 })));
  }
  questionSections.push({
    properties: {
      type: si === 0 ? undefined : SectionType.CONTINUOUS,
      column: { count: 2, space: 400, separate: true },
    },
    children: [...(si === 0 ? header : []), subjHeading(s.title), ...body],
  });
});
// 머리말·과목 제목은 1단, 문제 본문은 2단 섹션으로 분리
const sections = [];
data.subjects.forEach((s, si) => {
  const qSec = questionSections[si];
  const head = qSec.children.slice(0, si === 0 ? header.length + 1 : 1);
  const rest = qSec.children.slice(head.length);
  sections.push({ properties: { type: si === 0 ? undefined : SectionType.CONTINUOUS }, children: head });
  sections.push({ properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 400, separate: true } }, children: rest });
});

// ---------- 정답 및 해설 ----------
const all = data.subjects.flatMap((s) => s.items);
const W = 9638, colW = Math.floor(W / 10);
const cell = (text, opt = {}) => new TableCell({
  width: { size: colW, type: WidthType.DXA },
  shading: opt.head ? { type: ShadingType.CLEAR, fill: 'E8EEF7', color: 'auto' } : undefined,
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: opt.head ? 16 : 20, bold: !opt.head })] })],
});
const rows = [];
for (let r = 0; r < all.length; r += 10) {
  const slice = all.slice(r, r + 10);
  rows.push(new TableRow({ children: slice.map((_, i) => cell(String(r + i + 1), { head: true })) }));
  rows.push(new TableRow({ children: slice.map((it) => cell(C[it.a - 1])) }));
}
const ansChildren = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({ text: '정답 및 해설', bold: true, size: 32 })] }),
  new Table({ width: { size: colW * 10, type: WidthType.DXA }, columnWidths: Array(10).fill(colW), rows }),
];
no = 0;
for (const s of data.subjects) {
  ansChildren.push(subjHeading(s.title));
  for (const it of s.items) {
    no++;
    ansChildren.push(new Paragraph({ keepNext: true, spacing: { before: 60, after: 20 }, children: [
      new TextRun({ text: `${no}. 정답 ${C[it.a - 1]}  `, bold: true, size: 19 }),
      new TextRun({ text: it.c[it.a - 1], size: 19, color: BLUE }),
    ] }));
    ansChildren.push(p(it.e, { indent: 240, size: 18, after: 60 }));
  }
}
ansChildren.push(p('— 끝 —', { align: AlignmentType.CENTER, after: 0 }));
sections.push({ properties: { type: SectionType.NEXT_PAGE }, children: ansChildren });

const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 16 })] })] });
const margin = { top: 850, bottom: 850, left: 1134, right: 1134 };
sections.forEach((s) => { s.properties.page = { margin }; s.footers = { default: footer }; });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 19 } } } },
  sections,
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('wrote', out); });
