# v0.6.14 변경

- 근무표의 **저장**과 **사용**을 분리했다. Excel을 저장해도 현재 사용 중인 근무표가 자동으로 바뀌지 않는다.
- 여러 월의 근무표를 IndexedDB에 누적 저장하고, 목록의 `사용` 버튼으로 활성 근무표를 전환한다.
- 활성 근무표는 `localStorage`의 활성 ID로 별도 관리하며, 현재 선택 날짜와 다른 월을 선택하면 해당 월 근무표가 없음을 표시한다.
- 활성 근무표를 삭제하면 샘플 데이터로 안전하게 전환한다. 비활성 근무표 삭제는 현재 사용 상태에 영향을 주지 않는다.
- 날짜 팝업을 포함한 ESC 닫기 동작을 공통 처리하고, 여러 overlay가 열려 있을 때는 가장 위의 팝업부터 닫도록 수정했다.
- 수동 입력 중에는 전체 `render()`를 호출하지 않고 현재 편집 DOM과 `manualAssignments`만 갱신한다. `수정 완료` 시 한 번만 화면을 다시 그리는 현재 구조를 유지해 커서 점프/입력값 재생성 위험을 줄였다.

- 수동 배치 구조를 **자동 배치 결과와 수동 override의 분리** 형태로 정리했다. 자동 배치는 매 렌더링 시 다시 계산할 수 있지만, 수동 override가 있으면 최종 표시에서 항상 수동 값을 우선한다.
- 소화반·대피유도반의 여러 근무자를 하나의 문자열로 묶지 않고 **사람별 slot**으로 취급한다. 따라서 수정 모드에서 각 사람의 이름을 독립적으로 수정할 수 있다.
- `·` 구분자는 데이터가 아니라 화면 표시용으로만 사용한다. 구분자를 삭제한다고 배치 데이터 자체가 합쳐지거나 분리되는 구조가 아니다.
- 수동 입력 중에는 전체 `render()`를 호출하지 않으며, 현재 편집 중인 DOM의 입력값을 해당 slot의 override에 반영한다. 수정 완료 시 화면을 한 번 갱신한다.
- 역할별 초기화는 해당 날짜·듀티·역할의 override만 제거하도록 유지했다.

## v0.6.8 변경
- PC 버전 날짜 선택 달력의 이전/다음 달 화살표 동작을 확인 및 유지. `‹`/`›`는 표시 월만 이동하고, 날짜 선택 시 해당 날짜로 확정한다.
- 인접 월 날짜 클릭 기능도 유지한다.

## v0.6.6 변경
- 날짜 선택과 근무표 존재 여부를 분리했다. 저장된 근무표가 없는 월도 날짜를 자유롭게 선택할 수 있다.
- 선택한 날짜의 월에 근무표가 있으면 해당 월 근무표를 사용하고, 없으면 근무표 없음 상태를 표시한다.
- 연·월별 근무표를 여러 개 저장하며, 동일 연·월 재가져오기 시 기존 근무표 교체 여부를 확인한다.
- 같은 월의 근무표를 교체하면 이전 근무표 기준 수동 배치를 초기화한다.

# v0.6.4

- 소화반을 2개 개별 패널이 아닌 하나의 패널로 통합.
- 차선임과 3번째 선임 이름을 ` · `로 한 줄에 나열.
- 좁은 화면에서는 CSS에 따라 자연스럽게 줄바꿈.
- 자동 배치 규칙 및 parser는 변경하지 않음.

# 화재대피 인원배치 개발노트

## Version
**v0.6.6**

## 프로젝트 성격

MICU 월간 근무표 Excel을 입력 데이터로 사용하여 현재 날짜/듀티의 근무자를 자동 추출하고, 화재대피 기본 규칙에 따라 인원을 배치한 뒤 최종적으로 실제 MICU의 화재대피판 형태로 표시하는 브라우저 기반 애플리케이션.

개발 방식은 기존 RAAS Simulator 및 Cardiac Electrophysiology Simulator에서 사용했던 방식처럼 **명확한 데이터 모델 → 로직/Rule Engine → UI → 단계별 패치 → 검증** 순서로 진행한다.

---

# 1. v0.4 변경사항

## 1.1 현재 시점 새로고침 버튼

상단의 `근무표`와 `⚙` 사이에 `↻` 버튼을 추가했다.

이 버튼은 브라우저 페이지를 새로고침하는 기능이 아니다.

**현재 컴퓨터의 날짜와 시간을 다시 읽어 프로그램의 현재 상태를 재설정하는 기능**이다.

### 동작

```text
↻ 클릭
  ↓
현재 날짜/시간 확인
  ↓
현재 월 근무표 검색
  ↓
현재 날짜 설정
  ↓
현재 시각 → D/E/N 판정
  ↓
해당 날짜/듀티 근무자 추출
  ↓
배치 Rule Engine 재실행
  ↓
화면 갱신
```

### 예시

현재 화면:

```text
2026-09-15 E
```

실제 현재 시간이:

```text
2026-09-16 22:10
```

이라면 `↻` 클릭 후:

```text
2026-09-16 N
```

으로 이동한다.

---

# 2. 근무 코드

| 코드 | 의미 | 처리 |
|---|---|---|
| D | Day | 근무 |
| E | Evening | 근무 |
| N | Night | 근무 |
| NC | Night Keeper | N과 동일 |
| 기타 | NV, OF, C, PE, V 등 | 전부 비근무 |

## 근무시간

- D: 07:00–15:30
- E: 15:00–22:30
- N: 22:00–07:00

현재 시각 기반 듀티 판정:

