# PCR Graph Frontend (Phase 3)

`plan.md`의 Phase 3 기준으로 AI 상호작용 기능을 포함한 데이터 워크스페이스 프론트엔드입니다.

## 기술 스택
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui 스타일 베이스
- react-resizable-panels
- Zustand
- React Flow
- TanStack Table

## 구현 범위 (Phase 3)
- Graph Panel: React Flow 기반 노드/엣지 시각화 + 노드 클릭 이벤트
- Table Panel: TanStack Table 기반 공정 데이터 렌더링 + 멀티 셀렉트(체크박스)
- AI Chat 인터페이스:
  - LLM API POST 호출 (`VITE_LLM_API_URL`)
  - 선택된 노드/행 자동 Context Injection
  - Reference Chip UI 표시
- 미니 뷰어: 우측 채팅 패널 하단에서 선택 노드/행 정보를 요약 표시
- Zustand 공유 상태: `selectedContext`, `selectedNode`, `selectedRows`

## 실행
```bash
npm install
npm run dev
```

기본 접속 주소:
- http://localhost:5173

외부/컨테이너 접근:
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## 환경 변수
- `VITE_LLM_API_URL`: AI 채팅 POST 엔드포인트
  - 미설정 시 UI 데모 응답을 반환
