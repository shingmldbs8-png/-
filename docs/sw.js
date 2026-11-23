// 경제 카드뉴스 서비스워커: 오프라인 캐시 + 웹 푸시
const VERSION = "v4";
const SHELL = `shell-${VERSION}`;
const CARDS = "cards";
const SHELL_FILES = ["./", "index.html", "style.css", "app.js", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];
const KEEP_CARDS = 10; // 기기에 보관할 카드뉴스 수

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL && k !== CARDS) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trimCards() {
  const c = await caches.open(CARDS);
  const keys = (await c.keys()).filter((r) => /\/cards\/\d{4}-\d{2}-\d{2}.*\.html$/.test(r.url))
    .sort((a, b) => (a.url < b.url ? 1 : -1));
  for (const r of keys.slice(KEEP_CARDS)) await c.delete(r);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 목록·카드: 네트워크 먼저, 실패하면 저장본 (항상 최신을 보여 주되 오프라인도 지원)
  if (url.pathname.includes("/cards/")) {
    e.respondWith((async () => {
      const c = await caches.open(CARDS);
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) { await c.put(req, res.clone()); if (url.pathname.endsWith(".html")) trimCards(); }
        return res;
      } catch {
        const hit = await c.match(req, { ignoreSearch: true });
        return hit || new Response("<p style='font-family:sans-serif;padding:24px'>오프라인이라 이 카드뉴스를 열 수 없어요.</p>", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }
  // 앱 화면: 저장본 먼저, 뒤에서 갱신
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || c.match("index.html");
  })());
});

// ---------- 푸시 ----------
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const title = d.title || "🦉 오늘의 경제 카드뉴스";
  e.waitUntil((async () => {
    // 새 카드뉴스를 미리 받아 두기 (알림을 누르면 바로 열리게)
    if (d.file) { try { const c = await caches.open(CARDS); const r = await fetch(`cards/${d.file}`, { cache: "no-cache" }); if (r.ok) await c.put(`cards/${d.file}`, r); } catch {} }
    await self.registration.showNotification(title, {
      body: d.body || "새 카드뉴스가 도착했어요.",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: d.tag || "card-news",
      data: { url: d.url || "./#/today" }
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "./#/today", self.registration.scope).href;
  const hash = new URL(target).hash;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) { w.postMessage({ type: "open", hash }); return w.focus(); }
    }
    return self.clients.openWindow(target);
  })());
});