- 07:00–14:59 → D
- 15:00–21:59 → E
- 그 외 → N

---

# 3. Excel Parser 원칙

현재 테스트 파일은 실습 중 임의로 만든 근무표이며, 실제 UM 선생님이 사용하는 공식 기본 양식이 아니다.

따라서 현재 Excel Parser는 **테스트용 Parser**로 취급한다.

현재 원칙:

1. 첫 번째 시트 사용
2. 이름 열을 읽음
3. 숫자 형태의 날짜 헤더를 찾아 날짜 열을 동적으로 매핑
4. D/E/N/NC만 근무 코드로 인정
5. NC는 N으로 정규화
6. 기타 모든 코드는 비근무로 처리
7. 현재 테스트 파일의 행 순서를 기준으로 경력 그룹을 데이터화

### 현재 테스트 그룹

- Charge: 상위 8명
- 중간년차: 다음 6명
- 저연차: 다음 6명

총 20명.

> 중요: 실제 UM 양식을 확보하면 현재 Parser를 그대로 유지한다고 가정하지 않는다. 실제 양식을 분석하여 정식 Parser를 다시 설계한다.

---

# 4. 근무표 보관함

근무표는 일회성 업로드가 아니라 월별 보관함으로 관리한다.

```text
근무표
├─ 2026년 09월
├─ 2026년 10월
└─ 2026년 11월
```

각 월은 브라우저 IndexedDB에 저장한다.

저장 데이터:

- 연도
- 월
- 파일명
- import 시각
- 근무자 목록
- 경력 그룹
- 날짜별 근무 코드
- 원본 Excel Blob

새 근무표를 등록하면:

```text
Excel 등록
→ 월 확인
→ 저장
→ 현재 근무표로 활성화
→ 해당 월 1일 D
```

---

# 5. 최초 실행과 현재 시점

프로그램 최초 실행 시:

1. 실제 현재 날짜 확인
2. 현재 월의 저장 근무표 확인
3. 현재 월 근무표가 있으면 사용
4. 오늘 날짜로 이동
5. 실제 현재 시각을 기준으로 D/E/N 선택

현재 월 근무표가 없으면 샘플 데이터를 사용한다.

---

# 6. 날짜/듀티 이동

## 직접 선택

- 날짜 버튼 → 달력
- D/E/N 버튼 → 듀티 직접 선택

## 다음 듀티

```text
D → E → N → 다음날 D
```

## 이전 듀티

```text
D ← E ← N ← 전날 N
```

## 다음 날

다음 날 버튼은 항상 다음 날짜의 D로 이동한다.

```text
9/16 E → 9/17 D
9/16 N → 9/17 D
```

---

# 7. 현재 기본 배치 규칙

현재 MICU의 공식 화재대피 규칙을 확보하지 않았으므로 다음은 프로토타입 기본값이다.

1. 해당 듀티 근무자만 배치 대상
2. Charge 근무자가 있으면 해당 그룹 최선임을 지휘자로 우선 배치
3. 대피 유도 기본 2명
4. 잔류환자 확인 기본 1명
5. 역할 중복은 기본적으로 피함
6. 대피 유도에는 가능하면 Charge/중간년차를 우선
7. 인원 부족 시 인원 부족 표시
8. 남은 근무자는 기타 지원으로 표시

이 규칙은 실제 MICU 규칙이 확인되면 수정한다.

---

# 8. 설정

상단 `⚙`는 배치 규칙 설정 전용이다.

현재:

- 지휘자 규칙
- 대피 유도 인원
- 잔류환자 확인 인원
- 저연차 단독 배치 허용 여부

향후 MICU 규칙 확인 후:

- 구역별 담당
- 직급/경력별 역할 우선순위
- 신규자 동행
- 특정 역할 최소 경력
- 직전 역할 중복 회피
- 환자/구역 담당 연동
- UM/Charge 지휘체계

등을 추가한다.

---

# 9. 실제 UM 근무표 확보 후 개발 계획

현재 제공된 `최최종 BUN.xlsx`는 테스트 데이터이다.

실제 UM 선생님이 사용하는 기본 양식을 확보하면 다음 순서로 다시 분석한다.

```text
실제 UM 근무표
      ↓
양식 구조 분석
      ↓
이름/날짜/그룹/근무코드 위치 확인
      ↓
월별 변동 요소와 고정 요소 구분
      ↓
Parser 설계
      ↓
테스트 파일 여러 개로 검증
      ↓
정식 Parser
```

목표는 매월 사람 수나 날짜가 바뀌더라도 **기본 양식의 구조적 특징을 이용해 안정적으로 읽는 것**이다.

양식이 달마다 조금 변할 경우에는 자동 분석 + 사용자 확인 방식으로 확장할 수 있다.

---

# 10. 실제 화재대피판

현재 화면은 실제 MICU 대피판을 재현하지 않는다.

실제 대피판 사진을 확보하면:

1. 사진 구조 분석
2. 구역 확인
3. 대피 동선 확인
4. 역할별 표시 영역 확인
5. 고정 그래픽 제작
6. 자동 배치 결과를 각 영역에 매핑
7. 출력용 화면 제작

순서로 진행한다.

최종 목표:

```text
근무표
  ↓
현재 날짜/듀티
  ↓
근무자 자동 추출
  ↓
화재대피 Rule Engine
  ↓
실제 MICU 대피판 형태
  ↓
이름 자동 표시
```

---

# 11. 개발 원칙

RAAS / Cardiac Simulator 개발 원칙과 동일하게 유지한다.

