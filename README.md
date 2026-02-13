# PCR Graph Frontend (Phase 3)

`plan.md`의 Phase 3 기준으로 AI 상호작용(LLM 연동 + Context Injection + Reference Chips)을 포함한 프론트엔드입니다.

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
- Context Injection: 현재 선택된 노드/행 정보를 채팅 요청 프롬프트에 자동 주입
- AI Chat: OpenAI 호환 Chat Completions API 연동
- Reference Chips: 채팅창 상단에서 현재 선택된 노드/행을 Chip 형태로 표시
- 미니 뷰어: 우측 하단에서 선택 컨텍스트 요약 표시

## 환경변수
`.env.local`에 아래 값을 설정하면 실제 LLM 응답을 받을 수 있습니다.

```bash
VITE_OPENAI_API_KEY=your_api_key
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

설정하지 않으면 안내용 fallback 메시지를 반환합니다.

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
