export interface GroundingTestCase {
  id: string;
  flowType: 'initial-summary' | 'chat-question';
  category: string;
  poiName: string;
  query: string;
  difficulty: 'High' | 'Very High' | 'Extreme';
  vulnerability: string;
  groundTruthFact: string;
  targetKeywords: string[];
}

export interface CorpusDoc {
  id: string;
  title: string;
  category: string;
  region: string;
  subcats: string[];
  summary: string;
  content: string;
}

export interface GroundingVerificationResult {
  testCase: GroundingTestCase;
  retrievedDocs: CorpusDoc[];
  agentAnswer: string;
  sources: string[];
  metrics: {
    factConsistencyScore: number; // 0 ~ 100%
    hallucinationDetected: boolean; // false = 무결
    matchedKeyFacts: string[];
    missingKeyFacts: string[];
    retrievedDocsCount: number;
    searchLatencyMs: number;
    generationLatencyMs: number;
    totalLatencyMs: number;
  };
}

export class GroundingEvalClient {
  public static async fetchTestCases(): Promise<GroundingTestCase[]> {
    try {
      const res = await fetch('/api/eval/test-cases');
      if (res.ok) {
        const data = await res.json();
        return data.testCases;
      }
    } catch (e) {
      console.warn('Backend eval endpoint offline, using local test cases fallback:', e);
    }
    return DEFAULT_FALLBACK_TEST_CASES;
  }

