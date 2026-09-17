# MICU 화재대피 인원배치 개발 지침

## 1. 프로젝트 목적

이 프로젝트는 서울성모병원 MICU의 월간 근무표를 기반으로 현재 듀티의 근무자를 추출하고, MICU 화재대피 반 편성 규칙에 따라 인원을 자동 배치하는 브라우저 기반 프로그램이다.

## 2. 최종 UI/UX 시각 레퍼런스

다음 이미지를 **최종 UI/UX의 시각적 목표(visual target)** 로 사용한다.

- 최종 레퍼런스: https://chatgpt.com/s/m_6aab6267e4bc8191a547696e3706e2c2

중요:
- 이 레퍼런스는 현재 기능을 즉시 동일하게 구현하라는 의미가 아니다.
- 기능 개발이 우선이며, UI/그래픽은 실제 MICU 화재대피 게시판 사진과 실제 UM 근무표를 확보한 뒤 단계적으로 최종 레퍼런스 방향으로 정리한다.
- 새로운 기능을 추가할 때 레퍼런스의 시각적 구조와 충돌하지 않도록 설계한다.
- 실제 병동 양식과 레퍼런스가 충돌하면 실제 병동 자료를 우선하고, 필요한 차이는 사용자에게 선택지를 제시한다.
- 임의의 장식이나 그래픽을 먼저 추가하여 최종 UI를 확정하지 않는다.

## 3. 실제 MICU 반 편성 기본 규칙

현재 확인된 구조는 다음과 같다.

1. 통보연락반: 근무자 중 최선임 1명
2. 소화반: 근무자 중 차선임 + 3번째 선임
3. 대피유도반: 4번째 이하 간호사 + 사원 + 의사

현재 Excel 근무표에는 간호사만 있으므로 현재 구현에서는 대피유도반에 4번째 이하 간호사만 자동 배치한다.

실제 MICU는 정상 근무 시 8명 이상이 근무하는 것을 전제로 하며, 현재 테스트 데이터에서 인원이 적더라도 이것을 MICU의 정상 운영 인원 기준으로 일반화하지 않는다.

대피유도반은 배치 인원이 0명이더라도 **패널 자체를 항상 표시**해야 한다. 이름이 없을 때는 빈 패널 또는 '배치 인원 없음' 상태로 표시한다.

## 4. 데이터/파서 원칙

- D, E, N, NC만 실제 근무 코드로 인정한다.
- NC는 N과 동일하게 처리한다.
- 그 외 코드는 비근무로 처리한다.
- 근무 코드가 날짜 헤더가 없는 열에 있으면 현재 월 근무로 해석하지 않는다.
- 날짜 헤더가 있는 열의 근무 코드만 해당 날짜의 실제 근무 데이터로 인정한다.
- 날짜 이전에 배치된 3개의 코드가 존재할 수도 있고 존재하지 않을 수도 있으므로 고정 위치를 가정하지 않는다.
- 실제 UM 근무표는 아직 확보 전이므로 테스트 파일의 구조를 공식 양식으로 간주하지 않는다.

## 5. 개발 원칙

- 데이터 모델, Excel Parser, Rule Engine, UI를 가능한 한 분리한다.
- 기능 변경 시 기존 기능의 회귀, 상태 관리 충돌, 날짜/듀티 전환 문제, 인쇄 결과, 수동 수정 우선순위를 확인한다.
- 실제 MICU 규칙이 확인되기 전까지 추정 규칙을 공식 규칙처럼 표현하지 않는다.
- 작은 패치 단위로 버전을 올리고 각 버전에서 기존 기능을 확인한다.
- 실제 MICU 화재대피 게시판 사진을 확보하면 게시판의 구조와 그래픽을 우선 분석한 뒤 화면을 설계한다.
- 실제 UM 근무표를 확보하면 Excel Parser를 다시 검증하고 필요한 경우 재설계한다.

## 6. 변경 우선순위

기본 우선순위:

1. 실제 MICU 운영 규칙
2. 실제 UM 근무표 구조
3. 실제 화재대피 게시판 구조
4. 최종 UI/UX 시각 레퍼런스
5. 장식적 디자인 요소

기능적 정확성과 실제 병동 사용성을 시각적 장식보다 우선한다.

## 7. 현재 개발 단계와 웹앱 전환 원칙

현재는 **v0.6 FINAL — 안정화된 단일 사용자 프로토타입**이다. v0.6은 동결하며, 이후 변경은 v0.7 작업으로 진행한다. 웹앱 구현은 실제 자료/사용 흐름 검증 후 시작한다.

```text
v0.6.x 프로토타입 완성
→ 실제 UM 근무표/실제 MICU 게시판/실사용 흐름 검증
→ 웹앱 재설계
→ 웹앱 구현 및 배포
```

### 프로토타입 단계
- 캘린더/날짜/듀티 UX를 안정화한다.
- 수동 수정의 삭제·교체·영속 저장·초기화를 완성한다.
- 근무표 관리, 설명서, 인쇄, 상태 표시 및 오류 처리를 안정화한다.
- 기존 기능의 회귀와 상태관리 충돌을 확인한다.

### 실제 자료 확보 후
- 실제 UM 근무표는 현재 테스트 파일과 별개의 새로운 기준 자료로 분석한다.
- 실제 양식에 맞춰 Parser를 재검토하고 필요하면 재설계한다.
- 실제 MICU 화재대피 게시판 사진을 기준으로 최종 보드 UI를 설계한다.

### 웹앱 단계
프로토타입 코드를 그대로 서버에 올리지 않는다. 검증된 기능과 규칙을 명세화한 뒤 데이터 모델, DB/저장소, Parser, Rule Engine, 수동 override, 권한, UI/UX, 인쇄, 백업/배포 구조를 웹앱에 맞게 재설계한다. 기존 프로토타입은 웹앱의 기준 레퍼런스와 회귀 테스트 대상으로 보존한다.

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


## 8. v0.6 FINAL 운영 경계

- v0.6 기능은 추가 확장하지 않고 안정 버전으로 보존한다.
- 실제 운영 Excel은 배포물에 포함하지 않는다. 실제 사용 시 최신 파일을 런타임에 업로드한다.
- 샘플 근무표는 테스트 데이터일 뿐 실제 UM 공식 양식이 아니다.
- 수동 수정은 자동 배치와 분리된 roster/date/duty/role/slot 범위의 override이며 최종 표시에서 자동 배치보다 우선한다.
- 근무표 저장/사용 분리, 다중 월 보관, 삭제/교체 시 override lifecycle, IndexedDB 영속 저장 및 재실행 복원은 v0.6의 확정 동작이다.
- `AppStorage`는 향후 서버/API 저장소로 교체할 수 있는 경계로 유지한다.

## 9. v0.7 시작 방향

실제 UM 근무표와 실제 MICU 화재대피 게시판 자료가 확보되면 다음 순서로 진행한다.

`실제 자료 확보 → Parser/업무 규칙 검증 → 실제 게시판 구조 분석 → static web app 재설계 → 구현/배포`

v0.6의 코드는 요구사항 기준 및 회귀 테스트 레퍼런스로 보존한다. 서버 확장이 필요해질 경우 인증/권한, 동시 편집, DB/파일 저장, override 충돌, 백업/이력, 네트워크 장애 대응을 별도로 설계한다.
