export interface ClassificationResult {
  category: string;
  subcategory?: string;
  confidence: number;
}

// Keyword-based classifier (can be replaced with AI later)
const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; subcategories?: Record<string, string[]> }> = {
  'News': {
    keywords: ['속보', '뉴스', '보도', '발표', '기자', '언론', 'breaking', 'news', '긴급'],
    subcategories: {
      'Politics': ['정치', '국회', '대통령', '정부', '선거', '의원', '장관'],
      'Economy': ['경제', '주식', '금리', '환율', '물가', '부동산', 'GDP'],
      'Society': ['사회', '사건', '사고', '범죄', '재판', '법원'],
      'International': ['국제', '미국', '중국', '일본', '유럽', 'UN', '외교'],
    },
  },
  'Tech': {
    keywords: ['기술', '테크', 'AI', '인공지능', '앱', '서비스', '스타트업', 'IT', '개발', 'tech'],
    subcategories: {
      'AI': ['AI', '인공지능', 'GPT', 'LLM', '머신러닝', '딥러닝', 'ChatGPT'],
      'Startup': ['스타트업', '투자', '펀딩', 'VC', '유니콘', '창업'],
      'Product': ['출시', '업데이트', '신제품', '런칭', '베타'],
    },
  },
  'Crypto': {
    keywords: ['비트코인', '이더리움', '코인', '암호화폐', '크립토', '블록체인', 'BTC', 'ETH', 'crypto'],
    subcategories: {
      'Bitcoin': ['비트코인', 'BTC', '사토시'],
      'Altcoin': ['알트코인', '이더리움', 'ETH', '솔라나', 'SOL'],
      'DeFi': ['디파이', 'DeFi', '스테이킹', 'DEX', 'LP'],
      'NFT': ['NFT', '민팅', '오픈씨'],
    },
  },
  'Finance': {
    keywords: ['금융', '투자', '주식', '펀드', '은행', '증권', '채권', 'ETF'],
    subcategories: {
      'Stock': ['주식', '코스피', '코스닥', '나스닥', 'S&P'],
      'Real Estate': ['부동산', '아파트', '분양', '임대', '전세'],
      'Investment': ['투자', '포트폴리오', '자산', '배당'],
    },
  },
  'Entertainment': {
    keywords: ['연예', '아이돌', '드라마', '영화', '음악', '예능', '방송'],
    subcategories: {
      'K-Pop': ['아이돌', '컴백', '앨범', '뮤직비디오', 'MV'],
      'Drama': ['드라마', '시청률', '넷플릭스'],
      'Movie': ['영화', '개봉', '박스오피스'],
    },
  },
  'Sports': {
    keywords: ['스포츠', '축구', '야구', '농구', '골프', 'e스포츠', '올림픽'],
  },
  'Lifestyle': {
    keywords: ['라이프', '맛집', '여행', '패션', '뷰티', '건강', '운동'],
  },
  'Promotion': {
    keywords: ['할인', '세일', '이벤트', '쿠폰', '프로모션', '무료', '특가', '광고'],
  },
  'Other': {
    keywords: [],
  },
};

export function classifyContent(text: string): ClassificationResult {
  const normalizedText = text.toLowerCase();

  let bestMatch: ClassificationResult = {
    category: 'Other',
    confidence: 0,
  };

  for (const [category, config] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;

    let matchCount = 0;
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / 3, 1); // Max confidence at 3+ keyword matches

      if (confidence > bestMatch.confidence) {
        bestMatch = { category, confidence };

        // Check subcategories
        if (config.subcategories) {
          for (const [subcategory, subKeywords] of Object.entries(config.subcategories)) {
            for (const subKeyword of subKeywords) {
              if (normalizedText.includes(subKeyword.toLowerCase())) {
                bestMatch.subcategory = subcategory;
                break;
              }
            }
            if (bestMatch.subcategory) break;
          }
        }
      }
    }
  }

  // Default confidence for 'Other'
  if (bestMatch.category === 'Other') {
    bestMatch.confidence = 0.5;
  }

  return bestMatch;
}

// For future AI-based classification
export async function classifyContentWithAI(text: string): Promise<ClassificationResult> {
  // TODO: Implement with OpenAI or Claude API
  // For now, fallback to keyword-based
  return classifyContent(text);
}