- Parser와 Rule Engine을 분리한다.
- 데이터와 UI를 분리한다.
- MICU 규칙은 가능한 한 설정 데이터로 관리한다.
- 확인되지 않은 MICU 규칙을 공식 규칙처럼 취급하지 않는다.
- 실제 근무표 양식이 확보되면 Parser를 재검토한다.
- 한 번에 전체를 뜯어고치지 않고 작은 패치 단위로 개발한다.
- 기존 기능의 회귀를 확인한다.
- 실제 대피판 그래픽은 규칙과 데이터 구조가 안정된 이후 구현한다.

---

# 12. 다음 개발 단계

### Phase 1 — 입력 데이터
- [x] 테스트 Excel 분석
- [x] 날짜 열 동적 탐색
- [x] D/E/N/NC 정규화
- [x] 비근무 코드 제외
- [x] 경력 그룹 데이터화
- [x] 월별 근무표 저장
- [x] 월별 근무표 선택
- [x] 현재 월 자동 선택

### Phase 2 — 상태/시간
- [x] 날짜 달력
- [x] 듀티 직접 선택
- [x] 다음 듀티
- [x] 다음 날 D
- [x] 현재 시각 기반 듀티
- [x] 현재 시점 ↻ 새로고침

### Phase 3 — Rule Engine
- [x] 기본 지휘자 규칙
- [x] 기본 대피 유도 규칙
- [x] 기본 잔류 확인 규칙
- [ ] 실제 MICU 규칙 확인
- [ ] 구역별 배치
- [ ] 역할별 세부 조건

### Phase 4 — 실제 근무표
- [ ] UM 기본 양식 확보
- [ ] 실제 양식 구조 분석
- [ ] 정식 Parser 설계
- [ ] 복수 월 테스트
- [ ] 양식 변형 대응

### Phase 5 — 실제 대피판
- [ ] 대피판 사진 확보
- [ ] 구역/동선 분석
- [ ] 그래픽 구현
- [ ] 이름 매핑
- [ ] 출력 레이아웃

### Phase 6 — 배포/사용성
- [ ] MICU PC 화면 최적화
- [ ] 태블릿 화면 검토
- [ ] 인쇄/PDF 출력
- [ ] 데이터 백업/복원


---

# 13. v0.5 — 인쇄 및 수동 수정

## 13.1 상단 액션 순서

상단 기능 순서는 다음으로 확정한다.

```text
근무표 → ↻ 새로고침 → 🖨 인쇄 → ✎ 수정 → ⚙ 설정
```

### 아이콘 의미

- `근무표`: 월별 근무표 보관함
- `↻`: 현재 날짜/시간으로 상태 복귀
- `🖨`: 화재대피 배치 패널 인쇄
- `✎`: 화재대피 배치 패널 수동 수정
- `⚙`: 배치 규칙 설정

---

## 13.2 인쇄

인쇄 버튼은 브라우저의 기본 `window.print()`와 연결한다.

인쇄 CSS를 이용해:

- 화면의 나머지 UI는 숨김
- `화재대피 배치` 패널만 표시
- 브라우저/Windows의 기본 프린터 선택 및 인쇄 설정 사용

현재 단계에서는 프린터 장치 자체를 직접 제어하지 않고 **OS/브라우저의 표준 인쇄 기능에 위임**한다.

향후 실제 대피판 레이아웃이 완성되면 A4/용지 방향/여백까지 별도로 최적화한다.

---

## 13.3 수동 수정

`✎`를 누르면 수정 모드가 된다.

현재 배치 패널의 각 역할에서 이름을 직접 수정할 수 있다.

예:

```text
지휘
[ 김서윤 ]

대피 유도
[ 박지훈 ]
[ 이하은 ]

잔류환자 확인
[ 한도윤 ]
```

수정 모드에서는 이름 부분을 직접 클릭하여 편집한다.

### 중요한 원칙

수정은 **근무표 원본을 변경하지 않는다.**

즉:

```text
근무표 데이터
      ↓
기본 Rule Engine
      ↓
자동 배치
      ↓
필요 시 수동 수정
      ↓
화면/인쇄
```

구조를 유지한다.

향후에는 수동 수정값을 별도 데이터로 저장하여 다음 우선순위를 정식으로 정의한다.

```text
근무표
→ 자동 배치
→ 수동 override
→ 표시/인쇄
```

---

## 13.4 v0.5의 수동 수정 저장 범위

현재 수동 수정값은 애플리케이션 실행 중 메모리에서 유지한다.

향후 정식 구현에서는 IndexedDB에 다음과 같은 형태로 저장하는 것을 검토한다.

```text
manualOverride
├─ rosterId
├─ date
├─ duty
├─ role
├─ slot
├─ personName
└─ updatedAt
```

이렇게 하면 특정 월/날짜/듀티/역할에 대한 수정값을 독립적으로 관리할 수 있다.

---

## 13.5 다음 단계

- [ ] 실제 MICU 대피판 사진 반영
- [ ] 역할별 고정 위치 구현
- [x] 수동 수정값 IndexedDB 저장 및 재실행 후 복원
- [ ] 수정값과 자동 배치의 우선순위 확정
- [ ] 인쇄용 A4 레이아웃
- [ ] 실제 UM 근무표 확보 후 Parser 재설계
- [ ] 실제 화재대피 규칙 확보 후 Rule Engine 정식화


# 16. v0.5.1 — 근무코드/샘플 데이터 정합성 수정

## 16.1 문제

테스트에서 2026년 9월 19일 문재현이 C인데도 E(이브닝) 근무자에 포함되는 문제가 확인되었다.

원인은 두 가지였다.

