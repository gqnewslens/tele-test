# Vercel 배포 가이드

## 📋 필수 환경 변수

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들을 설정해야 합니다:

### 1. Telegram Bot

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=your_random_secret_string
```

### 2. Supabase Database

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Cloudinary (Media Storage)

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Google Cloud Integration

#### Service Account (필수)
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"constant-abacus-480206-j3",...}
```

**주의**: 전체 JSON 문자열을 한 줄로 입력

#### Google Sheets
```bash
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

#### Google Drive
```bash
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
```

#### Google Calendar (새로 추가!)
```bash
GOOGLE_CALENDAR_ID=gq.newslens@gmail.com
```

### 5. Admin Dashboard

```bash
ADMIN_PASSWORD=your_secure_admin_password
```

## 🚀 배포 프로세스

### 방법 1: Vercel Dashboard (권장)

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 위의 모든 환경 변수 추가
5. **Deployments** → **Redeploy** (환경 변수 변경 후)

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod

# 환경 변수 추가
vercel env add GOOGLE_CALENDAR_ID
```

## 🔧 배포 후 설정

### 1. Telegram Webhook 설정

배포가 완료되면 webhook을 설정해야 합니다:

```bash
npm run setup-webhook
```

또는 수동으로:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.vercel.app/api/telegram/webhook"}'
```

### 2. Google Calendar 권한 확인

Service Account에 캘린더 권한이 부여되어 있는지 확인:

1. [Google Calendar 설정](https://calendar.google.com/calendar/u/0/r/settings/calendar)
2. 해당 캘린더 선택
3. "특정 사용자와 공유"에 다음 이메일 확인:
   ```
   gqai-teletest@constant-abacus-480206-j3.iam.gserviceaccount.com
   ```
4. 권한: "변경 및 공유 관리 권한"

### 3. 배포 확인

```bash
# 대시보드 접속
https://your-domain.vercel.app/dashboard

# API 테스트
curl https://your-domain.vercel.app/api/calendar/events?type=today
```

## 📊 환경 변수 체크리스트

배포 전 확인:

- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET
- [ ] GOOGLE_SERVICE_ACCOUNT_KEY
- [ ] GOOGLE_SPREADSHEET_ID
- [ ] GOOGLE_DRIVE_FOLDER_ID
- [ ] **GOOGLE_CALENDAR_ID** ← 새로 추가!
- [ ] ADMIN_PASSWORD

## ⚠️ 보안 주의사항

### 절대 커밋하지 말 것

- `.env.local` 파일
- `client_secret_*.json`
- `*service-account*.json`
- `constant-abacus-*.json`

이미 .gitignore에 포함되어 있지만, 혹시 모를 실수를 방지하세요!

### Service Account Key 관리

1. **로컬 개발**: `.env.local` 사용
2. **Vercel 배포**: Vercel Dashboard에서 환경 변수로 설정
3. **절대**: GitHub에 커밋하지 않기

## 🔄 업데이트 배포

코드 변경 후:

```bash
git add .
git commit -m "Update description"
git push origin main
```

Vercel이 자동으로 감지하고 배포합니다!

## 📝 문제 해결

### 배포 실패

1. **Build Logs** 확인
2. 환경 변수 누락 여부 확인
3. TypeScript 오류 확인

### 캘린더가 표시되지 않음

1. `GOOGLE_CALENDAR_ID` 환경 변수 확인
2. Service Account 권한 확인
3. Google Calendar API 활성화 확인

### Webhook 오류

1. Telegram Bot Token 확인
2. Webhook URL 형식 확인
3. HTTPS 사용 확인 (Vercel은 자동)

## 📚 추가 문서

- [Google Calendar 연동 가이드](./CALENDAR_SETUP.md)
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
