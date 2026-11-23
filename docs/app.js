(() => {
  "use strict";
  const CFG = window.APP_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const view = $("#view"), viewer = $("#viewer"), frame = $("#frame");
  const titleEl = $("#title"), backBtn = $("#backBtn"), favBtn = $("#favBtn");
  let items = [];          // index.json items (newest first)
  let loadError = null;
  let listQuery = "", listTag = "";

  // ---------- 유틸 ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const favs = () => store.get("favs", []);
  const isFav = (date) => favs().includes(date);
  function toggleFav(date) {
    const f = favs(); const i = f.indexOf(date);
    if (i >= 0) f.splice(i, 1); else f.unshift(date);
    store.set("favs", f); toast(i >= 0 ? "즐겨찾기에서 뺐어요" : "즐겨찾기에 담았어요 ⭐");
  }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200);
  }
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  function fmtDate(d) { const [y, m, dd] = String(d).slice(0, 10).split("-").map(Number); const w = WD[new Date(y, m - 1, dd).getDay()]; return { y, m, d: dd, w, full: `${y}.${String(m).padStart(2, "0")}.${String(dd).padStart(2, "0")} (${w})` }; }
  // 하루 두 번(오전 am: 미국장·세계 / 오후 pm: 한국장·국내). id 예: 2026-11-24-am. 예전 항목은 id 없이 date만 있음
  const keyOf = (it) => it.id || it.date;
  const EDITIONS = { am: "🌎 오전 · 미국장·세계", pm: "🇰🇷 오후 · 한국장·국내" };
  const edLabel = (it) => EDITIONS[it.edition || (String(keyOf(it)).match(/-(am|pm)$/) || [])[1]] || "";
  const byDate = (k) => items.find((x) => keyOf(x) === k);
  const isStandalone = () => window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ---------- 데이터 ----------
  async function loadIndex() {
    try {
      const r = await fetch("cards/index.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      items = (j.items || []).slice().sort((a, b) => (keyOf(a) < keyOf(b) ? 1 : -1));
      loadError = null;
      // 최근 5개는 미리 받아 두기 → 오프라인에서도 열림 (서비스워커가 캐시)
      items.slice(0, 5).forEach((it) => fetch("cards/" + it.file).catch(() => {}));
    } catch (e) { loadError = e; }
  }

  // ---------- 화면 ----------
  function setChrome({ title, back = false, fav = null, tab = null }) {
    titleEl.textContent = title;
    backBtn.hidden = !back;
    favBtn.hidden = !fav;
    if (fav) { favBtn.textContent = isFav(fav) ? "★" : "☆"; favBtn.dataset.date = fav; }
    document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  }
  function showViewer(on) {
    viewer.hidden = !on; document.body.classList.toggle("viewing", on);
    if (!on && frame.src) frame.removeAttribute("src");
  }
  function itemHTML(it) {
    const f = fmtDate(it.date);
    const tags = (it.tags || []).slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    const ed = edLabel(it);
    return `<div class="item" data-open="${esc(keyOf(it))}" role="link" tabindex="0">
      <div class="d">${f.m}월<b>${f.d}</b>${f.w}</div>
      <div class="t">${ed ? `<div class="note" style="margin:0">${esc(ed)}</div>` : ""}<h3>${esc(it.title)}</h3><p>${esc(it.summary || "")}</p>${tags ? `<div class="tags">${tags}</div>` : ""}</div>
      ${isFav(keyOf(it)) ? '<span class="star">★</span>' : ""}</div>`;
  }
  function emptyHTML(icon, msg) { return `<div class="empty"><span class="big">${icon}</span>${msg}</div>`; }
  function errorHTML() {
    return emptyHTML("📡", "카드뉴스 목록을 불러오지 못했어요.<br>인터넷 연결을 확인한 뒤 다시 열어 주세요.") +
      `<button class="btn ghost" data-act="reload">다시 시도</button>`;
  }

  function renderToday() {
    setChrome({ title: "오늘의 경제", tab: "today" });
    if (loadError && !items.length) return (view.innerHTML = errorHTML());
    if (!items.length) return (view.innerHTML = emptyHTML("🗞️", "아직 카드뉴스가 없어요.<br>오전(미국장·세계)과 오후(한국장·국내) 하루 두 번 도착해요."));
    const it = items[0], f = fmtDate(it.date);
    const chips = (it.numbers || []).slice(0, 6).map((n) => {
      const c = String(n.change || ""); const cls = c.startsWith("+") || c.startsWith("▲") ? "up" : c.startsWith("-") || c.startsWith("▼") ? "down" : "";
      return `<span class="chip">${esc(n.label)} <b>${esc(n.value)}</b> <span class="${cls}">${esc(c)}</span></span>`;
    }).join("");
    const study = (it.study || []).map((s) => `<span class="tag">📚 ${esc(s.concept)}</span>`).join("");
    const prev = items.slice(1, 4).map(itemHTML).join("");
    view.innerHTML = `
      <section class="card hero">
        <div class="date">${esc(f.full)}${edLabel(it) ? " · " + esc(edLabel(it)) : ""}${it.basis ? " · " + esc(it.basis) : ""}</div>
        <h2>${esc(it.title)}</h2>
        ${it.summary ? `<p>${esc(it.summary)}</p>` : ""}
        ${chips ? `<div class="chips">${chips}</div>` : ""}
        <button class="btn" data-open="${esc(keyOf(it))}">카드뉴스 보기 →</button>
      </section>
      ${study ? `<div class="sec-title">오늘의 공부 포인트</div><div class="tags" style="margin:0 2px 8px">${study}</div>` : ""}
      ${prev ? `<div class="sec-title">지난 카드뉴스</div>${prev}<a class="btn ghost" href="#/list">전체 목록 보기</a>` : ""}
      ${pushHint()}`;
  }

  function pushHint() {
    if (store.get("pushOn", false)) return "";
    return `<div class="card" style="margin-top:14px"><div class="status"><span class="dot warn"></span>알림이 꺼져 있어요</div>
      <p class="note" style="margin:0 0 10px">설정 탭에서 알림을 켜면 카드뉴스가 올라올 때 알려 드려요.</p>
      <a class="btn ghost" href="#/settings">알림 설정하기</a></div>`;
  }

  function allTags() {
    const cnt = {};
    items.forEach((it) => (it.tags || []).forEach((t) => (cnt[t] = (cnt[t] || 0) + 1)));
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 12);
  }
  function matches(it, q) {
    if (!q) return true;
    const hay = [it.title, it.summary, edLabel(it), ...(it.tags || []), ...(it.headlines || []), ...(it.study || []).map((s) => s.concept + " " + (s.desc || "")), it.date].join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }
  function renderList() {
    setChrome({ title: "전체 목록 · 검색", tab: "list" });
    if (loadError && !items.length) return (view.innerHTML = errorHTML());
    const tags = allTags();
    view.innerHTML = `
      <div class="search">
        <input id="q" type="search" placeholder="예: 환율, 반도체, 금리" value="${esc(listQuery)}" autocomplete="off" enterkeyhint="search" aria-label="검색">
        ${tags.length ? `<div class="filter" id="tagbar"><button data-tag="" class="${listTag ? "" : "on"}">전체</button>${tags.map((t) => `<button data-tag="${esc(t)}" class="${t === listTag ? "on" : ""}">${esc(t)}</button>`).join("")}</div>` : ""}
      </div><div id="results"></div>`;
    const draw = () => {
      const res = items.filter((it) => matches(it, listQuery) && (!listTag || (it.tags || []).includes(listTag)));
      $("#results").innerHTML = res.length ? `<div class="note">${res.length}개</div>` + res.map(itemHTML).join("") : emptyHTML("🔍", items.length ? "검색 결과가 없어요." : "아직 카드뉴스가 없어요.");
    };
    $("#q").addEventListener("input", (e) => { listQuery = e.target.value; draw(); });
    const bar = $("#tagbar");
    if (bar) bar.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      listTag = b.dataset.tag; bar.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });
    draw();
  }

  function renderStudy() {
    setChrome({ title: "공부 포인트 모아보기", tab: "study" });
    if (loadError && !items.length) return (view.innerHTML = errorHTML());
    const list = [];
    items.forEach((it) => (it.study || []).forEach((s) => list.push({ ...s, date: keyOf(it) })));
    if (!list.length) return (view.innerHTML = emptyHTML("📚", "아직 모인 공부 포인트가 없어요."));
    view.innerHTML = `<div class="note">지금까지 배운 경제 개념 ${list.length}개</div>` + list.map((s) => `
      <div class="study"><h3>📚 ${esc(s.concept)}</h3>${s.desc ? `<p>${esc(s.desc)}</p>` : ""}
      <a href="#/card/${esc(s.date)}">${esc(fmtDate(s.date).full)} 카드뉴스에서 보기 →</a></div>`).join("");
  }

  function renderFav() {
    setChrome({ title: "즐겨찾기", tab: "fav" });
    const list = favs().map(byDate).filter(Boolean);
    view.innerHTML = list.length ? list.map(itemHTML).join("") : emptyHTML("⭐", "카드뉴스를 열고 오른쪽 위 ☆를 누르면<br>여기에 모여요.");
  }

  // ---------- 알림 ----------
  function urlB64ToUint8(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  async function getSub() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }
  async function renderSettings() {
    setChrome({ title: "알림 설정", tab: "settings" });
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    let body = "";
    if (isIOS() && !isStandalone()) {
      body = `<div class="card"><div class="status"><span class="dot warn"></span>먼저 홈 화면에 추가해 주세요</div>
        <p class="note" style="margin:0">아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요 (iOS 16.4 이상).</p>
        <ol class="steps"><li>Safari 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요</li><li><b>홈 화면에 추가</b>를 고르세요</li><li>홈 화면의 <b>경제카드</b> 아이콘으로 앱을 열고, 다시 이 화면에 오세요</li></ol></div>`;
    } else if (!supported) {
      body = `<div class="card"><div class="status"><span class="dot warn"></span>이 기기는 웹 푸시 알림을 지원하지 않아요</div><p class="note" style="margin:0">iOS 16.4 이상으로 업데이트한 뒤 다시 시도해 주세요.</p></div>`;
    } else {
      let sub = await getSub().catch(() => null); const ak = sub && sub.options && sub.options.applicationServerKey; if (ak && btoa(String.fromCharCode(...new Uint8Array(ak))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") !== CFG.vapidPublicKey) { await sub.unsubscribe().catch(() => {}); sub = null; }
      const perm = Notification.permission;
      if (sub && perm === "granted") {
        store.set("pushOn", true);
        const code = JSON.stringify([sub.toJSON()]);
        body = `<div class="card"><div class="status"><span class="dot ok"></span>이 기기에서 알림 받을 준비 완료</div>
          <p class="note" style="margin:0">처음 한 번만, 아래 <b>등록 코드</b>를 복사해서 GitHub 저장소 Secret <b>PUSH_SUBSCRIPTIONS</b>에 붙여 넣어 주세요. 그래야 서버가 이 아이폰으로 알림을 보낼 수 있어요.</p>
          <textarea class="code" id="subcode" readonly>${esc(code)}</textarea>
          <div class="row"><button class="btn" data-act="copy">등록 코드 복사</button></div>
          <div class="row"><button class="btn ghost" data-act="local-test">이 기기 알림 미리보기</button></div>
          <div class="row"><button class="btn danger" data-act="unsub">알림 끄기</button></div></div>`;
      } else if (perm === "denied") {
        body = `<div class="card"><div class="status"><span class="dot warn"></span>알림이 차단되어 있어요</div>
          <p class="note" style="margin:0">아이폰 <b>설정 → 알림 → 경제카드</b>에서 알림 허용을 켠 뒤 다시 열어 주세요.</p></div>`;
      } else {
        store.set("pushOn", false);
        body = `<div class="card"><div class="status"><span class="dot warn"></span>알림이 꺼져 있어요</div>
          <p class="note" style="margin:0 0 10px">오전(미국장·세계)과 오후(한국장·국내) 카드뉴스가 올라오면 알림으로 알려 드려요.</p>
          <button class="btn" data-act="sub">🔔 알림 켜기</button></div>`;
      }
    }
    view.innerHTML = body + `
      <div class="card"><div class="status">📱 앱 정보</div>
        <p class="note" style="margin:0">홈 화면 실행: ${isStandalone() ? "예" : "아니요"} · 저장된 카드뉴스 ${items.length}개<br>
        최근 카드뉴스 5개는 기기에 저장되어 인터넷이 없어도 열려요.</p>
        <div class="row"><button class="btn ghost" data-act="reload">목록 새로고침</button></div></div>`;
  }
  async function subscribe() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast("알림이 허용되지 않았어요"); return renderSettings(); }
      const reg = await navigator.serviceWorker.ready;
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(CFG.vapidPublicKey) });
      toast("알림을 켰어요 🔔");
    } catch (e) { toast("알림 켜기 실패: " + (e.message || e)); }
    renderSettings();
  }

  // ---------- 라우터 ----------
  async function route() {
    const h = location.hash || "#/today";
    const m = h.match(/^#\/card\/(\d{4}-\d{2}-\d{2}(?:-(?:am|pm))?)/);
    if (m) {
      // 예전 링크(#/card/날짜)는 그 날짜의 최신 판으로 연결
      const it = byDate(m[1]) || items.find((x) => x.date === m[1]);
      const k = it ? keyOf(it) : m[1];
      const ed = it ? (it.edition || (String(k).match(/-(am|pm)$/) || [])[1]) : "";
      setChrome({ title: fmtDate(k).full + (ed === "am" ? " 오전" : ed === "pm" ? " 오후" : ""), back: true, fav: k });
      if (!it) { showViewer(false); view.innerHTML = emptyHTML("🤔", "이 날짜의 카드뉴스를 찾지 못했어요."); return; }
      const src = "cards/" + it.file;
      if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
      showViewer(true); store.set("lastSeen", it.date);
      return;
    }
    showViewer(false);
    const tab = h.replace(/^#\//, "").split("/")[0];
    ({ list: renderList, study: renderStudy, fav: renderFav, settings: renderSettings }[tab] || renderToday)();
    window.scrollTo(0, 0);
  }

  // ---------- 이벤트 ----------
  document.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { location.hash = "#/card/" + o.dataset.open; return; }
    const a = e.target.closest("[data-act]"); if (!a) return;
    const act = a.dataset.act;
    if (act === "reload") { await loadIndex(); route(); toast("새로고침했어요"); }
    if (act === "sub") subscribe();
    if (act === "copy") {
      const ta = $("#subcode");
      try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); document.execCommand("copy"); }
      toast("복사했어요. GitHub Secret에 붙여 넣어 주세요");
    }
    if (act === "local-test") {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("🦉 경제카드 알림 미리보기", { body: "알림이 이렇게 표시돼요.", icon: "icons/icon-192.png", data: { url: "./#/today" } });
    }
    if (act === "unsub") { const s = await getSub(); if (s) await s.unsubscribe(); store.set("pushOn", false); toast("알림을 껐어요"); renderSettings(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("[data-open]")) e.target.click(); });
  // 앱 안에서 이동한 적이 있으면 뒤로, 알림으로 바로 열었으면 오늘 화면으로
  let navCount = 0;
  backBtn.addEventListener("click", () => { if (navCount > 0) history.back(); else location.hash = "#/today"; });
  window.addEventListener("hashchange", () => { navCount++; route(); });
  favBtn.addEventListener("click", () => { const d = favBtn.dataset.date; toggleFav(d); favBtn.textContent = isFav(d) ? "★" : "☆"; });

  // 알림을 눌러 앱이 이미 열려 있을 때 해당 카드로 이동
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", async (e) => {
      if (e.data && e.data.type === "open" && e.data.hash) { await loadIndex(); location.hash = e.data.hash; route(); }
    });
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") { const n = items.length; await loadIndex(); if (items.length !== n && !location.hash.startsWith("#/card/")) route(); }
  });

  (async () => { view.innerHTML = emptyHTML("⏳", "불러오는 중…"); await loadIndex(); route(); })();
})();
