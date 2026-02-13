# plan.md: AI Integrated Data Workspace Project

## 1. 프로젝트 개요
사용자가 그래프 및 테이블 형태의 데이터를 탐색하고, 특정 데이터를 AI에게 질문하거나(Context-aware Chat) ML 모델을 통해 재예측(Re-prediction)할 수 있는 Open WebUI 스타일의 인터페이스 구축.

## 2. 기술 스택 (Tech Stack)
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Layout**: react-resizable-panels (유연한 화면 분할)
- **Data Visualization**:
  - **Graph**: React Flow (상호작용 및 노드 조작 최적화)
  - **Table**: TanStack Table (React Table) (대용량 데이터 처리 및 필터링)
- **State Management**: Zustand (가볍고 빠른 전역 상태 관리)
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: FastAPI (Python 기반, ML 모델 연동 유리)
- **Database**: PostgreSQL (정형 데이터), Neo4j (그래프 데이터)
- **Infrastructure**: Docker, Kubernetes (기존 환경 활용)

## 3. 개발 마일스톤 (Milestones)

### Phase 1: 기반 구조 및 레이아웃 설정 (1-2주)
- [x] Vite + React 프로젝트 초기 설정 및 Tailwind/Shadcn UI 도입
- [x] react-resizable-panels를 활용한 좌측 워크스페이스 / 우측 채팅창 기본 레이아웃 구현
- [x] Zustand를 이용한 전역 데이터 공유(선택된 노드/행 정보) 아키텍처 설계

### Phase 2: 데이터 워크스페이스 구현 (2-3주)
- [ ] Graph Panel: React Flow를 활용한 노드-엣지 시각화 및 클릭 이벤트 바인딩
- [ ] Table Panel: TanStack Table을 활용한 프로세스 데이터 리스트업 및 멀티 셀렉트 구현
- [ ] 선택된 데이터를 하단 미니 뷰어로 표시하는 UI 추가

### Phase 3: AI 상호작용 및 LLM 연동 (2-3주)
- [ ] OpenAI 또는 자체 호스팅 LLM API와 통신하는 채팅 인터페이스 구축
- [ ] Context Injection: 선택된 그래프/테이블 데이터를 프롬프트에 자동으로 포함시키는 기능
- [ ] 채팅창 내에서 데이터 참조(Reference) 칩(Chip) UI 구현

### Phase 4: 예측 모델 연동 및 피드백 루프 (3-4주)
- [ ] BERT 기반 프로세스 데이터 예측 모델 서버(FastAPI) 구축
- [ ] UI에서 '재예측' 버튼 클릭 시 선택된 데이터를 모델 서버로 전송
- [ ] 예측 결과를 다시 그래프/테이블에 반영하는 실시간 업데이트(WebSocket/SSE) 구현

### Phase 5: 최적화 및 배포 (기한 미정)
- [ ] Dockerizing 및 Kubernetes 기반 배포 환경 구성
- [ ] 데이터 로딩 성능 최적화 (Virtual Scrolling 등)
- [ ] 사용자 가이드 및 최종 UI 폴리싱

## 4. 핵심 기능 상세 설계 (Key Interaction)

### A. 노드 기반 질문하기 (Ask AI about Node)
- 사용자가 그래프의 특정 노드(예: 공정 장비 A)를 우클릭하거나 버튼 클릭.
- 해당 노드의 모든 메타데이터(Cypher 쿼리 결과값 등)가 Zustand의 `selectedContext`에 저장.
- 채팅 입력창 위에 "장비 A에 대해 질문 중..." 표시.
- 질문 전송 시 AI에게 "이 장비 A의 속성값은 X인데, 현재 상태를 분석해줘"라고 컨텍스트 전달.

### B. 데이터 재예측 (Re-prediction Workflow)
- 테이블에서 특정 공정 구간의 데이터들을 다중 선택.
- '모델 재예측 실행' 버튼 클릭.
- 입력된 파라미터와 함께 BERT 모델 API 호출.
- 반환된 예측값(Confidence Score 등)을 테이블의 '예측' 컬럼에 즉시 업데이트하고 그래프 노드 색상을 변경.

## 5. 향후 과제
- [ ] 복잡한 Cypher 쿼리를 AI가 대신 작성해주는 기능 (Natural Language to Cypher)
- [ ] 대규모 시계열 데이터를 위한 그래프 시각화 최적화
- [ ] 다크 모드 및 Open WebUI 스타일 테마 적용
