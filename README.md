# MICU 화재대피 인원배치 — GitHub Pages 배포 미러

**이 저장소는 배포 미러이며 코드 원본이 아닙니다.** 공식 코드 원본: [pchjesus/micu-fire-evacuation](https://github.com/pchjesus/micu-fire-evacuation). 기능 변경·근무표·저장 구조의 개발은 공식 저장소에서만 수행합니다.

- 기존 웹앱 URL: https://pchjesus.github.io/seoul-St.mary-micu-fire-evacuation/
- 반영된 공식 소스 커밋: `da864bffa1a7b118c57581e8d09420881b77c80c`
- 앱 버전: v0.7.5 RC, IndexedDB DB 버전 **4**
- 배포 파일별 공식 원본의 Git blob SHA: [DEPLOYMENT_SOURCE.json](DEPLOYMENT_SOURCE.json)
- `build-info.js`의 소스 커밋 표시만 빌드 단계에서 주입. 나머지 정적 파일은 원본과 바이트 단위로 동일해야 함.
- 기존 v0.7.2 배포는 Git 이력과 [옛 README](docs/README_v0.7.2_DEPLOYMENT_ARCHIVE.md)에 보존.

## 2026-10-17 데이터 손실 방지 수정

기존 이 URL에서 사용하던 v0.7.2 웹앱이 `indexedDB.open(DB_NAME, 3)`을 실행하는데, 같은 브라우저 origin에 v4 데이터가 남아 있으면 `VersionError`가 발생했습니다. 공식 v0.7.5의 v4 대응 코드를 같은 URL로 배포하여 해결합니다.

**기존 IndexedDB를 삭제하거나 초기화하지 않았으며, 데이터베이스 버전을 내리지도 않았습니다.** 오래된 브라우저 스크립트와 혼합 실행을 줄이기 위해 정적 자산 URL에 `?v=0.7.5-db4`를 적용했습니다.

오류가 계속 보이면 먼저 다른 MICU 탭을 닫고 강력 새로고침하세요. 브라우저의 **사이트 데이터 삭제/초기화는 하지 마세요.** 실제 개인 브라우저의 데이터 유지 여부는 해당 기기에서 별도로 확인해야 합니다.

## QA 경계

이 미러의 CI는 정적 파일의 원본 SHA와 배포본의 DB4 로딩 자산을 검증합니다. 전체 단위·브라우저 회귀검사는 공식 저장소 GitHub Actions에서 수행하며, 실제 휴대폰과 물리적 A4 출력은 별도 검증입니다.