1. 샘플 데이터의 일부 행이 실제 Excel의 1~30일 데이터를 정확히 복사하지 못해 날짜별 코드가 한 칸씩 어긋난 행이 있었다. 문재현 행도 이 문제로 C가 9월 18일 위치에 들어가 있었다.
2. Excel import parser가 실제 파일 구조 `번호 / 이름 / 보조코드 / 1일 / 2일 ...`에서 이름을 `r[0]`(번호)로 읽고 있었다. 날짜 열 자체는 헤더를 기준으로 읽었지만 사람 식별 정보가 잘못 매핑되는 구조였다.

## 16.2 수정 원칙

- 실제 테스트 Excel의 구조를 기준으로 이름은 두 번째 열(`r[1]`)에서 읽는다.
- 날짜는 날짜 헤더 행의 숫자(1~31)를 기준으로 매핑한다.
- 근무자 판정은 `normalizeDuty()` 하나로 통일한다.
- 유효 근무코드는 `D`, `E`, `N`, `NC`뿐이다.
- `NC`는 `N`으로 정규화한다.
- `NV`, `OF`, `C`, `PE`, `V` 및 기타 코드는 모두 `null`로 처리하여 근무자 목록/배치 후보에서 제외한다.

## 16.3 기존 저장 근무표 대응

IndexedDB schema version을 2로 올렸다. 기존 v0.5 기록 중 schema version이 낮고 원본 Excel Blob이 남아 있는 경우 새 파서로 원본을 재파싱하여 자동 교체한다. 따라서 사용자가 기존 근무표를 다시 업로드하지 않아도 가능한 경우 새 파서가 적용된다.

## 16.4 확인한 테스트 케이스

- 테스트 Excel에서 문재현의 9월 19일 값은 `C`이다.
- 따라서 9월 19일 E 듀티의 eligible staff에는 문재현이 포함되면 안 된다.
- 반대로 문재현의 실제 E 근무일에는 E로 포함되어야 한다.
- NC는 N으로만 포함되어야 한다.
- C/NV/OF/PE/V는 D/E/N 근무자로 절대 포함되지 않아야 한다.

# 17. v0.5.2 — Excel 이름 열 자동 탐지 수정

## 17.1 재현된 문제

사용자가 `최최종 BUN.xlsx`를 파일로 직접 가져오면 근무표가 정상적으로 표시되지 않는 문제가 있었다.

실제 업로드 Excel은 `이름 | 1일 | 2일 | ...` 구조였는데, v0.5.1 parser는 `번호 | 이름 | 보조코드 | 1일 | ...` 구조를 전제로 이름을 `r[1]`에서 읽고 있었다.

그 결과 실제 파일에서 `r[1]`은 1일 근무코드(`E`, `OF`, `D` 등)가 되어 사람 이름 목록이 잘못 생성되었다.

## 17.2 수정

- 이름 열을 특정 인덱스로 고정하지 않는다.
- 날짜 헤더의 첫 날짜 열을 먼저 찾는다.
- 날짜 열보다 앞쪽 열에서 한글 2~4자 이름 패턴을 가장 많이 포함하는 열을 이름 열로 자동 선택한다.
- 실제 이름 열을 기준으로 데이터 행을 필터링한다.
- 날짜별 shift 값은 기존처럼 날짜 헤더의 실제 열 위치를 기준으로 읽는다.
- parser schema version을 3으로 올려 기존 저장 근무표도 원본 Excel Blob이 있으면 새 parser로 재파싱한다.

## 17.3 테스트 기준

`최최종 BUN.xlsx`에서는 첫 날짜 열이 2번째 Excel 열(0-based index 1)이므로 이름 열은 1번째 열(0-based index 0)인 `김서윤`, `박지훈`, ... `문재현`으로 탐지되어야 한다.

문재현의 9월 19일 값은 `C`이며, `normalizeDuty()`에서 null로 처리되어 9월 19일 E 근무자에서 제외되어야 한다.


# v0.5.3 — MICU 명칭 정정

현재 프로젝트 대상은 일반 병동이 아니라 **MICU (Medical Intensive Care Unit)**이다.
화면의 `WARD FIRE EVACUATION` 표기를 `MICU FIRE EVACUATION`으로 변경하고, README/DEVLOG의 병동 표현도 MICU 기준으로 통일했다.

기능 로직에는 변경이 없으며, 명칭/문서 정정 패치다.


## v0.5.5 — 야간근무 날짜 기준 수정
- 현재 시각 자동 동기화에서 22:00~익일 07:29를 **시작일의 N 근무**로 표시한다.
- 07:30부터 당일 D로 전환한다.
- 15:00 E 시작, 22:00 N 시작 경계를 유지한다.
- 예: 2026-09-17 06:05 → 2026-09-16 N.
\n## v0.5.6 — 현재 날짜/시간 표시\n- 상단 우측에 현재 시각(HH:MM)과 현재 날짜(YYYY.MM.DD 요일)를 작게 표시.\n- 시계 표시는 1초 주기로 갱신하지만 근무표/자동배치는 매초 재계산하지 않음.\n- 기존 refresh의 듀티 날짜 보정 로직은 유지.\nEOF
cat >> README.md <<'EOF'
\n### v0.5.6\n상단 우측에 현재 날짜/시간을 작게 표시한다. 현재 시각 표시와 듀티 계산은 분리되어 있으며, 현재 시각 표시는 매초 갱신된다.\nEOF
cd /mnt/data/fire_v056/src && mv fire_evacuation_prototype_v0.5.5 fire_evacuation_prototype_v0.5.6 && zip -qr ../fire_evacuation_prototype_v0.5.6.zip fire_evacuation_prototype_v0.5.6
# quick structural checks
grep -n "currentTime\|renderCurrentClock\|top-right" fire_evacuation_prototype_v0.5.6/{index.html,script.js,style.css}
unzip -t ../fire_evacuation_prototype_v0.5.6.zip | tail -1

