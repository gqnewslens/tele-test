# Vercel 환경 변수 빠른 설정 가이드

## 🚀 Vercel에서 추가해야 할 환경 변수

**Vercel Dashboard → 프로젝트 → Settings → Environment Variables**

---

### ✅ 새로 추가 필요 (Google Calendar)

```bash
GOOGLE_CALENDAR_ID=gq.newslens@gmail.com
```

---

### 📋 전체 환경 변수 목록

아래 변수들이 모두 설정되어 있는지 확인하세요:

#### Telegram
```
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

#### Google Cloud
```
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_SPREADSHEET_ID
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_CALENDAR_ID          ← 🆕 NEW!
```

#### Admin
```
ADMIN_PASSWORD
```

---

## 📝 빠른 체크리스트

배포 전 확인:

1. ✅ Vercel에 모든 환경 변수 추가됨
2. ✅ Google Calendar에 Service Account 권한 부여됨
   - 이메일: `gqai-teletest@constant-abacus-480206-j3.iam.gserviceaccount.com`
   - 권한: "변경 및 공유 관리 권한"
3. ✅ Google Calendar API 활성화됨
4. ✅ 코드가 GitHub에 푸시됨

---

## 🔗 빠른 링크

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Calendar 설정**: https://calendar.google.com/calendar/u/0/r/settings/calendar
- **Google Cloud Console**: https://console.cloud.google.com

---

## ⚡ 배포 후 테스트

배포가 완료되면:

```bash
# 대시보드 접속
https://your-vercel-domain.vercel.app/dashboard

# 캘린더 API 테스트
curl https://your-vercel-domain.vercel.app/api/calendar/events?type=today
```

캘린더 위젯이 대시보드 상단에 표시되어야 합니다!

---

## 🆘 문제 발생 시

1. Vercel Deployment Logs 확인
2. 환경 변수 철자 확인
3. Google Calendar 권한 재확인
4. [상세 가이드](./docs/DEPLOYMENT.md) 참조
