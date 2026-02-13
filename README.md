# PCR Graph Frontend (Phase 1)

`plan.md`의 Phase 1 기준으로 구성된 프론트엔드 베이스입니다.

## 기술 스택
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui 스타일 베이스
- react-resizable-panels
- Zustand

## 1) 사전 준비
- Node.js 20+
- npm 10+

버전 확인:

```bash
node -v
npm -v
```

## 2) 의존성 설치
프로젝트 루트(`/workspace/pcr-graph`)에서:

```bash
npm install
```

## 3) 프론트엔드 실행 (개발 모드)

```bash
npm run dev
```

기본 접속 주소:
- http://localhost:5173

외부/컨테이너 접근이 필요하면 host를 열어서 실행:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## 4) 빌드 & 프리뷰

```bash
npm run build
npm run preview
```

## 5) 자주 겪는 이슈
### npm install 시 `403 Forbidden`
환경 정책(사내 레지스트리/네트워크 정책)으로 npm 패키지 접근이 차단되면 발생할 수 있습니다.

확인 포인트:
1. npm registry 설정 확인
   ```bash
   npm config get registry
   ```
2. 기본 레지스트리로 재설정
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```
3. 프록시/사내 보안 정책 확인

정책으로 외부 npm 접근이 막힌 환경이라면, 네트워크 권한 또는 사내 미러 레지스트리 설정이 필요합니다.

---

## 현재 구현된 화면 (Phase 1)
- 좌측 Workspace / 우측 AI Chat 리사이저블 레이아웃
- 샘플 선택 컨텍스트 버튼
- Zustand `selectedContext` 상태 공유 확인 UI