## v0.5.6 — 현재 날짜/시간 표시
- 상단 우측에 현재 시각(HH:MM)과 현재 날짜(YYYY.MM.DD 요일)를 작게 표시.
- 시계 표시는 1초 주기로 갱신하지만 근무표/자동배치는 매초 재계산하지 않음.
- 기존 refresh의 듀티 날짜 보정 로직은 유지.


## v0.6.1 — 2026-09-17
### Changed
- 실제 확인된 MICU 화재대피 반 편성을 자동배치 엔진에 반영.
- 선임순 1명은 통보연락반, 2~3번은 소화반, 4번 이하 간호사는 대피유도반으로 배치.
- 사원·의사는 현재 근무표 데이터에 없으므로 임의 생성하지 않음.
- 기존 임시 규칙인 지휘/대피유도 2명/잔류환자 확인 1명 설정을 제거.
- 서울성모병원 로고를 HTML에 Base64로 내장.
### Risk review
- 배치 규칙 변경은 UI 레이아웃과 수동 수정 키에 영향을 주므로 역할명을 새 규칙에 맞게 통일함.
- Excel parser는 이번 변경에서 수정하지 않아 기존 날짜 헤더 기반 파싱 회귀를 최소화함.
- 실제 UM 근무표 확보 후 직종/선임순 표현을 검증하고 필요한 경우 parser만 별도 패치할 것.


## v0.6.1
- 대피유도반 패널은 4번째 이하 근무자가 없어도 항상 표시하도록 수정.
- 인원이 없을 경우 `배치 인원 없음`으로 표시하며 패널 구조는 유지.


# 10. v0.6.6 — 최종 UI/UX 레퍼런스 개발 지침 반영

이번 버전은 기능 변경보다 **개발 방향 고정**을 목적으로 한다.

## 10.1 최종 시각 레퍼런스

최종 화면의 시각적 목표를 ChatGPT 공유 레퍼런스 이미지로 지정했다.

`https://chatgpt.com/s/m_6aab6267e4bc8191a547696e3706e2c2`

단, 이 버전에서 레퍼런스 이미지를 실제 UI로 즉시 복제하지 않는다.

실제 개발 순서는 다음과 같다.

```text
기능/데이터 구조 안정화
        ↓
실제 UM 근무표 확보
        ↓
실제 MICU 화재대피 게시판 사진 확보
        ↓
실제 업무 구조 및 화면 요소 확정
        ↓
최종 시각 레퍼런스 방향으로 UI/그래픽 정리
```

## 10.2 실제 자료와 레퍼런스의 우선순위

실제 병동 운영 규칙과 실제 게시판 구조가 시각 레퍼런스와 다르면 실제 병동 자료를 우선한다.
레퍼런스의 예시 인원, 이름, 날짜 등은 실제 데이터가 아니다.

## 10.3 개발 시 주의

최종 레퍼런스를 이유로 현재 기능과 데이터 모델을 임의로 변경하지 않는다. UI 변경이 필요할 경우 기존 Parser, Rule Engine, IndexedDB 상태, 인쇄/수정 기능에 대한 회귀 여부를 함께 확인한다.


## v0.6.6 변경
- 날짜 선택 달력에서 현재 월에 표시되는 앞/뒤 달의 날짜도 클릭 가능하도록 수정.
- 앞/뒤 달 날짜 클릭 시 해당 날짜로 선택 상태와 달력 커서를 이동.
- 근무표가 없는 월도 날짜 선택 자체는 제한하지 않음.

## v0.6.8 patch correction
- Fixed date-picker month navigation being immediately closed by the document-level outside-click handler.
- Clicking `‹` / `›` now changes the visible calendar month without closing the calendar.
- Date selection behavior and adjacent-month date clickability remain unchanged.


## v0.6.9
- 사용 설명서를 별도 화면이 아닌 기존 overlay/modal 방식의 팝업으로 추가.
- 날짜 선택, 듀티, 자동 배치, 수정, 근무표 사용법을 간결하게 안내.
- 설명서 팝업은 바깥 클릭 및 ESC로 닫을 수 있음.

## v0.6.7~v0.6.8 — 날짜 선택기 UX 보완
- 날짜 선택 팝업의 `‹ / ›` 버튼으로 이전/다음 달을 이동할 수 있도록 보완.
- 월 이동 시 날짜 선택 팝업을 닫지 않고 달력만 다시 렌더링하도록 동작을 정리.
- 현재 달력에 함께 표시되는 이전/다음 달 날짜도 클릭할 수 있도록 유지.
- 인접 월 날짜를 클릭했을 때 해당 날짜를 선택하되, 날짜 선택 팝업은 유지하여 연속해서 날짜를 선택할 수 있도록 UX를 정리.
- 달력 내부 클릭과 팝업 바깥 클릭에 의한 닫기 이벤트가 충돌하지 않도록 이벤트 처리를 분리.

### Risk review
- 달력 월 이동과 실제 선택 날짜(`selectedDate`)를 분리해야 월만 넘겼을 때 선택 날짜가 의도치 않게 변경되는 회귀를 막을 수 있음.
- 인접 월 날짜 클릭은 선택 날짜와 달력 표시 월을 함께 갱신하되, 팝업 상태는 유지해야 함.

