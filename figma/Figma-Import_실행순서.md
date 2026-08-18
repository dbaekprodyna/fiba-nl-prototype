# Figma 임포트 — 실행 순서 (Variables → Components)

**역할 분담**
- **너 (Figma 안에서)**: 파일·페이지 만들기, 변수 임포트, html.to.design 임포트, 레이어 개명, Agent 프롬프트 실행
- **나 (MCP로)**: 들어간 결과 검증(`get_variable_defs` / `get_metadata` / `get_screenshot`), Code Connect 매핑 작성·전송

> 현재 MCP는 **읽기 + Code Connect만** 가능. 노드·변수 **생성은 불가**. 생성은 전부 네 손 또는 Agent.

---

## PHASE 0 · 준비 (10분, 발표 전 미리)

1. **Figma Desktop** 실행 (웹 아님 — MCP는 데스크톱만)
2. Figma 메뉴 → Preferences → **Enable Dev Mode MCP Server** 체크 → 나한테 켰다고 말해줘
3. 새 Design 파일: `FIBA NL — Design System`
4. 페이지 4개 만들기: `00 Foundations` / `01 Elements` / `02 Modules` / `03 Templates`
5. **html.to.design** 플러그인 설치 확인
6. 로컬 서버 켜기 (`fiba-nl-prototype` 루트에서) — html.to.design이 URL을 읽어야 함

---

## PHASE 1 · Variables (너, 15분) — **컴포넌트보다 먼저. 예외 없음**

변수가 없는 상태에서 컴포넌트를 만들면 색이 하드코딩된 채 굳고, 나중에 전부 다시 해야 해.

### 1-A. 먼저 native import를 시도
Variables 패널 → `⋯` 메뉴 → **Import**. 있으면 `fiba-nl-prototype/figma/tokens.json` 드롭 → 끝.

### 1-B. 없으면 Figma Agent로 3패스 (한 패스 = 한 프롬프트)

**패스 1 — 색상 (28개)**
```
Create a variable collection named "FIBA NL" with a single mode called "Light".
Add COLOR variables in these groups, using exactly these names and hex values:

surface/page #FFFFFF · surface/raised #FAFAFA · surface/sunken #F5F5F5 · surface/sunken-2 #E5E5E5
border/subtle #E5E5E5 · border/default #D4D4D4 · border/strong #A3A3A3
text/primary #0A0A0A · text/secondary #525252 · text/muted #737373 · text/disabled #A3A3A3 · text/inverse #FFFFFF
action/default #000000 · action/hover #262626 · action/pressed #404040 · action/disabled #D4D4D4 · action/ghost-bg #F5F5F5
status/live #E30613 · status/qualified #009A3E · status/shortlisted #F9B123 · status/neutral #737373
chrome/bg #171717 · chrome/bg-2 #262626 · chrome/text #FFFFFF · chrome/text-muted #A3A3A3 · chrome/line #262626 · chrome/accent #DBC068 · chrome/hover #2E2E2E

Do not invent extra variables. Do not change the names.
```

**패스 2 — 숫자 (14개)**
```
In the "FIBA NL" collection, add NUMBER variables with these exact names and values:
space/1 4 · space/2 8 · space/3 12 · space/4 16 · space/5 24 · space/6 32 · space/7 48 · space/8 64 · space/9 96
cut/s 8 · cut/m 12 · cut/l 16
content/max 1440 · gutter/default 240
```

**패스 3 — 모션 (6개)**
```
In the "FIBA NL" collection, add these variables:
NUMBER: dur/fast 120 · dur/base 200 · dur/slow 360 · dur/page 480
STRING: ease/out "cubic-bezier(0.22, 1, 0.36, 1)" · ease/in-out "cubic-bezier(0.65, 0, 0.35, 1)"
```

> **주의 — Figma 변수는 Color / Number / String / Boolean 네 타입뿐이야.**
> `120ms` → Number `120` (단위 없이), `cubic-bezier(...)` → String. px도 Number.
> 이걸 모르고 "120ms"를 그대로 넣으면 String으로 잡혀서 나중에 바인딩이 안 돼.

