# Google Calendar 연동 가이드

텔레그램 대시보드에 구글 캘린더를 연동하는 방법입니다.

## 📋 사전 준비

1. **Google Cloud Console 설정**
   - [Google Cloud Console](https://console.cloud.google.com) 접속
   - 기존 프로젝트 선택: `constant-abacus-480206-j3`
   - APIs & Services → Library → **Google Calendar API** 활성화

2. **Service Account 확인**
   - 이미 생성된 Service Account 사용:
     ```
     gqai-teletest@constant-abacus-480206-j3.iam.gserviceaccount.com
     ```

## 🔧 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가:

```bash
# Google Calendar ID
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
```

### 캘린더 ID 찾기

1. [Google Calendar 설정](https://calendar.google.com/calendar/u/0/r/settings) 접속
2. 왼쪽에서 사용할 캘린더 선택
3. "캘린더 통합" 섹션에서 **캘린더 ID** 복사

## 🔑 캘린더 권한 부여 (필수!)

Service Account가 캘린더에 접근할 수 있도록 권한을 부여해야 합니다:

1. **Google Calendar 설정** 페이지 접속
   - https://calendar.google.com/calendar/u/0/r/settings/calendar

2. **캘린더 선택** 및 공유 설정
   - 사용할 캘린더 클릭
   - "특정 사용자와 공유" 섹션으로 스크롤

3. **Service Account 추가**
   - "사용자 추가" 클릭
   - 이메일 입력:
     ```
     gqai-teletest@constant-abacus-480206-j3.iam.gserviceaccount.com
     ```
   - 권한 선택: **"변경 및 공유 관리 권한"**
   - "전송" 클릭

## 📁 프로젝트 구조

```
lib/calendar/
  └── client.ts          # Google Calendar API 클라이언트

app/api/calendar/
  ├── events/
  │   ├── route.ts       # GET, POST - 일정 목록 및 생성
  │   └── [id]/
  │       └── route.ts   # GET, PATCH, DELETE - 개별 일정 관리

components/
  └── Calendar.tsx       # 캘린더 UI 컴포넌트

app/dashboard/
  └── page.tsx          # 대시보드 (캘린더 포함)
```

## 🎯 사용 가능한 API

### 일정 조회

```bash
# 오늘 일정
GET /api/calendar/events?type=today

# 이번 주 일정 (7일)
GET /api/calendar/events?type=upcoming&days=7
```

### 일정 생성

```bash
POST /api/calendar/events
Content-Type: application/json

{
  "summary": "회의",
  "description": "팀 미팅",
  "start": "2025-12-06T10:00:00+09:00",
  "end": "2025-12-06T11:00:00+09:00",
  "location": "회의실 A"
}
```

### 일정 수정

```bash
PATCH /api/calendar/events/{eventId}
Content-Type: application/json

{
  "summary": "수정된 제목"
}
```

### 일정 삭제

```bash
DELETE /api/calendar/events/{eventId}
```

## 🧪 테스트

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **대시보드 접속**
   ```
   http://localhost:3000/dashboard
   ```

3. **캘린더 확인**
   - 페이지 상단에 캘린더 위젯 표시
   - "오늘" / "이번 주" 탭으로 전환 가능
   - 새로고침 버튼으로 수동 업데이트

## ⚠️ 문제 해결

### 오류: "Failed to fetch events"

**원인**: Service Account에 캘린더 권한이 없음

**해결**:
1. Google Calendar 설정 확인
2. Service Account 이메일이 "특정 사용자와 공유"에 추가되어 있는지 확인
3. 권한이 "변경 및 공유 관리 권한"인지 확인

### 오류: "GOOGLE_CALENDAR_ID is required"

**원인**: 환경 변수가 설정되지 않음

**해결**:
1. `.env.local` 파일에 `GOOGLE_CALENDAR_ID` 추가
2. 서버 재시작

### 캘린더가 비어 있음

**원인**:
1. 해당 기간에 일정이 없음
2. 잘못된 캘린더 ID
3. 권한 문제

**해결**:
1. Google Calendar 웹에서 일정 추가
2. 캘린더 ID 재확인
3. Service Account 권한 재확인

## 🚀 배포 (Vercel)

Vercel에 배포 시 환경 변수 설정:

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```bash
# 필수
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com

# 기타 Google 통합
GOOGLE_SPREADSHEET_ID=...
GOOGLE_DRIVE_FOLDER_ID=...
```

4. **Redeploy** 실행

## 📚 참고 자료

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Service Account 인증](https://cloud.google.com/iam/docs/service-accounts)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