## v0.6.9 — 설명서 팝업
- 별도 화면으로 이동하지 않고 기존 날짜/설정 팝업과 동일한 모달 방식으로 `설명서`를 표시.
- 날짜 선택, 듀티 선택, 자동 배치, 수정, 근무표 사용법을 간단히 안내.
- 설명서 팝업은 기존 모달 UX를 재사용하여 화면 구조를 불필요하게 늘리지 않음.

## v0.6.x — 수동 수정 기능 점검에서 확인된 문제
수동 수정 기능을 실제 사용 흐름으로 점검하면서 다음 문제가 확인되었다.

1. 기존 이름을 삭제한 뒤 다른 이름을 입력해도 삭제한 이름이 함께 남아 2명이 아닌 3명처럼 표시되는 문제가 있음.
2. 기존 이름을 모두 삭제하고 새 이름을 입력해도 기존 슬롯의 이름이 뒤에 남는 문제가 있음.
3. 현재 수동 수정값은 브라우저를 닫고 HTML을 다시 실행하면 초기화됨.
4. 따라서 현재 `manualAssignments`는 실행 중 메모리 상태에만 의존하며, IndexedDB에 수동 수정값을 영구 저장하는 기능이 아직 완성되지 않음.

### Next priority
- 설명서 이후 수동 수정 기능을 우선 보완한다.
- 수동 수정값은 역할/날짜/듀티별 override 상태로 명확히 관리하고, 사용자가 이름을 삭제하거나 교체했을 때 기존 값이 잔존하지 않도록 저장·렌더링 흐름을 정리한다.
- 수정 저장 후 날짜/듀티를 이동했다가 돌아와도 유지되어야 하며, HTML을 닫았다가 다시 실행해도 IndexedDB에서 복원되어야 한다.
- `수정 초기화`는 현재 날짜/듀티의 수동 override만 제거하고 자동 배치 결과로 복귀시키는 방식으로 구현한다.
- 월별 근무표를 새 파일로 교체할 경우 해당 월의 기존 수동 override가 오래된 인원 정보를 남기지 않도록 함께 정리한다.

### Risk review
- 수동 수정은 자동 배치 결과와 별개의 상태이므로 자동 배치 로직 자체를 변경하지 않고 `자동 배치 → 수동 override → 렌더링/인쇄` 순서를 유지한다.
- 수정값을 슬롯 단위로 관리하지 않고 화면 텍스트만 누적 저장하면 삭제/교체 시 기존 이름이 잔존할 수 있으므로 저장 모델을 명확히 해야 한다.
- IndexedDB 저장은 기존 근무표 저장 구조와 충돌하지 않도록 별도 store 또는 명확한 key 체계를 사용해야 한다.

## v0.6.x 사용성 개선 진행 방향
구조 개편이나 새로운 대형 기능 추가보다 기존 기능의 사용성을 보완하는 방향으로 0.6.x를 계속 진행한다.

우선 검토 대상은 다음과 같다.
- A: 날짜 선택/화면 이동 UX
- B: 듀티 선택 및 상태 표시 UX
- C: 수동 수정/저장/초기화 UX
- D: 근무표 관리 UX
- E: 설명서/도움말 UX

실제 UM 근무표와 실제 MICU 화재대피 게시판 사진이 확보되기 전까지는 위 편의성 개선과 기존 기능 안정화에 집중한다.

# v0.6.10 — 개발 단계 및 웹앱 전환 로드맵 확정

이번 문서 패치는 향후 개발 순서를 명확히 고정하기 위한 것이다. **현재 단계에서는 웹앱 전환을 시작하지 않고, v0.6.x 프로토타입을 먼저 완성한다.**

## 1. 전체 개발 단계

```text
Phase 1. 프로토타입 완성
        ↓
Phase 2. 실제 자료/사용 흐름 검증
        ↓
Phase 3. 웹앱 전환을 위한 재설계
        ↓
Phase 4. 재설계 구조 기반 웹앱 구현/배포
```

### Phase 1 — v0.6.x 프로토타입 완성 (완료)

현재 개발의 최우선 목표는 이미 만들어진 브라우저 프로토타입의 기능과 사용성을 안정화하는 것이다.

우선순위는 다음과 같다.

- 날짜 선택기 및 월 이동 UX
- 날짜/듀티 상태 일관성
- 수동 수정값의 정확한 교체·삭제 처리
- 수동 수정값의 영속 저장 및 재실행 후 복원
- 현재 날짜/듀티의 수정 초기화
- 근무표 보관함 및 교체/삭제 UX
- 설명서/도움말
- 인쇄 결과 및 인쇄 레이아웃 안정성
- 근무표 없음/인원 없음 등 상태 표시
- Excel 입력 오류 및 파싱 예외 처리
- 기존 기능 회귀 및 상태관리 문제 점검

이 단계에서는 기능의 완성도와 실제 사용 흐름을 우선하며, 웹앱 서버 구조를 미리 도입하기 위해 현재 프로토타입을 불필요하게 재작성하지 않는다.

### Phase 2 — 실제 자료 및 사용 흐름 검증

프로토타입 기능이 충분히 안정화된 후 실제 자료를 이용해 검증한다.

#### 실제 UM 근무표 확보 시

현재 테스트 근무표는 공식 양식이 아니므로 실제 UM 근무표를 확보하면 **새로운 기준 자료**로 취급한다. 기존 Parser가 맞다고 가정하지 않고 다음을 다시 확인한다.

