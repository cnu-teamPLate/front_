# Team Project Managing Web Service
// ...existing code...
# Team Project Managing Web Service

간단한 팀 프로젝트 관리용 웹 애플리케이션(React 기반)입니다. 일정·과제·회의록·파일 업로드·알림 등 협업에 필요한 기본 기능을 제공하며, 이 저장소는 프론트엔드 코드입니다.

주요 기능
- 대시보드: 프로젝트 요약, 최근 알림 및 일정
- 과제 관리: 과제 목록, 상세 보기, 제출/상태 관리
- 일정(달력): 팀 일정 확인 및 일정 생성/수정
- 회의록(로그): 회의 기록 작성 및 보기
- 파일 업로드: 과제/프로젝트 관련 파일 업로드
- 사용자 인증: 로그인, 회원가입, 비밀번호 재설정(프론트엔드 라우트만 포함)
- 알림 팝업 및 좌측 사이드바 기반 탐색

기술 스택
- React (create-react-app 기반)
- JavaScript(ES6+), CSS
- 로컬 상태 관리: 컴포넌트 상태 사용 (필요 시 Redux 또는 Context 추가 가능)
- 빌드 도구: npm / yarn

프로젝트 구조(주요 폴더)
- public/: 정적 HTML 및 리소스
- src/
  - components/: 공통 컴포넌트 (Header, Footer, SideBar, Layout, Calendar 등)
  - pages/: 화면별 페이지(Assignment, Dashboard, Home, Login, SignUp 등)
  - picture/: 이미지 리소스
  - style/: 전역 CSS 변수 및 스타일
  - index.js, App.js: 앱 진입점 및 라우팅

개발 환경 (Windows 기준)
사전 요구사항
- Node.js (LTS 권장)
- npm 또는 yarn
- Git (원격과 연동 시)

설치
```bash
# 저장소 루트에서
npm install
# 또는
yarn
```

개발 서버 실행
```bash
npm start
# 또는
yarn start
# 브라우저에서 http://localhost:3000 열기
```

빌드
```bash
npm run build
# 또는
yarn build
# 배포용 정적 파일이 build/ 폴더에 생성됩니다.
```

환경변수
- API 서버와 연동할 경우 .env 또는 .env.local 파일에 다음과 같이 설정:
```
REACT_APP_API_URL=https://api.example.com
```
(실제 변수명 및 사용법은 코드에서 참조되는 이름에 맞춰 조정하세요.)

브랜치 및 협업 규칙(권장)
- master: 배포 가능한 안정 브랜치(기준 브랜치)
- lhj 등 개인 개발 브랜치: master를 기준으로 주기적으로 동기화
  - master 기준으로 동기화(merge)
    ```bash
    git fetch origin
    git checkout lhj
    git merge origin/master
    git push origin lhj
    ```
  - 또는 rebase 사용(히스토리 정리용)
    ```bash
    git fetch origin
    git checkout lhj
    git rebase origin/master
    git push --force-with-lease origin lhj
    ```
- PR을 통해 코드 리뷰 후 master에 병합 권장

충돌 해결 팁
- 병합 또는 리베이스 중 충돌 발생 시, 충돌 파일을 편집해 해결하고:
  - merge: git add <file> -> git commit
  - rebase: git add <file> -> git rebase --continue

기여
- 이 저장소를 포크/클론 후 새로운 브랜치에서 작업하고 PR을 생성하세요.
- 커밋 메시지는 명확하게 작성하고, 가능한 경우 작은 단위로 나누어 제출하세요.

테스트
- 현재 테스트 스크립트는 별도 구성되어 있지 않습니다. 필요 시 Jest/React Testing Library 추가 권장.

라이선스
- 별도 명시가 없으면 협의 후 적용하세요. (MIT 권장)

문의
- 프로젝트 관련 문의는 저장소 이슈 또는 코드 리뷰 코멘트로 남겨주세요.
