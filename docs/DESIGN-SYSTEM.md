# GQAI Workspace Design System

## Deep Ocean Theme

세련된 테크 느낌의 다크 테마로, GQAI 브랜드 아이덴티티를 반영합니다.

---

## Color Palette

### Primary Colors

| Name | Tailwind Class | Hex | Usage |
|------|----------------|-----|-------|
| **Cyan 400** | `cyan-400` | `#22d3ee` | 브랜드 액센트, 제목, 활성 상태 |
| **Cyan 500** | `cyan-500` | `#06b6d4` | 활성 보더, 포커스 상태 |
| **Cyan 600** | `cyan-600` | `#0891b2` | 주요 버튼, CTA |
| **Cyan 700** | `cyan-700` | `#0e7490` | 버튼 호버 |
| **Cyan 900/50** | `cyan-900/50` | `#164e63` (50% opacity) | 링크 배지 배경 |

### Background Colors

| Name | Tailwind Class | Hex | Usage |
|------|----------------|-----|-------|
| **Slate 900** | `slate-900` | `#0f172a` | 메인 배경 |
| **Slate 800** | `slate-800` | `#1e293b` | 헤더, 카드 배경 |
| **Slate 800/50** | `slate-800/50` | 50% opacity | 카드 (backdrop-blur와 함께) |
| **Slate 700** | `slate-700` | `#334155` | 버튼 배경, 입력 필드 |
| **Slate 600** | `slate-600` | `#475569` | 호버 상태 |

### Text Colors

| Name | Tailwind Class | Hex | Usage |
|------|----------------|-----|-------|
| **White** | `white` | `#ffffff` | 메인 텍스트 |
| **Slate 200** | `slate-200` | `#e2e8f0` | 본문 텍스트 |
| **Slate 300** | `slate-300` | `#cbd5e1` | 버튼 텍스트 |
| **Slate 400** | `slate-400` | `#94a3b8` | 보조 텍스트, 라벨 |
| **Slate 500** | `slate-500` | `#64748b` | 타임스탬프, 비활성 |

### Semantic Colors

| Category | Color | Tailwind Class | Usage |
|----------|-------|----------------|-------|
| **Success** | Teal | `teal-400`, `teal-900/30` | 성공 메시지, 다운로드 |
| **Warning** | Amber | `amber-400`, `amber-900/50` | 경고, 문서 링크 |
| **Error** | Red | `red-400`, `red-600`, `red-900/50` | 에러, 삭제 |
| **Info** | Cyan | `cyan-400`, `cyan-900/50` | 링크, 정보 |

---

## Border Colors

| Name | Tailwind Class | Usage |
|------|----------------|-------|
| **Cyan 900/50** | `border-cyan-900/50` | 헤더 보더, 모달 보더 |
| **Cyan 700/50** | `border-cyan-700/50` | 카드 호버 |
| **Slate 700/50** | `border-slate-700/50` | 카드 기본 보더 |
| **Slate 600** | `border-slate-600` | 입력 필드 보더 |
| **Teal 500/50** | `border-teal-500/50` | 성공 상태 보더 |
| **Red 500/50** | `border-red-500/50` | 에러 상태 보더 |

---

## Effects

### Backdrop Blur
```css
backdrop-blur-sm  /* 카드, 모달에 사용 */
```

### Opacity Patterns
```css
bg-slate-800/50   /* 반투명 배경 */
bg-slate-800/80   /* 헤더 배경 */
bg-black/70       /* 모달 오버레이 */
```

---

## Components

### Buttons

#### Primary Button (CTA)
```tsx
className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
```

#### Secondary Button
```tsx
className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
```

#### Filter Button (Active)
```tsx
className="px-4 py-2 bg-cyan-600 text-white rounded-lg"
```

#### Filter Button (Inactive)
```tsx
className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg"
```

#### Danger Button
```tsx
className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
```

### Badges (Pills)

#### Link Badge
```tsx
className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-900/50 text-cyan-400 rounded-full text-sm hover:bg-cyan-900"
```

#### Download Badge
```tsx
className="inline-flex items-center gap-1 px-3 py-1 bg-teal-900/50 text-teal-400 rounded-full text-sm hover:bg-teal-900"
```

#### Document Badge
```tsx
className="inline-flex items-center gap-1 px-3 py-1 bg-amber-900/50 text-amber-400 rounded-full text-sm hover:bg-amber-900"
```

#### Neutral Badge
```tsx
className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm hover:bg-slate-600"
```

### Cards

#### Post Card
```tsx
className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-700/50 transition-colors"
```

### Input Fields

```tsx
className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
```

### Alerts

#### Success Alert
```tsx
className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-3"
```

#### Error Alert
```tsx
className="bg-red-900/50 border border-red-500/50 rounded-lg p-4"
```

---

## Layout

### Header
```tsx
className="bg-slate-800/80 backdrop-blur-sm border-b border-cyan-900/50 sticky top-0 z-10"
```

### Navigation
```tsx
className="border-b border-cyan-900/50 bg-slate-900"
```

### Main Container
```tsx
className="min-h-screen bg-slate-900 text-white"
```

### Content Container
```tsx
className="max-w-6xl mx-auto px-4 py-6"
```

---

## Typography

### Brand Title
```tsx
className="text-xl font-bold text-cyan-400"
// or
className="text-2xl font-bold text-cyan-400"
```

### Page Title
```tsx
className="text-2xl font-bold text-cyan-400"
```

### Modal Title
```tsx
className="text-xl font-bold text-cyan-400"
```

### Channel Name
```tsx
className="font-medium text-cyan-400"
```

### Body Text
```tsx
className="text-slate-200"
```

### Secondary Text
```tsx
className="text-slate-400"
```

### Timestamp
```tsx
className="text-slate-500 text-sm"
```

### Count/Stats
```tsx
className="text-slate-400"
```

---

## Modal

### Overlay
```tsx
className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
```

### Modal Container
```tsx
className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 border border-cyan-900/50"
```

---

## Transitions

모든 인터랙티브 요소에 기본 트랜지션 적용:
```tsx
className="transition-colors"
```

---

## Best Practices

1. **일관성**: 정의된 컬러 팔레트만 사용
2. **접근성**: 충분한 대비를 위해 slate-200 이상의 텍스트 사용
3. **피드백**: 호버, 포커스 상태 명확히 표시
4. **계층**: backdrop-blur로 레이어 구분
5. **브랜드**: cyan-400을 핵심 액센트로 사용

---

## CSS Variables (Optional)

globals.css에 추가하여 사용 가능:

```css
:root {
  --color-brand: #22d3ee;
  --color-brand-hover: #0891b2;
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-border: rgba(22, 78, 99, 0.5);
}
```

---

## Tailwind Config Extension (Optional)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#22d3ee',
          dark: '#0891b2',
        }
      }
    }
  }
}
```
