# 화재대피 인원배치 Prototype v0.6.x

## 실행
압축을 풀고 `index.html`을 브라우저에서 연다.

## 핵심 기능
- 월별 Excel 근무표 보관함 (저장 / 사용 분리)
- D/E/N/NC 근무 코드 처리
- 그 외 코드 전부 비근무 처리
- 날짜 달력 선택
- 다음 듀티: D → E → N → 다음날 D
- 다음 날: 다음 날짜 D
- `↻` 새로고침: 실제 현재 날짜/시간으로 복귀
- `⚙` 배치 규칙 설정
- 기본 배치 규칙 기반 자동 인원배치


## 현재 개발 단계 / 웹앱 전환 계획

현재는 **v0.6 FINAL — 안정화된 단일 사용자 프로토타입**이다. v0.6은 안정화 및 검증을 완료했으며 더 이상 기능을 확장하지 않는다. 실제 자료 확보 후 v0.7에서 웹앱 전환을 시작한다.

```text
프로토타입 완성
→ 실제 UM 근무표/실제 MICU 화재대피판/실사용 흐름 검증
→ 웹앱 재설계
→ 웹앱 구현 및 배포
```

실제 UM 근무표를 확보하면 현재 테스트 Excel과 별도로 Parser를 다시 분석한다. 실제 화재대피판 사진을 확보하면 실제 게시판 구조를 기준으로 화면을 확정한다.

웹앱 전환 시에는 현재 HTML을 그대로 서버에 올리는 것이 아니라, 프로토타입에서 검증된 기능과 규칙을 명세화한 뒤 데이터 구조, 저장/DB, Parser, Rule Engine, 수동 수정 상태, 권한, UI/UX, 인쇄 및 배포 구조를 재설계한다. 현재 프로토타입은 웹앱 구현 이후에도 기준 레퍼런스와 회귀 테스트용으로 보존한다.

## 최종 UI/UX 시각 레퍼런스

최종 화면 설계의 시각적 목표는 별도 `DESIGN_REFERENCE.md`에 기록된 ChatGPT 공유 이미지를 사용한다.

중요한 점은 **지금 즉시 해당 이미지를 그대로 구현하는 것이 아니라 최종 디자인 방향으로만 고정하는 것**이다. 실제 MICU 화재대피 게시판 사진과 실제 UM 근무표를 확보한 뒤 실제 업무 구조를 먼저 반영하고, 그 다음 최종 레퍼런스 방향으로 UI/그래픽을 정리한다.

실제 병동 자료와 시각 레퍼런스가 충돌할 경우 실제 병동 자료를 우선한다.

## v0.4 변경
상단 `근무표`와 `⚙` 사이에 `↻` 버튼을 추가했다.

`↻`는 웹페이지를 다시 로드하는 버튼이 아니라 **현재 시점으로 화면 상태를 재동기화하는 버튼**이다.

동작:
1. 현재 컴퓨터 날짜/시간 확인
2. 현재 월에 저장된 근무표가 있으면 해당 근무표 사용
3. 오늘 날짜로 이동
   - 달력의 `오늘` 버튼을 누르면 현재 날짜와 현재 듀티로 바로 복귀
4. 현재 시각에 따라 D/E/N 판정
5. 근무자와 배치 결과 재계산
6. 화면 갱신

따라서 예를 들어 화면이 9/15 E에 머물러 있어도 실제 시간이 9/16 22:10이라면 `↻`를 눌렀을 때 9/16 N으로 돌아간다.

## 개발 방향
이 프로젝트는 기존 RAAS Simulator / Cardiac Electrophysiology Simulator와 같은 방식으로 단계적으로 개발한다.

- 데이터/상태 모델 분리
- 입력 Parser 분리
- Rule Engine 분리
- UI 표현 분리
- 작은 패치 단위 개발
- 각 버전에서 기존 기능 회귀 확인
- 실제 MICU 규칙이 확보되면 기본 규칙을 점진적으로 정식화
- 실제 대피판 사진 확보 후 그래픽/UI를 별도 단계에서 구현


## v0.5.1 및 v0.5.2 수정

- 샘플 근무표를 실제 테스트 Excel의 1~30일 값과 동일하게 교정
- Excel 파서가 첫 번째 열의 번호가 아니라 두 번째 열의 실제 간호사 이름을 읽도록 수정
- D/E/N/NC만 근무자로 인정하고 NV/OF/C/PE/V 등은 명시적으로 제외
- 기존 v0.5 저장 근무표가 있으면 원본 Excel Blob을 이용해 새 파서로 자동 재파싱

## v0.5 추가 기능
- 상단 `🖨` 인쇄 버튼
- 브라우저 기본 인쇄 기능과 연동
- 인쇄 시 화재대피 배치 패널(`#printArea`)만 표시
- 상단 `✎` 수정 버튼
- 수정 모드에서 화재대피 역할별 이름을 직접 편집
- 수정한 이름은 현재 날짜/듀티 조합에 대해 브라우저 메모리에서 유지
- `수정 완료`를 누르면 일반 표시 모드로 복귀

> 현재 수정값은 근무표 자체를 변경하지 않는다. 향후에는 '수동 수정값'을 별도 데이터로 저장하고, 근무표가 바뀌거나 새로고침할 때의 우선순위까지 명확하게 설계한다.

## v0.5.3 변경
- 프로젝트 명칭 및 화면 문구를 Ward가 아닌 MICU 기준으로 정정
- 상단 영문 표기를 `MICU FIRE EVACUATION`으로 변경
- 문서의 병동 관련 표현을 MICU로 통일