1. 실제 파일의 행/열 구조
2. 이름 열과 날짜 헤더 위치
3. 날짜 이전 코드 영역의 존재 여부
4. 직종/경력/선임순 정보를 표현하는 방식
5. 월별·파일별로 변할 수 있는 요소
6. D/E/N/NC 및 비근무 코드 처리

필요하면 Parser를 다시 설계하고 실제 월별 파일을 여러 개 사용해 검증한다.

#### 실제 MICU 화재대피 게시판 사진 확보 시

실제 게시판 사진을 기준으로 다음을 확인한다.

- 역할별 위치
- 구역/환자 배치 구조
- 고정 그래픽 및 표기
- 대피 동선
- 실제 출력/게시 형태

현재 화면의 임시 레이아웃을 실제 게시판과 동일하다고 간주하지 않는다.

#### 실제 사용 흐름 검증

최소한 다음 흐름을 반복 점검한다.

```text
근무표 등록/선택
→ 날짜 선택
→ 듀티 선택
→ 자동 배치 확인
→ 필요 시 수동 수정
→ 날짜/듀티 이동
→ 수정값 복원 확인
→ 인쇄
```

### Phase 3 — 웹앱 전환을 위한 재설계

프로토타입 검증이 끝난 뒤에만 웹앱 구조를 설계한다. **현재 프로토타입을 그대로 서버에 올리는 것을 목표로 하지 않는다.**

재설계 시 최소한 다음 영역을 다시 정의한다.

- 데이터 모델
- Excel 업로드 및 Parser 구조
- 자동 배치 Rule Engine
- 수동 override 및 상태관리
- 저장소/DB 구조
- 사용자 및 권한 모델
- 근무표의 공유/버전 관리
- UI/UX 및 화면 전환 구조
- 인쇄/출력 구조
- 오류 처리 및 감사 가능한 변경 이력의 필요성
- 배포 및 백업 구조

프로토타입에서 검증된 기능과 규칙을 명세로 추출한 뒤 웹앱에 맞는 구조로 재구성한다.

### Phase 4 — 웹앱 구현

재설계가 확정된 이후 실제 웹앱을 구현한다.

- 프로토타입의 검증된 기능을 기준으로 단계적으로 구현
- 자동 배치 규칙의 결과가 프로토타입과 일치하는지 비교 검증
- 실제 UM 근무표로 업로드/파싱 테스트
- 실제 MICU 게시판 구조를 기준으로 최종 화면 구현
- 사용자 권한 및 데이터 저장/백업 검증
- 배포 후 실제 사용 환경 테스트

완성된 v0.6.x 프로토타입은 폐기하지 않고 **웹앱의 요구사항·동작 기준·회귀 테스트용 레퍼런스**로 보존한다.

## 2. 프로토타입 단계에서 지켜야 할 경계

- 웹앱용 DB/서버 구조를 현재 프로토타입에 억지로 도입하지 않는다.
- 실제 UM 양식을 받기 전까지 테스트 Excel 구조를 공식 양식으로 일반화하지 않는다.
- 실제 게시판 사진을 받기 전까지 최종 게시판 레이아웃을 확정하지 않는다.
- 새 기능을 추가할 때 기존 날짜/듀티/Parser/자동배치/수동수정/인쇄 기능의 회귀를 함께 확인한다.
- 프로토타입에서 확인되지 않은 기능을 웹앱 설계의 전제조건으로 확정하지 않는다.

## 3. 현재 작업 위치

현재 프로젝트는 **v0.6 FINAL — 안정화된 단일 사용자 프로토타입**으로 동결되어 있다.

v0.6에서 계획했던 사용성·상태관리·수동 수정·근무표 보관·영속 저장·인쇄·도움말 관련 핵심 작업과 최종 검증을 완료했다.

이후 변경은 원칙적으로 **v0.7 작업**으로 취급한다. v0.7은 실제 UM 근무표와 실제 MICU 화재대피 게시판 자료를 확보한 뒤, 실제 자료 검증을 먼저 수행하고 그 결과를 바탕으로 정식 데이터/화면 구조를 설계한다.



## v0.6.10 — 날짜/모달 사용성 보완
- 달력에 `오늘` 버튼을 실제 UI로 추가하고 현재 날짜/현재 듀티로 복귀하도록 함.
- 오늘 날짜와 선택 날짜를 시각적으로 구분.
- 인접 월 날짜의 실제 날짜 계산을 보정하여 월 경계 선택 오류를 방지.
- 설명서/배치 규칙/근무표/월·연도 확인 모달에 바깥 영역 클릭 닫기를 공통 적용.
- ESC로 열린 모달과 달력을 닫는 동작을 유지.

## v0.6.15 — IndexedDB / Storage abstraction

- Added a storage abstraction layer (`AppStorage`) so application logic does not need to depend directly on IndexedDB.
- Added IndexedDB stores for `rosters` and `overrides`.
- Roster records are identified independently by month (`roster:YYYY-MM`).
- Override records are scoped by roster, date, duty, role, and slot.
- IndexedDB initialization is fail-safe: if unavailable, the application can continue using its existing in-memory behavior.
- This patch deliberately does not perform the full override migration yet; that is reserved for v0.6.16 to reduce regression risk.
- Future server migration can replace the storage adapter with a remote API implementation while preserving the application/UI layer.

### v0.6.16 planned
- Connect current roster/override state to `AppStorage`.
- Persist manual overrides across reloads.
- Define and enforce override lifecycle when switching, replacing, or deleting rosters.
- Final regression test and v0.6 FINAL freeze.

## v0.6.16 — Manual override persistence / lifecycle

