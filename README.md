# Main

### 사용법

| Tag name           | Description |
|:-------------------|:------------|
|**Feat**            |새로운 기능을 추가|
|**Fix**             |버그 수정|
|**Design**          |CSS 등 사용자 UI 디자인 변경|
|**!BREAKING CHANGE**|커다란 API 변경의 경우|
|**!HOTFIX**         |급하게 치명적인 버그를 고쳐야하는 경우|
|**Style**           |코드 포맷 변경, 세미 콜론 누락, 코드 수정이 없는 경우|
|**Refactor**        |프로덕션 코드 리팩토링|
|**Comment**         |필요한 주석 추가 및 변경|
|**Docs**            |문서 수정|
|**Test**            |테스트 코드, 리펙토링 테스트 코드 추가, Production Code(실제로 사용하는 코드) 변경 없음|
|**Chore**           |빌드 업무 수정, 패키지 매니저 수정, 패키지 관리자 구성 등 업데이트, Production Code 변경 없음|
|**Rename**          |파일 혹은 폴더명을 수정하거나 옮기는 작업만인 경우|
|**Remove**          |파일을 삭제하는 작업만 수행한 경우|

1. 레포 클론

   ```bash
   git clone https://github.com/42Seoul-LastDance/Main.git && cd Main
   ```

2. **[클러스터]** 도커가 꺼져있다면 `make docker` 로 도커 실행
   
3. 도커 실행 후 `make`하여 ts 컴파일 컨테이너 실행
4. srcs 폴더에서 작업 (볼륨 연결 되어있음)
5. `make compile` -> `srcs` 폴더 하위에 있는 모든 `.ts` 파일 컴파일 -> `.js`로 바뀜
6. 웹 브라우저에서 `index.html` 열기
   -  vscode extension -> Live Preview -> Show Preview (External Browser) 로 바로 실행 가능

### 깃 브랜치
Git Flow에서는 총 5개의 브랜치를 사용합니다. 각 브랜치에 대해 간단하게 알아보도록 하겠습니다.

- `master` <br>
실제 프로덕트로 배포하는 브랜치
master에 머지가 된다는 것은 프로덕트에 적용하는 것을 의미한다.


- `develop` <br>
master에서 배포가 되었다면, 그다음 버전을 준비하는 브랜치이다.


- `feature` <br>
새 기능을 개발하는 브랜치
develop을 베이스 브랜치로 가지며, 완료되면 develop에 머지하고 릴리즈를 준비한다.
보통 feature는 prefix로 두고, 뒤에 jira 티켓 번호를 붙이거나 기능명을 적는다.
feature/add-read-api-#133
feature-API-133


- `release` <br>
실제 프로덕트로 배포하기 전에, 최종 점검을 하기 위한 브랜치
develop에서 해당 브랜치를 생성하며, 버그가 있을 경우에는 release 브랜치에서 버그를 픽스한다.
보통 release를 prefix로 두고, 뒤에 릴리즈 버전을 명시한다.
release/1.1.0


- `hotfix` <br>
프로덕트에서 예상하지 못했던 버그를 수정하기 위한 브랜치
