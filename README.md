# 경제카드 (아침 경제 카드뉴스 PWA)

평일 아침 Claude 예약 작업이 만든 경제 카드뉴스를 **아이폰 홈 화면 앱**으로 보고, **웹 푸시 알림**으로 받는 앱입니다.

## 구조

```
[Claude 예약 작업 07:52] → docs/cards/YYYY-MM-DD.html + docs/cards/index.json 을 main에 커밋
        ↓
[GitHub Pages] docs/ 폴더를 웹앱으로 배포
        ↓
[GitHub Actions: push-notify.yml] Pages 반영을 기다린 뒤 등록된 아이폰으로 웹 푸시
        ↓
[아이폰] 알림 탭 → 앱에서 오늘 카드뉴스 열림
```

| 경로 | 역할 |
|---|---|
| `docs/index.html`, `app.js`, `style.css` | 앱 화면 (오늘 / 목록·검색 / 공부 / 즐겨찾기 / 설정) |
| `docs/sw.js` | 오프라인 저장(최근 10개), 푸시 수신 |
| `docs/manifest.webmanifest`, `docs/icons/` | 홈 화면 설치 정보 |
| `docs/config.js` | VAPID **공개키** (비밀 아님) |
| `docs/cards/` | 카드뉴스 HTML과 목록 `index.json` |
| `scripts/send-push.mjs` | 푸시 발송 스크립트 |
| `.github/workflows/push-notify.yml` | 새 카드가 올라오면 알림 발송, 수동 테스트 발송 |

## 처음 한 번 설정

1. **GitHub Pages 켜기**: 저장소 Settings → Pages → Source: *Deploy from a branch*, Branch: `main` / 폴더 `/docs` → Save
   - 비공개 저장소에서 Pages를 쓰려면 유료 요금제가 필요할 수 있습니다(확인 필요). 무료라면 저장소를 Public으로 바꿔야 합니다.
2. **Secret 등록**: Settings → Secrets and variables → Actions → *New repository secret*
   - `VAPID_PRIVATE_KEY`: 따로 전달받은 개인키
3. **아이폰에 설치**: Safari로 `https://shingmldbs8-png.github.io/-/` 열기 → 공유(□↑) → *홈 화면에 추가*
4. **알림 켜기**: 홈 화면의 *경제카드* 실행 → 설정 탭 → 🔔 알림 켜기 → *등록 코드 복사*
5. **기기 등록**: Secret `PUSH_SUBSCRIPTIONS` 에 복사한 코드를 붙여 넣기
   - 기기가 여러 대면 `[{...}, {...}]` 처럼 대괄호 하나 안에 합쳐 넣습니다.
6. **테스트**: Actions → *카드뉴스 알림 보내기* → *Run workflow* → 아이폰에 알림이 오면 완료

## index.json 항목 형식

```json
{
  "date": "2026-11-23",
  "file": "2026-11-23.html",
  "title": "표지 제목 한 문장",
  "summary": "결론 2~3문장",
  "basis": "11/21(금) 마감 기준",
  "push": "알림에 보일 핵심 한 줄",
  "numbers": [{ "label": "코스피", "value": "3,950", "change": "-1.2%" }],
  "tags": ["금리", "반도체", "환율"],
  "headlines": ["각 카드 제목"],
  "study": [{ "concept": "점도표", "desc": "한두 문장 설명" }]
}
```
`items` 배열 맨 앞(최신순)에 추가합니다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 알림이 안 옴 | Actions 실행 기록의 *알림 전송* 로그. `410` 이면 기기 등록이 만료됨 → 앱 설정 탭에서 코드를 다시 복사해 Secret 갱신 |
| 설정 탭에 "홈 화면에 추가" 안내만 나옴 | Safari 탭이 아니라 홈 화면 아이콘으로 열었는지 확인 (iOS 16.4 이상) |
| 새 카드가 안 보임 | 앱을 완전히 닫았다 다시 열기, 설정 탭 *목록 새로고침* |