- Manual edits are now treated as roster-scoped overrides rather than replacements of the Excel-derived automatic result.
- Edit mode uses a draft state; typing does not mutate the committed override state until `수정사항 저장` is completed.
- Each person/slot is independently editable; the `·` separator remains presentation-only.
- Overrides are persisted in IndexedDB and restored when the active roster is loaded.
- Switching the active roster loads only that roster's overrides.
- Deleting a roster also deletes its overrides.
- Replacing a roster for the same month clears that month's old overrides to prevent stale assignments from being applied to a new source roster.
- The application distribution contains no operational Excel roster. Real use requires the user to upload the latest roster at runtime; sample data is for testing only.
- Storage access is routed through the `AppStorage` abstraction so a future server/API implementation can replace IndexedDB without rewriting the UI layer.


## v0.6.16 FINAL2 — deletion verification / user guide alignment

- Strengthened roster deletion by verifying that the IndexedDB record is actually gone before treating deletion as successful.
- If deletion fails, the roster list is refreshed and the user receives an explicit error instead of a false success state.
- Deleting the active roster clears the active-roster pointer and switches the main view to sample data.
- Updated the in-app help and README to match the final roster, override, deletion, persistence, and print behavior.

## v0.6.17 FINAL — persistence stabilization

- Introduced a version-isolated local storage namespace so first launch of v0.6.17 does not inherit roster/test records created by previous development builds.
- IndexedDB remains the primary local store; JSON-safe roster/override mirrors in localStorage provide a fallback for direct `file://` execution and storage recovery.
- Persisted roster records no longer depend on retaining the uploaded Excel Blob; parsed roster data is sufficient for runtime use.
- Active roster state uses the versioned local storage namespace.
- App startup now restores saved roster and its manual overrides before the first final render.
- Refresh-to-now now waits for manual overrides to load before rendering, preventing a brief/lasting reset to automatic Excel-based assignments.
- Manual override persistence remains scoped by roster, date, duty, role, and slot.
- Distribution packages contain no operational roster Excel. Only sample/test data is bundled.
- The in-app help panel was expanded to document the actual current workflow, persistence behavior, override priority, reset behavior, roster lifecycle, and troubleshooting.

### v0.6 FINAL boundary

v0.6 is now treated as the stable single-user prototype baseline. Further changes should be made as v0.7 work, with real MICU roster/reference material and the planned static web-app architecture.


---

# v0.6 FINAL — 최종 동결 기록

2026-09-17 기준 v0.6은 **안정화된 단일 사용자 프로토타입**으로 최종 동결한다. 아래 내용은 이전 개발 기록의 상태가 아닌 현재 최종 상태를 정의한다.

## 최종 포함 기능
- 월별 Excel 근무표 저장과 현재 사용 근무표 선택을 분리
- 여러 월 근무표 동시 보관, 동일 월 교체, 삭제 및 연결된 override 정리
- 날짜 달력, 인접 월 날짜 선택, 오늘 복귀, D/E/N 직접 선택, 다음/이전 듀티 이동
- 현재 시각 기반 듀티 및 야간 근무 날짜 처리
- D/E/N/NC 파싱과 비근무 코드 제외
- 최선임→통보연락반, 차선임+3번째 선임→소화반, 4번째 이하→대피유도반의 현재 테스트 규칙 기반 자동 배치
- 역할별 패널 항상 표시 및 인원 없음 상태 처리
- 사람/slot 단위 수동 편집
- 자동 배치와 수동 override 분리 및 override 우선 적용
- 역할별 초기화
- 수동 수정사항의 IndexedDB 영속 저장 및 새로고침/재실행 후 복원
- 저장소 접근의 `AppStorage` 추상화
- v0.6.17의 버전 격리된 로컬 저장 영역 및 직접 `file://` 실행을 고려한 localStorage 보조 저장
- 인쇄 기능
- 도움말 모달 및 내부 스크롤 UX
- PC 및 모바일 사용 경로 지원

## 배포 데이터 원칙
- 배포물에는 실제 운영 근무표 Excel을 포함하지 않는다.
- 실제 사용 시 최신 근무표를 사용자가 직접 업로드한다.
- 포함된 샘플 데이터는 개발/테스트용이며 실제 UM 공식 양식으로 간주하지 않는다.

## v0.6에서 더 이상 확정하지 않는 것
- 현재 테스트 Excel 구조를 실제 UM 공식 양식으로 일반화하지 않는다.
- 현재 자동 배치 규칙을 실제 MICU의 최종 규칙 전체로 간주하지 않는다.
- 현재 화면을 실제 MICU 화재대피 게시판과 동일한 최종 레이아웃으로 간주하지 않는다.

## v0.7 시작 조건 및 방향
1. 실제 UM 근무표 확보
2. 실제 Excel 구조 분석 및 정식 Parser 재설계/검증
3. 실제 MICU 화재대피 게시판 사진 확보
4. 실제 역할·구역·동선·표시 구조 분석
5. 실제 자료를 반영한 업무 규칙 및 화면 구조 확정
6. 그 결과를 바탕으로 static web app 구조로 전환

v0.7의 저장 구조는 `UI → Application/State → Storage API → IndexedDB`를 기본 방향으로 하며, 향후 여러 사용자/여러 컴퓨터의 공유가 필요해질 경우 `Storage API → Server API → DB`로 교체할 수 있도록 한다. 서버 전환 시에는 인증/권한, 동시 편집, DB 스키마, 파일 저장, override 충돌, 백업/이력, 네트워크 장애 및 오프라인 동작을 별도로 설계한다.

v0.6 프로토타입은 폐기하지 않고 v0.7의 요구사항 기준 및 회귀 테스트 레퍼런스로 보존한다.