## v0.5.5 — 야간근무 날짜 기준 수정
- 현재 시각 자동 동기화에서 22:00~익일 07:29를 **시작일의 N 근무**로 표시한다.
- 07:30부터 당일 D로 전환한다.
- 15:00 E 시작, 22:00 N 시작 경계를 유지한다.
- 예: 2026-09-17 06:05 → 2026-09-16 N.

### v0.5.6
상단 우측에 현재 날짜/시간을 작게 표시한다. 현재 시각 표시와 듀티 계산은 분리되어 있으며, 현재 시각 표시는 매초 갱신된다.


## v0.6.0 — MICU 실제 반 편성 반영
- 병원 로고를 HTML에 Base64로 내장해 별도 이미지 파일 없이 표시
- 배치 규칙을 MICU 확인 내용에 맞게 변경
  1. 최선임 → 통보연락반
  2. 차선임 + 3번째 선임 → 소화반
  3. 4번째 이하 간호사 → 대피유도반
- 현재 근무표에는 간호사만 있으므로 사원·의사는 추정하지 않음
- 기존 인원수/환자확인/지휘자 설정 UI 제거
- Excel parser, IndexedDB 근무표 보관함, 현재시각/야간 날짜 처리 등 기존 기능 유지


### 사용 설명서
상단 `?` 버튼에서 날짜 선택, 듀티, 자동 배치, 수정, 근무표 사용법을 팝업으로 확인할 수 있다.

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

## 현재 사용 설명서

### 근무표
1. `근무표` 버튼을 연다.
2. `＋ 근무표 저장`으로 최신 `.xlsx` 파일을 선택한다.
3. 월 정보가 파일명에서 확인되지 않으면 연/월을 직접 지정한다.
4. 저장된 근무표 목록에서 `사용`을 눌러 현재 적용할 근무표를 선택한다.
5. 여러 월을 저장해둘 수 있으며, 다른 월을 저장하는 것만으로 현재 사용 중인 근무표가 바뀌지는 않는다.
6. `삭제`는 해당 근무표와 연결된 수동 수정사항을 함께 삭제한다. 현재 사용 중인 근무표를 삭제하면 샘플 데이터로 전환한다.
7. 같은 월의 근무표를 새 파일로 교체하면 이전 근무표에 연결된 수동 수정사항은 초기화한다.

### 수동 수정
- `✎`를 누르면 수정 모드가 시작된다.
- 여러 명이 배치된 역할도 사람별로 각각 수정할 수 있다.
- `·`는 여러 사람을 구분하기 위한 화면 표시 문자이며 배치 데이터 자체가 아니다.
- 입력 중에는 전체 화면을 다시 그리지 않고, `수정사항 저장` 시점에 수동 override로 저장한다.
- 자동 배치와 수동 override가 분리되어 있으며, 최종 표시에서는 수동 override가 자동 배치보다 우선한다.
- 수동 수정은 IndexedDB에 저장되어 새로고침 후에도 유지된다.
- 역할별 `초기화`는 해당 역할의 수동 수정만 제거한다.

### 저장 데이터
- 앱 배포물에는 실제 운영 근무표 Excel을 포함하지 않는다.
- 실제 사용 시 최신 근무표를 사용자가 직접 업로드한다.
- 샘플 근무표는 개발/테스트용으로만 취급한다.
- 저장소 접근은 `AppStorage` 추상화를 거치므로 향후 서버/API 기반 저장소로 확장할 수 있다.


### v0.6 FINAL 상태
- v0.6은 단일 사용자용 안정화 프로토타입으로 동결했다.
- 여러 월 근무표를 저장해둘 수 있으며 `저장`과 `사용`은 분리된다.
- 수동 수정은 사람/slot 단위 override로 저장되며 자동 배치보다 우선한다.
- IndexedDB 기반 영속 저장으로 새로고침/브라우저 재실행 후에도 근무표와 수동 수정사항을 복원한다.
- 배포물에는 실제 운영 Excel을 넣지 않고 샘플 데이터만 포함한다.
- v0.7은 실제 UM 근무표와 실제 MICU 화재대피판 자료를 확보한 뒤 static web app 방향으로 진행한다.


## v0.6.18 오프라인 안정화
- 기존 UI/기능/로직은 변경하지 않았습니다.
- 외부 CDN의 XLSX 라이브러리 참조만 `vendor/xlsx.full.min.js` 로 변경했습니다.
- `vendor/README.txt` 안내에 따라 `xlsx.full.min.js` 파일을 넣으면 Excel 업로드에 외부 인터넷 의존성이 없어집니다.


# v0.7.0 — Static Web App Foundation

v0.7.0은 v0.6.18의 안정화된 기능을 그대로 유지하면서 정적 웹 배포를 위한 기준 버전으로 패키징한 버전이다.

- UI 및 기존 배치 기능 변경 없음
- IndexedDB 기반 로컬 저장 구조 유지
- Excel 업로드는 `vendor/xlsx.full.min.js` 로컬 파일을 사용
- 외부 CDN에 의존하지 않음
- `index.html`을 정적 웹 서버에 그대로 배포할 수 있음

웹 서버에 배포한 뒤에는 같은 URL에서 기존 기능의 회귀 여부와 브라우저 재접속 후 저장 데이터 유지 여부를 확인한다.

**주의:** 현재 구조는 기기/브라우저별 로컬 저장 방식이며, 여러 기기에서 데이터를 공유하는 중앙 DB 기능은 포함하지 않는다.