### 1-C. 다크 모드 자리만 남겨두기
지금은 Light 모드 하나만. 컬렉션에 mode를 추가할 수 있게 컬렉션으로 만들어두는 것이 핵심 (스타일이 아니라 **변수**여야 하는 이유).

### 1-D. → 나한테 넘겨
"변수 다 넣었어"라고 하면 내가 `get_variable_defs`로 읽어서 코드의 **48개 토큰**과 이름·값을 1:1 대조하고, 빠지거나 오타난 것 리스트로 돌려줄게.

---

## PHASE 2 · Elements → Component Sets (너 + Agent)

`figma-export/` 에 35개 파일이 있는데, **내일은 전부 하지 마.** 3~5개만.
추천 순서 (쉬운 것 → 개념이 잘 보이는 것):
`el-05 statusbadge` → `ctl-01 button` → `el-02 genderswitch` → `el-14 chip` → `el-18 navtab`

### 2-A. 한 파일씩 임포트 (html.to.design)

| 옵션 | 값 |
|---|---|
| Viewport width | 1200 |
| Import as | **Layers** (not image) |
| Auto Layout detection | ON |
| Preserve class names | **ON** |
| Load fonts | ON |
| Inline SVG as vector | ON |

여러 개를 한 번에 넣으면 레이어 트리가 뭉개져. 무조건 하나씩.

### 2-B. 임포트 직후 — **레이어 개명** (건너뛰면 이후 전부 실패)
```
Rename the layers in the selected frame so each variant row is named
"<component>/<state>" — for example "StatusBadge/live", "StatusBadge/final".
Keep the existing hierarchy. Do not move or resize anything.
```

### 2-C. Component Set 만들기
```
Take the selected frame. Each row is one state of the same component.
Combine them into a single Component Set named "el-05 StatusBadge",
with one variant property called "state".
Do not change any colors, sizes, or spacing.
```

### 2-D. 변수 바인딩 (여기서 Phase 1이 값을 함)
```
In the selected component set, replace every hardcoded fill, stroke, corner
radius and padding value with the matching variable from the "FIBA NL"
collection. If no variable matches a value exactly, leave it as is and list
it for me at the end.
```
마지막 문장이 중요해 — Agent가 억지로 근사값을 끼워 맞추는 걸 막아줘.

### 2-E. 육안 검증
각 단계 사이에 반드시 눈으로 확인. Agent 작업 3개를 겹쳐 쌓은 뒤에는 Undo로 못 돌아가.

---

## PHASE 3 · 내가 MCP로 하는 것 (네가 "됐어" 하면)

1. `get_metadata` — 페이지·컴포넌트 세트 구조가 의도대로인지
2. `get_variable_defs` — 48개 토큰 대조표
3. `get_screenshot` — 컴포넌트별 시각 검증, 코드 렌더와 비교
4. `get_code_connect_suggestions` → `send_code_connect_mappings`
   - 예: `el-05 StatusBadge` → `.badge` in `assets/elements.css`
   - 결과: 개발자가 Dev Mode를 열면 생성된 CSS가 아니라 **우리 실제 클래스명**이 보임
   - 매핑은 Figma 파일에 저장되니까 파일 여는 사람 전부가 봄

---

## PHASE 4 · Modules / Templates — 내일은 하지 마

모듈은 엘리먼트 인스턴스로 재조립하는 단계라 엘리먼트가 전부 안정된 뒤에 해야 해.
내일은 **"변수 → 엘리먼트 → Code Connect"** 한 줄기만 보여주는 게 훨씬 설득력 있어.

---

## 내일 데모용 축소판 (라이브로 8분)

1. `tokens.json` 열어서 보여주기 (30초)
2. Variables 패널에 **색상 패스 1개만** 라이브 실행 (2분)
3. `el-05 statusbadge` html.to.design 임포트 (1분)
4. 개명 → Component Set → 변수 바인딩, Agent 프롬프트 3개 (3분)
5. 나한테 넘겨서 `get_variable_defs` 대조 결과 화면에 띄우기 (1분)

**라이브 실패 대비:** 위 5단계를 오늘 밤에 한 번 끝까지 돌려놓고, 완성된 Figma 파일을 별도 탭에 열어둬.
라이브가 막히면 "이건 어제 돌린 결과"로 넘어가면 돼.
