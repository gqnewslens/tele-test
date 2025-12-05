# 텔레그램 채널 대시보드 완전 가이드

> 코딩 경험이 없는 분들을 위한 단계별 설치 및 운영 가이드

**최종 업데이트**: 2024년 12월
**예상 소요 시간**: 총 90분 (외부 서비스 설정 포함)

---

## 📖 목차

- [Part 1: 시작하기 전에](#part-1-시작하기-전에)
- [Part 2: 외부 서비스 설정](#part-2-외부-서비스-설정)
- [Part 3: 코드 가져오기 및 배포](#part-3-코드-가져오기-및-배포)
- [Part 4: 시스템 사용하기](#part-4-시스템-사용하기)
- [Part 5: 커스터마이징 (바이브코딩)](#part-5-커스터마이징-바이브코딩)
- [Part 6: 부록](#part-6-부록)

---

## Part 1: 시작하기 전에

### 1.1 이 시스템이 무엇인가요?

이 시스템은 **텔레그램 채널/그룹의 메시지를 자동으로 수집하고 분류하여 웹 대시보드에서 관리**할 수 있는 모니터링 도구입니다.

#### 주요 기능
- ✅ 텔레그램 채널/그룹 메시지 자동 수집
- ✅ AI 기반 자동 분류 (뉴스, 기술, 암호화폐, 금융 등)
- ✅ 이미지/비디오 자동 저장 및 표시
- ✅ 웹 대시보드에서 실시간 확인
- ✅ 관리자 기능 (게시물 삭제 등)
- ✅ 필터링 (공지, 문서, 링크, 이미지, 영상)

#### 시스템 구조

```
텔레그램 채널
    ↓ 메시지 전송
텔레그램 봇 (자동 수집)
    ↓ 분류 및 저장
데이터베이스 (Supabase)
    ↓ 조회
웹 대시보드 (Vercel)
    ↓ 관리자 접속
여러분의 브라우저
```

#### 예상 비용

| 서비스 | 무료 한도 | 비용 |
|--------|----------|------|
| **Telegram Bot** | 무제한 | 완전 무료 |
| **Vercel (호스팅)** | 100GB/월 트래픽 | 무료 |
| **Supabase (DB)** | 500MB 데이터, 50만 쿼리/월 | 무료 |
| **Cloudinary (미디어)** | 25GB 저장소, 25GB 트래픽/월 | 무료 |
| **총 비용** | 대부분의 경우 무료 티어로 충분 | **0원** |

> 💡 **참고**: 소규모 조직(1-2개 채널 모니터링)은 모든 서비스를 무료로 사용 가능합니다.

---

### 1.2 필요한 계정 만들기

시작하기 전에 다음 5가지 계정이 필요합니다:

| 서비스 | 가입 주소 | 소요 시간 | 필수 여부 |
|--------|----------|----------|----------|
| GitHub | https://github.com/signup | 5분 | ✅ 필수 |
| Vercel | https://vercel.com/signup | 3분 | ✅ 필수 |
| Supabase | https://supabase.com/dashboard | 3분 | ✅ 필수 |
| Cloudinary | https://cloudinary.com/users/register_free | 3분 | ✅ 필수 |
| Telegram | (기존 계정 사용) | - | ✅ 필수 |

#### GitHub 계정 생성
1. https://github.com/signup 접속
2. 이메일 주소 입력
3. 비밀번호 설정
4. 사용자명 입력
5. 이메일 인증 완료

#### Vercel 계정 생성
1. https://vercel.com/signup 접속
2. "Continue with GitHub" 버튼 클릭
3. GitHub 계정으로 연동 승인

#### Supabase 계정 생성
1. https://supabase.com/dashboard 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

#### Cloudinary 계정 생성
1. https://cloudinary.com/users/register_free 접속
2. 이메일, 이름, 비밀번호 입력
3. 이메일 인증 완료

---

### 1.3 용어 설명

코딩 경험이 없어도 이해할 수 있도록 주요 용어를 설명합니다:

| 용어 | 설명 | 예시 |
|------|------|------|
| **환경변수** | 비밀번호처럼 숨겨야 하는 설정값 | API 키, 데이터베이스 주소 등 |
| **API Key** | 외부 서비스 사용을 위한 인증 키 | Cloudinary API Key |
| **Token** | 봇이나 서비스를 인증하는 긴 문자열 | Telegram Bot Token |
| **Webhook** | 메시지가 올 때마다 자동으로 알려주는 주소 | https://your-app.vercel.app/api/telegram/webhook |
| **데이터베이스** | 수집한 데이터를 저장하는 곳 | Supabase PostgreSQL |
| **배포(Deploy)** | 작성한 코드를 인터넷에 올리는 것 | Vercel에 배포 |
| **Fork** | 다른 사람의 코드를 내 계정으로 복사 | GitHub Fork 버튼 |

---

## Part 2: 외부 서비스 설정

### 2.1 Telegram Bot 만들기 (15분)

텔레그램 봇은 채널/그룹의 메시지를 자동으로 수집하는 역할을 합니다.

#### 단계 1: BotFather와 대화하기

1. 텔레그램 앱 열기
2. 검색창에 `@BotFather` 입력
3. 대화 시작 (`/start`)

#### 단계 2: 봇 생성하기

1. `/newbot` 명령어 입력
2. 봇 이름 입력 (예: "우리 의원실 모니터")
3. 봇 사용자명 입력 (예: "my_office_monitor_bot")
   - 반드시 `bot`으로 끝나야 함
   - 이미 사용 중인 이름은 불가

#### 단계 3: 봇 토큰 저장하기

BotFather가 다음과 같은 메시지를 보냅니다:

```
Done! Congratulations on your new bot.
You will find it at t.me/my_office_monitor_bot

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

For a description of the Bot API, see this page: https://core.telegram.org/bots/api
```

**중요**: `1234567890:ABCdefGHI...` 형식의 토큰을 복사해서 메모장에 저장하세요!

#### 단계 4: 채널/그룹에 봇 추가하기

**채널에 추가:**
1. 모니터링할 채널 열기
2. 채널 정보 → 관리자 → 관리자 추가
3. 방금 만든 봇 검색 후 추가
4. 권한: "메시지 삭제" 권한 부여 (선택)

**그룹에 추가:**
1. 모니터링할 그룹 열기
2. 그룹 정보 → 구성원 추가
3. 방금 만든 봇 검색 후 추가
4. 관리자로 승격 (메시지 삭제 권한)

#### 단계 5: Privacy Mode 설정 (그룹의 경우)

그룹 메시지를 수집하려면 Privacy Mode를 꺼야 합니다:

1. @BotFather에게 `/setprivacy` 입력
2. 방금 만든 봇 선택
3. `Disable` 선택

#### 체크리스트

- [ ] 봇 생성 완료
- [ ] 봇 토큰 메모장에 저장
- [ ] 채널/그룹에 봇 추가
- [ ] 관리자 권한 부여
- [ ] Privacy Mode 설정 (그룹의 경우)

---

### 2.2 Supabase 데이터베이스 설정 (20분)

Supabase는 수집한 메시지를 저장하는 데이터베이스입니다.

#### 단계 1: 프로젝트 생성

1. https://supabase.com/dashboard 접속
2. "New project" 클릭
3. 정보 입력:
   - **Name**: `telegram-monitor` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (메모장에 저장!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: `Free` 선택
4. "Create new project" 클릭 (약 2분 소요)

#### 단계 2: 데이터베이스 테이블 생성

1. 좌측 메뉴에서 **"SQL Editor"** 클릭
2. "New query" 버튼 클릭
3. 다음 SQL 코드를 복사해서 붙여넣기:

```sql
-- telegram_posts 테이블 생성
CREATE TABLE telegram_posts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  channel TEXT NOT NULL,
  message_id BIGINT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  text TEXT NOT NULL,
  media_type TEXT,
  link TEXT,
  media_link TEXT
);

-- 인덱스 생성 (검색 속도 향상)
CREATE INDEX idx_telegram_posts_timestamp ON telegram_posts(timestamp DESC);
CREATE INDEX idx_telegram_posts_category ON telegram_posts(category);
CREATE INDEX idx_telegram_posts_channel ON telegram_posts(channel);

-- RLS (Row Level Security) 비활성화 (간단한 설정)
ALTER TABLE telegram_posts DISABLE ROW LEVEL SECURITY;
```

4. "Run" 버튼 클릭 (또는 Ctrl+Enter)
5. 성공 메시지 확인: `Success. No rows returned`

#### 단계 3: API 키 복사하기

1. 좌측 메뉴에서 **"Project Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 메뉴 선택
3. 다음 정보를 메모장에 복사:
   - **Project URL** (예: `https://abcdefghijk.supabase.co`)
   - **anon public** 키 (긴 문자열, `eyJ...`로 시작)

#### 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 테이블 생성 SQL 실행 완료
- [ ] Project URL 메모
- [ ] anon public 키 메모

---

### 2.3 Cloudinary 미디어 저장소 설정 (10분)

Cloudinary는 이미지/비디오를 저장하고 보여주는 서비스입니다.

#### 단계 1: 대시보드 접속

1. https://cloudinary.com/console 로그인
2. 대시보드 화면 확인

#### 단계 2: API 정보 복사하기

대시보드 상단에 다음 정보가 표시됩니다:

```
Cloud name: dxxxxxxxxxxxxx
API Key: 123456789012345
API Secret: ABCDEFGHIJKLMNOPQRSTUVWX (Show 버튼 클릭)
```

메모장에 복사:
- **Cloud name**
- **API Key**
- **API Secret** (Show 버튼 클릭 후 복사)

#### 단계 3: 폴더 생성 (선택)

1. 좌측 메뉴 "Media Library" 클릭
2. "Create folder" → `telegram` 입력
3. (자동으로 업로드될 폴더)

#### 무료 한도 확인

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/월
- **Transformations**: 25,000 credits/월

> 💡 소규모 사용 시 무료 한도로 충분합니다.

#### 체크리스트

- [ ] Cloudinary 계정 로그인
- [ ] Cloud name 메모
- [ ] API Key 메모
- [ ] API Secret 메모

---

### 2.4 환경변수 정리

지금까지 수집한 정보를 정리합니다. 다음 단계에서 사용됩니다.

| 환경변수 이름 | 값 예시 | 어디서 복사? |
|--------------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | `1234567890:ABCdef...` | Telegram @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | `my_secret_key_123` | 직접 입력 (임의의 문자열) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase API Keys |
| `CLOUDINARY_CLOUD_NAME` | `dxxxxxxxxxxxxx` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | `123456789012345` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `ABCDEFGHIJKLMNOP...` | Cloudinary Dashboard |
| `ADMIN_PASSWORD` | `your_secure_password` | 직접 입력 (관리자 로그인용) |

**TELEGRAM_WEBHOOK_SECRET**은 보안을 위한 임의의 문자열입니다. 예:
- `telegram_webhook_2024_secure`
- `my_office_secret_key_999`

---

## Part 3: 코드 가져오기 및 배포

### 3.1 GitHub에서 코드 복사하기

#### Fork vs Template 선택

| 방식 | 설명 | 추천 대상 |
|------|------|----------|
| **Fork** | 원본과 연결 유지, 업데이트 받기 쉬움 | 일반 사용자 |
| **Template** | 완전히 독립된 새 프로젝트 생성 | 많이 커스터마이징할 경우 |

#### 방법 1: Fork 사용 (추천)

1. 원본 GitHub 저장소 접속 (배포자가 제공한 URL)
2. 우측 상단 **"Fork"** 버튼 클릭
3. "Create fork" 클릭
4. 내 계정에 복사 완료!

#### 방법 2: Template 사용

1. 원본 GitHub 저장소 접속
2. **"Use this template"** → "Create a new repository" 클릭
3. Repository name 입력 (예: `telegram-dashboard`)
4. "Create repository" 클릭

---

### 3.2 Vercel에 배포하기

#### 단계 1: Vercel에 프로젝트 Import

1. https://vercel.com/dashboard 접속
2. **"Add New..."** → **"Project"** 클릭
3. "Import Git Repository" 섹션에서 방금 Fork한 저장소 선택
4. **"Import"** 클릭

#### 단계 2: 환경변수 설정

"Configure Project" 화면에서:

1. **"Environment Variables"** 섹션 펼치기
2. 다음 변수들을 하나씩 추가:

**첫 번째 변수:**
- Key: `TELEGRAM_BOT_TOKEN`
- Value: (메모장에서 복사한 봇 토큰)

**두 번째 변수:**
- Key: `TELEGRAM_WEBHOOK_SECRET`
- Value: (직접 만든 비밀 문자열)

**세 번째 변수:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: (Supabase Project URL)

**네 번째 변수:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: (Supabase anon key)

**다섯 번째 변수:**
- Key: `CLOUDINARY_CLOUD_NAME`
- Value: (Cloudinary cloud name)

**여섯 번째 변수:**
- Key: `CLOUDINARY_API_KEY`
- Value: (Cloudinary API key)

**일곱 번째 변수:**
- Key: `CLOUDINARY_API_SECRET`
- Value: (Cloudinary API secret)

**여덟 번째 변수:**
- Key: `ADMIN_PASSWORD`
- Value: (관리자 로그인 비밀번호)

#### 단계 3: 배포 시작

1. 모든 환경변수 입력 완료 확인
2. **"Deploy"** 버튼 클릭
3. 배포 진행 (약 2-3분 소요)
4. "Congratulations!" 화면 확인

#### 단계 4: 배포 URL 확인

배포 완료 후:
- **Production 도메인**: `https://your-project.vercel.app`
- 메모장에 저장!

---

### 3.3 Telegram Webhook 설정하기

봇이 메시지를 받을 수 있도록 Webhook을 설정합니다.

#### 방법 1: 브라우저에서 설정 (추천)

1. 다음 URL을 브라우저 주소창에 입력:

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://your-project.vercel.app/api/telegram/webhook&secret_token={YOUR_WEBHOOK_SECRET}
```

**주의**:
- `{YOUR_BOT_TOKEN}` 부분을 실제 봇 토큰으로 교체
- `your-project.vercel.app` 부분을 실제 Vercel 도메인으로 교체
- `{YOUR_WEBHOOK_SECRET}` 부분을 실제 비밀 문자열로 교체

2. 성공 응답 확인:

```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

#### 방법 2: Vercel에서 스크립트 실행 (고급)

Vercel 대시보드에서:

1. 프로젝트 선택
2. "Settings" → "Functions"
3. "Deploy Hook" URL 생성
4. (개발자용 - 터미널 접근 필요)

#### Webhook 설정 확인

다음 URL로 확인:

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo
```

응답 예시:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

#### 체크리스트

- [ ] Vercel 배포 완료
- [ ] Production URL 확인
- [ ] Webhook 설정 완료
- [ ] Webhook 정보 확인

---

## Part 4: 시스템 사용하기

### 4.1 대시보드 접속 및 로그인

#### 대시보드 접속

1. 브라우저에서 접속: `https://your-project.vercel.app/dashboard`
2. 로그인 화면 표시

#### 관리자 로그인

1. 비밀번호 입력 (Vercel 환경변수에 설정한 `ADMIN_PASSWORD`)
2. "로그인" 버튼 클릭
3. 성공 시 대시보드 화면으로 이동

#### 대시보드 레이아웃

```
┌─────────────────────────────────────┐
│  텔레그램 채널 모니터링           │
│  [로그아웃] [관리자 모드]           │
├─────────────────────────────────────┤
│  필터:                               │
│  [전체] [공지] [문서] [링크]        │
│  [이미지] [영상]                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 카테고리: 뉴스 > 정치       │   │
│  │ 채널: @news_channel         │   │
│  │ 시간: 2024-12-06 14:30      │   │
│  │                              │   │
│  │ 메시지 내용...              │   │
│  │                              │   │
│  │ [이미지 보기] [삭제]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  (더 많은 게시물...)                │
└─────────────────────────────────────┘
```

---

### 4.2 일상 운영

#### 새 게시물 확인

- 대시보드는 **30초마다 자동 새로고침**
- 새 메시지가 텔레그램에 올라오면 자동으로 수집됨
- 상단에 최신 게시물부터 표시

#### 필터 사용법

| 필터 | 설명 | 사용 예 |
|------|------|---------|
| **전체** | 모든 게시물 표시 | 기본 화면 |
| **공지** | "공지", "안내" 키워드 포함 | 중요 공지만 확인 |
| **문서** | 첨부 파일 있는 게시물 | PDF, 워드 등 |
| **링크** | URL 포함 게시물 | 외부 링크 확인 |
| **이미지** | 사진 첨부 게시물 | 이미지만 모아보기 |
| **영상** | 비디오 첨부 게시물 | 영상 콘텐츠 확인 |

#### 게시물 삭제

**관리자 모드**에서만 가능:

1. 삭제할 게시물의 **"삭제"** 버튼 클릭
2. 확인 메시지: "정말 삭제하시겠습니까?"
3. "확인" 클릭
4. 삭제 완료

**삭제 동작:**
- 데이터베이스에서 삭제
- Cloudinary에서 미디어 삭제
- 텔레그램 채널/그룹에서도 삭제 (봇에 권한 있는 경우)

---

### 4.3 문제 해결 (Troubleshooting)

#### "메시지가 안 들어와요"

**체크리스트:**

1. **봇이 채널/그룹에 추가되었나요?**
   - 채널/그룹 멤버 목록 확인
   - 봇이 관리자 권한을 가지고 있나요?

2. **Webhook이 설정되었나요?**
   - `https://api.telegram.org/bot{TOKEN}/getWebhookInfo` 확인
   - `url` 필드가 올바른 Vercel 주소인지 확인

3. **그룹의 경우 Privacy Mode가 꺼져 있나요?**
   - @BotFather → `/setprivacy` → Disable

4. **Vercel 배포가 정상인가요?**
   - Vercel 대시보드 → Deployments → Status "Ready"

5. **환경변수가 올바른가요?**
   - Vercel → Settings → Environment Variables 확인

#### "로그인이 안 돼요"

**해결 방법:**

1. **비밀번호 확인**
   - Vercel → Settings → Environment Variables
   - `ADMIN_PASSWORD` 값 확인

2. **대소문자 정확히 입력**
   - 비밀번호는 대소문자 구분

3. **브라우저 캐시 삭제**
   - Ctrl+Shift+Delete → 캐시 삭제

#### "이미지가 안 보여요"

**해결 방법:**

1. **Cloudinary 설정 확인**
   - 환경변수 `CLOUDINARY_*` 확인
   - Cloudinary 대시보드에서 무료 한도 확인

2. **업로드 권한 확인**
   - Cloudinary → Settings → Security
   - API 키가 활성화되어 있나요?

#### Vercel 로그 확인 방법

문제가 계속되면 로그를 확인하세요:

1. Vercel 대시보드 → 프로젝트 선택
2. "Functions" 탭 클릭
3. 최근 실행 함수 목록 확인
4. 에러 메시지 있는지 확인

---

## Part 5: 커스터마이징 (바이브코딩)

### 5.1 AI로 코드 수정하기 기초

코딩을 모르는 분들도 Claude나 ChatGPT를 활용하면 코드를 수정할 수 있습니다.

#### 준비물
- GitHub 계정 (이미 있음)
- Claude.ai 또는 ChatGPT 계정
- 코드 에디터 (VS Code 추천)

#### 기본 흐름

1. **원하는 기능 설명하기**
2. **AI가 코드 제안**
3. **코드 복사해서 GitHub에 올리기**
4. **Vercel 자동 재배포**
5. **테스트 후 확인**

#### 좋은 프롬프트 작성법

**❌ 나쁜 예:**
```
대시보드 색깔 바꿔줘
```

**✅ 좋은 예:**
```
Next.js 텔레그램 대시보드 프로젝트입니다.
app/dashboard/page.tsx 파일에서 배경색을 흰색에서
연한 파란색(#e3f2fd)으로 변경하고 싶습니다.
Tailwind CSS를 사용하고 있습니다.
수정이 필요한 부분의 코드를 보여주세요.
```

#### 수정 후 재배포 방법

1. GitHub에서 파일 수정
2. Commit changes
3. Vercel이 자동으로 감지하여 재배포 (2-3분)
4. 새 버전 확인

---

### 5.2 자주 하는 커스터마이징

#### 카테고리 키워드 수정

**파일**: `lib/classifier/index.ts`

AI에게 요청:
```
lib/classifier/index.ts 파일에서 "뉴스" 카테고리의
키워드에 "속보", "긴급" 키워드를 추가하고 싶습니다.
수정할 코드를 보여주세요.
```

#### 대시보드 색상/디자인 변경

**파일**: `app/dashboard/page.tsx`

AI에게 요청:
```
app/dashboard/page.tsx 파일에서
- 배경색을 #f5f5f5로 변경
- 게시물 카드의 테두리를 둥글게 (rounded-lg)
- 제목 폰트 크기를 더 크게 (text-2xl)

Tailwind CSS 클래스로 수정해주세요.
```

#### 새로운 필터 추가

**파일**: `app/dashboard/page.tsx`

AI에게 요청:
```
대시보드에 "암호화폐" 필터를 추가하고 싶습니다.
category가 "암호화폐"인 게시물만 보여주는
필터 버튼을 만들어주세요.
```

#### 알림 기능 추가

고급 기능이므로 단계별 안내:

1. **웹 푸시 알림** (브라우저)
2. **이메일 알림** (SendGrid 연동)
3. **Slack 알림** (Slack Webhook)

AI에게 요청:
```
새 게시물이 수집되면 Slack으로 알림을 보내고 싶습니다.
Slack Webhook URL은 준비되어 있습니다.
app/api/telegram/webhook/route.ts 파일을 수정하여
메시지 저장 후 Slack으로 전송하는 코드를 추가해주세요.
```

---

### 5.3 고급 커스터마이징

#### Google Sheets 연동

현재 코드에 Google Sheets 클라이언트가 포함되어 있지만 사용되지 않습니다.

**활성화 방법:**

1. Google Cloud Console에서 Service Account 생성
2. Sheets API 활성화
3. 환경변수 추가:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={서비스 계정 JSON}
   GOOGLE_SPREADSHEET_ID={스프레드시트 ID}
   ```

4. AI에게 요청:
```
app/api/telegram/webhook/route.ts에서
메시지를 Supabase에 저장한 후
lib/sheets/client.ts를 사용하여
Google Sheets에도 동시에 기록하도록 수정해주세요.
```

#### 다중 채널 모니터링

여러 채널을 구분해서 표시:

AI에게 요청:
```
대시보드에서 채널별로 탭을 나누고 싶습니다.
각 채널의 게시물을 별도 탭에서 확인할 수 있도록
app/dashboard/page.tsx를 수정해주세요.
```

#### 통계 대시보드 추가

AI에게 요청:
```
대시보드에 다음 통계를 추가하고 싶습니다:
- 오늘 수집된 메시지 수
- 카테고리별 분포 (차트)
- 시간대별 메시지 추이

Chart.js를 사용하여 시각화해주세요.
```

---

## Part 6: 부록

### 6.1 환경변수 전체 목록 및 설명

| 변수 이름 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ | 텔레그램 봇 인증 토큰 | `1234567890:ABC...` |
| `TELEGRAM_WEBHOOK_SECRET` | ⚠️ | Webhook 보안을 위한 비밀키 | `my_secret_123` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 익명 키 | `eyJhbGci...` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary 클라우드 이름 | `dxxxxx` |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API 키 | `123456789012345` |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API 비밀키 | `ABCDEFG...` |
| `ADMIN_PASSWORD` | ✅ | 관리자 로그인 비밀번호 | `secure_pass_456` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | ❌ | Google Cloud 서비스 계정 (선택) | `{"type":"service_account"...}` |
| `GOOGLE_SPREADSHEET_ID` | ❌ | Google Sheets ID (선택) | `1A2B3C4D...` |
| `GOOGLE_DRIVE_FOLDER_ID` | ❌ | Google Drive 폴더 ID (선택) | `1X2Y3Z...` |

---

### 6.2 자주 묻는 질문 (FAQ)

#### Q1. 여러 채널을 동시에 모니터링할 수 있나요?

**A**: 네! 같은 봇을 여러 채널/그룹에 추가하면 됩니다. 모든 메시지가 같은 데이터베이스에 저장되고, `channel` 필드로 구분됩니다.

#### Q2. 메시지 수집을 일시 중지할 수 있나요?

**A**: 네, 두 가지 방법이 있습니다:
1. 텔레그램에서 봇을 채널/그룹에서 제거
2. Webhook을 해제: `https://api.telegram.org/bot{TOKEN}/deleteWebhook`

#### Q3. 무료 한도를 초과하면 어떻게 되나요?

**A**:
- **Vercel**: 트래픽 초과 시 과금 또는 일시 중지
- **Supabase**: 쿼리 한도 초과 시 속도 제한
- **Cloudinary**: 업로드 실패 (메시지는 저장됨)

#### Q4. 다른 사람과 공유할 수 있나요?

**A**: 네! 대시보드 URL을 공유하고 관리자 비밀번호를 알려주면 됩니다. 또는 Supabase RLS로 권한 설정 가능합니다.

#### Q5. 과거 메시지도 수집할 수 있나요?

**A**: 아니요, Webhook은 봇 추가 **이후**의 메시지만 수집합니다. 과거 메시지를 원하면 별도 스크립트가 필요합니다.

#### Q6. 봇이 다운되면 메시지를 놓치나요?

**A**: Telegram은 24시간 동안 Webhook 실패 시 재시도합니다. 하지만 24시간 이상 중단되면 일부 메시지를 놓칠 수 있습니다.

---

### 6.3 비용 안내 (무료 티어 한도)

#### Vercel (호스팅)

| 항목 | 무료 한도 | 초과 시 |
|------|----------|---------|
| 대역폭 | 100 GB/월 | $40/100GB |
| 함수 실행 시간 | 100 GB-시간 | $40/100 GB-시간 |
| 빌드 시간 | 6,000분/월 | 무료 |

**예상 사용량**: 소규모 사용 시 무료 한도의 10% 미만

#### Supabase (데이터베이스)

| 항목 | 무료 한도 | 초과 시 |
|------|----------|---------|
| 데이터베이스 크기 | 500 MB | Pro 플랜 $25/월 |
| 데이터 전송 | 5 GB/월 | - |
| 쿼리 | 500만/월 | - |

**예상 사용량**:
- 하루 1,000개 메시지 → 약 50MB/월
- 6개월 사용 가능

#### Cloudinary (미디어)

| 항목 | 무료 한도 | 초과 시 |
|------|----------|---------|
| 저장 공간 | 25 GB | Paid 플랜 $89/월 |
| 대역폭 | 25 GB/월 | - |
| Transformations | 25,000 credits | - |

**예상 사용량**:
- 하루 50개 이미지(평균 200KB) → 약 300MB/월
- 5년 이상 사용 가능

---

### 6.4 보안 주의사항

#### 중요 보안 수칙

1. **환경변수 노출 금지**
   - `.env.local` 파일을 GitHub에 절대 올리지 마세요
   - 환경변수를 채팅/이메일로 공유하지 마세요

2. **강력한 비밀번호 사용**
   - `ADMIN_PASSWORD`는 최소 12자 이상
   - 대소문자, 숫자, 특수문자 포함

3. **정기적인 비밀번호 변경**
   - 3개월마다 `ADMIN_PASSWORD` 변경 권장
   - Vercel 환경변수에서 수정 후 재배포

4. **접근 권한 최소화**
   - Supabase RLS 활성화 (고급)
   - Vercel 프로젝트 접근 권한 관리

5. **의심스러운 활동 모니터링**
   - Vercel 로그 정기 확인
   - 이상한 메시지 수집 시 즉시 Webhook 해제

#### 보안 체크리스트

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있음
- [ ] Google Service Account JSON 파일이 GitHub에 없음
- [ ] 관리자 비밀번호가 강력함 (12자 이상)
- [ ] Webhook Secret이 설정되어 있음
- [ ] Vercel 환경변수가 올바르게 설정됨

---

### 6.5 문의 및 지원

#### 공식 문서

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Cloudinary**: https://cloudinary.com/documentation

#### 커뮤니티

- **GitHub Issues**: (원본 저장소 URL)/issues
- **Telegram 개발자 그룹**: @BotDevelopers

#### 추가 도움

AI 도구 활용:
- **Claude.ai**: https://claude.ai
- **ChatGPT**: https://chat.openai.com

#### 버그 리포트

문제 발생 시 다음 정보와 함께 Issue 등록:

1. **문제 설명**: 무엇이 작동하지 않나요?
2. **재현 방법**: 어떻게 문제가 발생했나요?
3. **예상 동작**: 어떻게 작동해야 하나요?
4. **스크린샷**: 에러 메시지 캡처
5. **환경**: Vercel 로그 또는 브라우저 콘솔

---

## 마치며

축하합니다! 🎉

이제 텔레그램 채널 모니터링 시스템을 성공적으로 구축하고 운영할 수 있습니다.

### 다음 단계

1. 실제 채널에 봇 추가하고 테스트
2. 대시보드 디자인 커스터마이징
3. 필요한 기능 추가 (알림, 통계 등)
4. 팀원들과 공유

### 도움이 필요하면

- Part 6.5의 문의처 활용
- AI 도구로 코드 수정
- GitHub Issues에 질문

**Happy Monitoring! 📊**

---

**문서 버전**: 1.0
**최종 수정**: 2024년 12월 6일
**작성자**: Claude AI Assistant
**라이선스**: MIT
