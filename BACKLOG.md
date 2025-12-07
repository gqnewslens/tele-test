# 개발 백로그

## 추가 개발 과제

---

### AI 태스크 생성 기능

**배경**
- 현재 `[task]` 키워드로 태스크 생성 가능하나 형식 맞추기가 번거로움
- 시작일, 종료일, 담당자 등 필드가 많아지면 사용자가 형식 기억하기 어려움
- 초기 사용자는 생성 방법 자체를 모를 수 있음

**목표**
자연어 입력 → AI가 파싱 → 구조화된 태스크 자동 생성

**예시**
```
입력: 다음주 화요일까지 상임위 질의 준비해야 해.
     박 보좌관이 기존 질의사항 점검하고, 김 선임이 추가 쟁점 정리해줘.

AI 처리 결과:
- 제목: 상임위 질의 준비
- 마감일: 12/10 (화)
- 담당자: 박 보좌관, 김 선임
- 내용:
  - 기존 질의사항 점검 → 박 보좌관
  - 추가 쟁점 정리 → 김 선임
```

**구현 방안**

1. **트리거 방식** (택1)
   - `[ai]` 키워드로 시작
   - 봇 멘션 (`@gqai_bot`)
   - 특정 채팅방에서만 AI 모드 활성화

2. **필요 인프라**
   - Claude API 또는 OpenAI API 키
   - 환경변수: `ANTHROPIC_API_KEY` 또는 `OPENAI_API_KEY`

3. **구현 항목**
   - `lib/ai/task-parser.ts` - AI 파싱 로직
   - 프롬프트 설계 (자연어 → 태스크 JSON 변환)
   - webhook에 AI 트리거 패턴 추가
   - 봇 응답 기능 (생성 결과 텔레그램에 답장)

4. **DB 스키마 확장** (필요시)
   ```sql
   ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP;
   ALTER TABLE tasks ADD COLUMN assignees TEXT[];  -- 담당자 배열
   ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP;
   ```

**우선순위**: 중간
**예상 작업량**: 1-2일
**의존성**: Claude/OpenAI API 키 필요

---

## 완료된 기능

- [x] Tasks 페이지 MVP (2024-12)
- [x] `[task]` 키워드로 태스크 생성
- [x] 태스크 상태/진도율 관리
- [x] 첨부 파일 URL 관리
