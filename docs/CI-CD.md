# CI/CD 가이드

GQAI Workspace의 지속적 통합/배포 파이프라인 가이드

---

## 개요

### 현재 배포 아키텍처

```
GitHub Repository
       │
       ├──── main branch ──────► Vercel Production
       │                              │
       │                              ▼
       │                         https://your-domain.vercel.app
       │
       └──── PR / feature/* ───► Vercel Preview
                                      │
                                      ▼
                                 https://pr-xxx.vercel.app
```

### 핵심 특징

| 항목 | 설명 |
|------|------|
| 플랫폼 | Vercel (자동 배포) |
| 트리거 | Git push / PR 생성 |
| 빌드 | Next.js 16 + React 19 |
| 환경 분리 | Production / Preview / Development |

---

## 배포 파이프라인

### 1. Production 배포

`main` 브랜치에 push하면 자동으로 프로덕션 배포가 실행됩니다.

```bash
# 로컬에서 프로덕션 배포
git checkout main
git pull origin main
git merge feature/your-feature
git push origin main
```

**배포 흐름:**
1. GitHub에서 Vercel로 webhook 전송
2. Vercel이 `npm run build` 실행
3. 빌드 성공 시 Production 환경에 배포
4. 이전 버전은 자동으로 롤백 가능 상태로 보존

### 2. Preview 배포

Pull Request를 생성하거나 `main` 외의 브랜치에 push하면 Preview 배포가 생성됩니다.

```bash
# 기능 개발 후 PR 생성
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# GitHub에서 PR 생성
```

**Preview 특징:**
- 고유한 URL 생성 (예: `https://project-git-feature-xxx.vercel.app`)
- PR에 자동으로 배포 링크 코멘트
- 코드 리뷰 전 실제 동작 확인 가능
- PR 머지/클로즈 시 자동 삭제

---

## 브랜치 전략

### 권장 브랜치 구조

```
main (프로덕션)
 │
 ├── feature/* (기능 개발)
 │    ├── feature/calendar-integration
 │    ├── feature/telegram-webhook
 │    └── feature/admin-dashboard
 │
 ├── fix/* (버그 수정)
 │    ├── fix/webhook-error
 │    └── fix/calendar-timezone
 │
 └── docs/* (문서 수정)
      └── docs/api-guide
```

### 브랜치 네이밍 규칙

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feature/` | 새 기능 개발 | `feature/user-auth` |
| `fix/` | 버그 수정 | `fix/login-error` |
| `docs/` | 문서 수정 | `docs/api-reference` |
| `refactor/` | 코드 리팩토링 | `refactor/cleanup-utils` |
| `hotfix/` | 긴급 수정 | `hotfix/security-patch` |

---

## 환경 변수 관리

### 환경별 변수 설정

Vercel Dashboard에서 환경별로 다른 값을 설정할 수 있습니다.

| 환경 | 설명 | 설정 위치 |
|------|------|-----------|
| Production | 실제 서비스 | Vercel > Settings > Environment Variables |
| Preview | PR/브랜치 테스트 | 동일 (Preview 체크) |
| Development | 로컬 개발 | `.env.local` 파일 |

### 환경 변수 우선순위

```
1. Vercel 환경 변수 (Production/Preview)
2. .env.production / .env.preview
3. .env.local (로컬 전용, git 제외)
4. .env (기본값)
```

### 민감한 정보 관리

```bash
# 절대 커밋하지 말 것
.env.local
*.json (service account keys)
```

`.gitignore`에 이미 포함되어 있지만 주의!

---

## GitHub Actions (선택적 설정)

Vercel 자동 배포 외에 추가 검증이 필요한 경우 GitHub Actions를 설정할 수 있습니다.

### 기본 CI 워크플로우

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
```

### PR 체크 워크플로우

`.github/workflows/pr-check.yml`:

```yaml
name: PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

      - name: Build Test
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### GitHub Secrets 설정

Repository > Settings > Secrets and variables > Actions에서 추가:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (기타 빌드에 필요한 환경 변수)

---

## 롤백 방법

### Vercel Dashboard에서 롤백

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Deployments** 탭 클릭
4. 이전 배포 목록에서 롤백할 버전 찾기
5. **⋮** 메뉴 클릭 → **Promote to Production** 선택

### CLI로 롤백

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포 목록 확인
vercel list

# 특정 배포로 롤백
vercel promote [deployment-url]
```

### Git으로 롤백

```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main

# 또는 특정 커밋으로 리셋 (주의: 이력 변경)
git reset --hard [commit-hash]
git push origin main --force
```

---

## 배포 체크리스트

### 배포 전 확인사항

- [ ] 로컬에서 `npm run build` 성공
- [ ] 로컬에서 `npm run lint` 통과
- [ ] TypeScript 오류 없음 (`npx tsc --noEmit`)
- [ ] 환경 변수 설정 확인 (Vercel Dashboard)
- [ ] 민감한 정보 커밋 여부 확인

### 배포 후 확인사항

- [ ] 프로덕션 URL 접속 확인
- [ ] 주요 기능 동작 테스트
- [ ] API 엔드포인트 응답 확인
- [ ] 에러 로그 확인 (Vercel > Functions > Logs)

---

## 문제 해결

### 빌드 실패

**원인 확인:**
```bash
# 로컬에서 빌드 테스트
npm run build
```

**일반적인 원인:**
- TypeScript 타입 오류
- 환경 변수 누락
- 의존성 버전 충돌

### 환경 변수 오류

**확인 방법:**
1. Vercel Dashboard > Settings > Environment Variables
2. 모든 필수 변수가 설정되어 있는지 확인
3. Preview/Production 환경 모두 체크되어 있는지 확인

### 배포 후 500 에러

**로그 확인:**
1. Vercel Dashboard > Deployments
2. 해당 배포 클릭
3. **Functions** 탭 > **Logs** 확인

---

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

Document Version: 1.0
Last Updated: December 2024
