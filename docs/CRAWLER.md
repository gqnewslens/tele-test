# Press Release Crawler Documentation

과기부(MSIT)와 방통위(KCC) 보도자료를 수동으로 수집하는 크롤링 시스템입니다.

## 📋 개요

이 시스템은 다음 두 기관의 보도자료를 수집합니다:

1. **과학기술정보통신부 (MSIT)**: https://www.msit.go.kr/bbs/list.do?sCode=user&mPid=208&mId=307
2. **방송통신위원회 (KCC)**: https://www.kcc.go.kr/user.do?boardId=1113&page=A05030000&dc=K05030000

## 🏗️ 시스템 구조

```
lib/crawler/
├── types.ts          # 타입 정의
├── base.ts           # 기본 크롤러 클래스
├── msit.ts           # 과기부 크롤러
├── kcc.ts            # 방통위 크롤러
├── service.ts        # 크롤러 서비스 (오케스트레이션)
└── index.ts          # 모듈 export

app/api/
├── crawl/            # 수동 크롤링 API
└── press-releases/   # 보도자료 조회 API

supabase/migrations/
└── 002_press_releases.sql  # DB 스키마
```

## 🗄️ 데이터베이스 스키마

```sql
CREATE TABLE press_releases (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 소스 정보
  source VARCHAR(50) NOT NULL,        -- 'msit' 또는 'kcc'
  source_id VARCHAR(255) NOT NULL,    -- 원본 사이트의 ID

  -- 콘텐츠
  title TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT NOT NULL,

  -- 메타데이터
  category VARCHAR(100),
  department VARCHAR(200),
  author VARCHAR(200),
  attachments JSONB,

  -- 추적
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 중복 방지
  UNIQUE(source, source_id)
);
```

## 🚀 사용 방법

### 1. 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 데이터베이스 마이그레이션

Supabase 대시보드의 SQL Editor에서 `supabase/migrations/002_press_releases.sql` 파일의 내용을 실행하세요.

### 3. 로컬 테스트

크롤러를 로컬에서 테스트하려면:

```bash
npm run test-crawler
```

이 명령어는:
- 각 크롤러에서 최대 5개의 보도자료를 가져옵니다
- 데이터베이스에 저장합니다
- 결과를 콘솔에 출력합니다

## 📡 API 엔드포인트

### 1. 수동 크롤링 (보도자료 수집)

**엔드포인트**: `GET /api/crawl`

**설명**: 과기부와 방통위 웹사이트에서 최신 보도자료를 수집하여 데이터베이스에 저장합니다.

**쿼리 파라미터**:
- `limit` (선택): 소스당 수집할 최대 항목 수 (기본값: 20)

**사용 예시**:
```bash
# 기본 (소스당 20개 항목)
curl http://localhost:3000/api/crawl

# 소스당 10개 항목만 수집
curl http://localhost:3000/api/crawl?limit=10

# POST 요청도 지원
curl -X POST http://localhost:3000/api/crawl
```

**응답 예시**:
```json
{
  "success": true,
  "timestamp": "2024-12-06T10:30:00.000Z",
  "results": [
    {
      "success": true,
      "source": "msit",
      "items_fetched": 20,
      "items_new": 5,
      "items_updated": 2,
      "timestamp": "2024-12-06T10:30:00.000Z"
    },
    {
      "success": true,
      "source": "kcc",
      "items_fetched": 20,
      "items_new": 3,
      "items_updated": 1,
      "timestamp": "2024-12-06T10:30:00.000Z"
    }
  ],
  "totals": {
    "fetched": 40,
    "new": 8,
    "updated": 3,
    "errors": 0
  }
}
```

### 2. 보도자료 조회

**엔드포인트**: `GET /api/press-releases`

**설명**: 데이터베이스에 저장된 보도자료를 조회합니다.

**쿼리 파라미터**:
- `source` (선택): 'msit' 또는 'kcc' - 특정 소스만 조회
- `limit` (선택): 조회할 최대 항목 수 (기본값: 50)

