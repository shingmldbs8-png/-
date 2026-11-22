// 최신 카드뉴스 알림을 등록된 모든 기기로 보낸다 (GitHub Actions에서 실행)
// 필요한 Secret: VAPID_PRIVATE_KEY, PUSH_SUBSCRIPTIONS(JSON 배열)
import fs from "node:fs";
import webpush from "web-push";

const cfg = fs.readFileSync("docs/config.js", "utf8");
const publicKey = (cfg.match(/vapidPublicKey:\s*"([^"]+)"/) || [])[1];
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subsRaw = process.env.PUSH_SUBSCRIPTIONS;
const subject = process.env.VAPID_SUBJECT || "https://github.com";

if (!publicKey || !privateKey) { console.error("VAPID 키가 없습니다 (config.js 공개키 / Secret VAPID_PRIVATE_KEY)"); process.exit(1); }
if (!subsRaw) { console.error("Secret PUSH_SUBSCRIPTIONS가 비어 있습니다. 앱 설정 탭의 등록 코드를 넣어 주세요."); process.exit(1); }

let subs;
try { subs = JSON.parse(subsRaw); if (!Array.isArray(subs)) subs = [subs]; subs = subs.flat(); }
catch { console.error("PUSH_SUBSCRIPTIONS가 올바른 JSON이 아닙니다."); process.exit(1); }

let payload;
if (process.env.TEST_MESSAGE) {
  payload = { title: "🦉 경제카드 테스트 알림", body: process.env.TEST_MESSAGE, url: "./#/today", tag: "test" };
} else {
  const idx = JSON.parse(fs.readFileSync("docs/cards/index.json", "utf8"));
  const it = (idx.items || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!it) { console.log("카드뉴스가 없어 알림을 보내지 않습니다."); process.exit(0); }
  const nums = (it.numbers || []).slice(0, 3).map((n) => `${n.label} ${n.value}${n.change ? " " + n.change : ""}`).join(" · ");
  payload = {
    title: `🦉 ${it.title}`.slice(0, 80),
    body: [it.push || it.summary, nums].filter(Boolean).join("\n").slice(0, 180),
    url: `./#/card/${it.date}`,
    file: it.file,
    tag: `card-${it.date}`
  };
}

webpush.setVapidDetails(subject, publicKey, privateKey);
let ok = 0, fail = 0;
for (const s of subs) {
  try { await webpush.sendNotification(s, JSON.stringify(payload), { TTL: 60 * 60 * 12, urgency: "high" }); ok++; }
  catch (e) {
    fail++;
    const gone = e.statusCode === 404 || e.statusCode === 410;
    console.error(`전송 실패 (${e.statusCode || "?"})${gone ? " → 만료된 기기입니다. 앱에서 등록 코드를 다시 받아 Secret을 갱신하세요." : ""} ${e.body || e.message}`);
  }
}
console.log(`알림 전송: 성공 ${ok}, 실패 ${fail}`);
if (ok === 0) process.exit(1);