  public static async runTest(
    params: { testCaseId?: string; poiName: string; query: string }
  ): Promise<GroundingVerificationResult> {
    try {
      const res = await fetch('/api/eval/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return (await res.json()) as GroundingVerificationResult;
      }
    } catch (e) {
      console.error('Failed to run test on server:', e);
    }
    throw new Error('검증 테스트 서버 응답을 받지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
  }
}

export const DEFAULT_FALLBACK_TEST_CASES: GroundingTestCase[] = [
  {
    id: 'case-1',
    flowType: 'initial-summary',
    category: '첫 진입 요약',
    poiName: '만장굴',
    query: '만장굴에 처음 도착했을 때 보여줄 핵심 설명',
    difficulty: 'High',
    vulnerability: '다른 용암동굴이나 일반 석회동굴의 특징을 섞어 설명할 수 있습니다.',
    groundTruthFact: '만장굴은 거문오름 화산 활동으로 만들어진 제주 대표 용암동굴이며 유네스코 세계자연유산에 포함됩니다.',
    targetKeywords: ['만장굴', '용암동굴', '거문오름', '세계자연유산']
  },
  {
    id: 'case-2',
    flowType: 'initial-summary',
    category: '첫 진입 요약',
    poiName: '성산일출봉',
    query: '성산일출봉에 처음 도착했을 때 보여줄 핵심 설명',
    difficulty: 'High',
    vulnerability: '일반 오름처럼 육상 분화로만 만들어졌다고 설명할 수 있습니다.',
    groundTruthFact: '성산일출봉은 얕은 바다에서 수성화산 분화로 만들어진 응회구이며 유네스코 세계자연유산입니다.',
    targetKeywords: ['성산일출봉', '수성화산', '응회구', '세계자연유산']
  },
  {
    id: 'case-3',
    flowType: 'initial-summary',
    category: '첫 진입 요약',
    poiName: '제주 서귀포 산방산',
    query: '산방산에 처음 도착했을 때 보여줄 핵심 설명',
    difficulty: 'Very High',
    vulnerability: '한라산 분화구가 날아와 생겼다는 전설만 사실처럼 전달할 수 있습니다.',
    groundTruthFact: '산방산은 점성이 큰 용암이 굳어 만들어진 용암돔으로, 산방굴사와 산방덕 전설이 함께 전해집니다.',
    targetKeywords: ['산방산', '용암돔', '산방굴사', '산방덕']
  },
  {
    id: 'case-4',
    flowType: 'initial-summary',
    category: '첫 진입 요약',
    poiName: '제주목 관아',
    query: '제주목 관아에 처음 도착했을 때 보여줄 핵심 설명',
    difficulty: 'Extreme',
    vulnerability: '관덕정과 관아의 역할을 혼동하거나 현재 건물을 모두 원형 그대로라고 설명할 수 있습니다.',
    groundTruthFact: '제주목 관아는 조선 시대 제주 행정의 중심지였으며 관덕정과 함께 제주의 정치·문화사를 보여주는 유적입니다.',
    targetKeywords: ['제주목', '관아', '조선', '관덕정']
  },
  {
    id: 'case-5',
    flowType: 'initial-summary',
    category: '첫 진입 요약',
    poiName: '해녀박물관',
    query: '해녀박물관에 처음 도착했을 때 보여줄 핵심 설명',
    difficulty: 'High',
    vulnerability: '해녀 문화를 잠수 기술이나 관광 체험으로만 단순화할 수 있습니다.',
    groundTruthFact: '해녀박물관은 제주 해녀의 물질 도구와 공동체 문화, 생활사와 유네스코 인류무형문화유산의 가치를 소개합니다.',
    targetKeywords: ['해녀', '물질', '공동체', '유네스코']
  },
  {
    id: 'case-6',
    flowType: 'chat-question',
    category: '후속 질문',
    poiName: '혼인지',
    query: '제주의 세 신인과 바다 건너온 세 공주는 어디에서 혼례를 올리고 첫날밤을 보냈을까?',
    difficulty: 'Very High',
    vulnerability: '삼성혈이나 한라산에서 혼례를 올렸다고 혼동할 수 있습니다.',
    groundTruthFact: '삼을나는 온평리 혼인지에서 벽랑국 세 공주와 혼례를 올리고 신방굴에서 첫날밤을 보냈다고 전해집니다.',
    targetKeywords: ['혼인지', '벽랑국', '온평리', '신방굴']
  },
  {
    id: 'case-7',
    flowType: 'chat-question',
    category: '후속 질문',
    poiName: '제주민속촌',
    query: '제주 집 앞 정낭은 걸쳐진 나무 개수로 무엇을 알렸을까? 올레와 함께 쓰인 방식도 알려줘.',
    difficulty: 'Very High',
    vulnerability: '정낭 개수의 의미를 임의로 만들거나 올레를 현대 걷기길로만 설명할 수 있습니다.',
    groundTruthFact: '정낭은 나무 개수로 주인의 외출 상태를 알리고 가축의 출입을 막았으며, 올레는 집으로 이어지는 골목입니다.',
    targetKeywords: ['정낭', '올레', '외출', '가축']
  },
  {
    id: 'case-8',
    flowType: 'chat-question',
    category: '후속 질문',
    poiName: '제주 서귀포 외돌개',
    query: '외돌개가 장군석이라 불리는 이유는 무엇일까? 최영 장군과 목호의 난 이야기도 들려줘.',
    difficulty: 'High',
    vulnerability: '이순신 장군이나 임진왜란 이야기로 바꿔 설명할 수 있습니다.',
    groundTruthFact: '고려 말 목호의 난 때 최영 장군이 외돌개를 큰 장수처럼 보이게 해 적을 속였다는 장군석 전설이 전해집니다.',
    targetKeywords: ['최영', '장군석', '목호', '범섬']
  },
  {
    id: 'case-9',
    flowType: 'chat-question',
    category: '후속 질문',
    poiName: '제주 서귀포 쇠소깍',
    query: '쇠소깍이라는 이름은 소나 쇠와 관련 있을까? 이름의 뜻과 물빛이 독특한 이유를 알려줘.',
    difficulty: 'Very High',
    vulnerability: '소(Cow)가 누워있는 계곡이라거나 쇠(Iron)가 묻힌 계곡 등 민간어원설을 지어내는 환각이 대표적입니다.',
    groundTruthFact: '효돈마을의 옛 지명인 "쇠(효돈)" + 물웅덩이를 뜻하는 "소" + 끝머리를 뜻하는 "깍"의 합성어로, 현무암 지하 용천수가 흘러나와 바닷물과 만나는 깊은 계곡 웅덩이입니다.',
    targetKeywords: ['효돈', '웅덩이', '용천수', '하천', '현무암']
  },
  {
    id: 'case-10',
    flowType: 'chat-question',
    category: '후속 질문',
    poiName: '추사관',
    query: '추사 김정희는 제주 유배 중 왜 세한도를 그렸고, 누구에게 선물했을까?',
    difficulty: 'High',
    vulnerability: '임금이나 가족에게 준 그림으로 수령자를 잘못 설명할 수 있습니다.',
    groundTruthFact: '김정희는 제주 유배 중에도 책을 보내준 제자 이상적의 변함없는 의리에 감사해 세한도를 그려 선물했습니다.',
    targetKeywords: ['세한도', '이상적', '유배', '제자']
  }
];