**사용 예시**:
```bash
# 모든 보도자료 (최대 50개)
curl http://localhost:3000/api/press-releases

# 과기부 보도자료만 조회
curl http://localhost:3000/api/press-releases?source=msit

# 방통위 보도자료 10개만 조회
curl http://localhost:3000/api/press-releases?source=kcc&limit=10

# 최신 100개 조회
curl http://localhost:3000/api/press-releases?limit=100
```

**응답 예시**:
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "source": "msit",
      "source_id": "12345",
      "title": "AI 반도체 개발 지원 정책 발표",
      "content": "과학기술정보통신부는...",
      "published_at": "2024-12-06T09:00:00Z",
      "url": "https://www.msit.go.kr/...",
      "category": "정책",
      "department": "정보통신정책실",
      "created_at": "2024-12-06T10:00:00Z",
      "last_updated": "2024-12-06T10:00:00Z"
    }
  ]
}
```

## 🔄 일반적인 사용 흐름

### 1. 최초 수집
```bash
# 1. 보도자료 수집
curl http://localhost:3000/api/crawl

# 2. 수집된 데이터 확인
curl http://localhost:3000/api/press-releases?limit=10
```

### 2. 정기적 업데이트
```bash
# 주기적으로 새로운 보도자료 수집
curl http://localhost:3000/api/crawl?limit=20
```

### 3. 프론트엔드 통합
```typescript
// 보도자료 목록 가져오기
async function getPressReleases() {
  const response = await fetch('/api/press-releases?limit=20');
  const data = await response.json();
  return data.data;
}

// 새 보도자료 수집
async function collectPressReleases() {
  const response = await fetch('/api/crawl?limit=10');
  const result = await response.json();
  return result.totals;
}
```

## ✨ 주요 기능

1. **자동 중복 제거**: 이미 수집된 보도자료는 스킵
2. **콘텐츠 변경 감지**: 제목, 내용, 카테고리, 첨부파일 변경 시 자동 업데이트
3. **에러 핸들링**: 일부 실패해도 나머지 계속 처리
4. **Rate Limiting**: 서버 부하 방지 (500ms 딜레이)
5. **수동 실행**: 필요할 때만 크롤링 실행 (비용 절감)

## 🔧 프로그래밍 방식 사용

```typescript
import { getCrawlerService } from '@/lib/crawler';
import { getSupabaseDB } from '@/lib/supabase/client';

// 크롤러 서비스 사용
const service = getCrawlerService();

// 보도자료 수집
const results = await service.crawlAll(20); // 각 소스에서 최대 20개 항목

// Supabase에서 직접 조회
const db = getSupabaseDB();
const releases = await db.getPressReleases({
  source: 'msit',
  limit: 10,
});
```

## 🔍 문제 해결

### HTML 셀렉터 오류

웹사이트 구조가 변경되면 크롤러가 작동하지 않을 수 있습니다. 이 경우:

1. 브라우저에서 해당 웹사이트를 열어 HTML 구조를 확인
2. `lib/crawler/msit.ts` 또는 `lib/crawler/kcc.ts`의 셀렉터 수정
3. 테스트 실행: `npm run test-crawler`

### 데이터베이스 연결 실패

```bash
# Supabase 연결 테스트
npx tsx scripts/test-supabase.ts
```

### API 호출 실패

1. 환경 변수 확인 (`.env.local`)
2. Supabase 마이그레이션 실행 여부 확인
3. 네트워크 연결 확인

## ⚠️ 참고사항

### Vercel Cron Jobs (비활성화됨)

자동 스케줄링 기능은 Vercel Pro 플랜이 필요하므로 비활성화되어 있습니다.
대신 다음 방법으로 수동 실행하세요:

1. **브라우저에서 직접 호출**: `https://your-domain.vercel.app/api/crawl`
2. **스크립트 실행**: `npm run test-crawler`
3. **외부 스케줄러**: GitHub Actions, 다른 서버의 cron 등

### GitHub Actions 예시 (선택사항)

`.github/workflows/crawl.yml`:
```yaml
name: Crawl Press Releases
on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다
  workflow_dispatch:  # 수동 실행 가능

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger crawl API
        run: |
          curl -X POST https://your-domain.vercel.app/api/crawl
```

## 📚 참고 자료

- [Cheerio 문서](https://cheerio.js.org/)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
