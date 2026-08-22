export interface GroundingTestCase {
  id: string;
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
    category: '설화/기원',
    poiName: '혼인지',
    query: '제주 삼성혈 신화에서 삼을나(고을나·양을나·부을나)가 벽랑국 세 공주와 혼인하여 살림을 차린 장소는 어디인가요?',
    difficulty: 'High',
    vulnerability: '일반 LLM은 한라산, 백록담 또는 삼성혈 자체에서 혼인식을 치렀다고 잘못 추론하기 쉽습니다.',
    groundTruthFact: '서귀포시 성산읍 온평리에 있는 혼인지(婚姻池)에서 목욕재계 후 혼례를 올렸으며, 인근 동굴인 신방굴(신혼방)에서 첫날밤을 보냈습니다.',
    targetKeywords: ['혼인지', '벽랑국', '온평리', '신방굴', '삼을나']
  },
  {
    id: 'case-2',
    category: '역사/풍류',
    poiName: '용연',
    query: '용연야범(龍淵夜泛)의 역사적 유래와 조선 시대 지방관들이 즐겼던 풍류의 실체는 무엇인가요?',
    difficulty: 'High',
    vulnerability: '단순한 야간 낚시나 현대 야경 축제로 혼동하거나, 다른 지역의 호수 뱃놀이로 지어낼 위험이 큽니다.',
    groundTruthFact: '제주목의 영주십경(瀛州十景) 중 하나로, 조선 시대 지방관(목사)과 선비들이 여름 달밤에 취병담(용연) 기암절벽 사이에 배를 띄우고 풍류와 시를 읊던 전통입니다.',
    targetKeywords: ['용연야범', '영주십경', '취병담', '기암절벽', '뱃놀이']
  },
  {
    id: 'case-3',
    category: '역사/전쟁',
    poiName: '외돌개',
    query: '서귀포 외돌개에 얽힌 최영 장군의 "장군석" 전설과 고려 말 목호(牧胡)의 난 토벌 과정은?',
    difficulty: 'Very High',
    vulnerability: '임진왜란 이순신 장군이나 조선 시대 왜구 격퇴로 시대와 대상을 완전히 왜곡하는 환각이 자주 발생합니다.',
    groundTruthFact: '고려 말(1374년) 몽골 목호 세력이 반란을 일으켜 서귀포 범섬으로 도망치자, 최영 장군이 외돌개를 거대한 장수 형상(장군석)으로 위장하여 적을 속이고 섬멸했습니다.',
    targetKeywords: ['최영', '장군석', '목호', '범섬', '원나라']
  },
  {
    id: 'case-4',
    category: '현대사/사적',
    poiName: '너븐숭이 4·3기념관',
    query: '제주 4·3 유적지인 너븐숭이 4·3기념관의 비극적인 북촌리 사건과 "애기무덤"의 유래는?',
    difficulty: 'Extreme',
    vulnerability: '고대 청동기 무덤이나 단순 설화로 왜곡하거나, 희생자들의 구체적인 역사적 배경(북촌리 집단학살)을 누락하기 쉽습니다.',
    groundTruthFact: '1949년 1월 17일 조천읍 북촌리에서 400여 명의 주민이 학살당할 때 희생된 젖먹이 어린아이들의 임시 매장지인 20여 기의 애기무덤과 현기영 소설 『순이 삼촌』의 모티프가 된 비극의 현장입니다.',
    targetKeywords: ['북촌리', '애기무덤', '순이 삼촌', '1949년', '너븐숭이']
  },
  {
    id: 'case-5',
    category: '민속/가옥',
    poiName: '제주민속촌',
    query: '제주 전통 가옥의 "올레"와 대문 역할을 하는 "정낭(정주석)"의 개수별(1개, 2개, 3개, 0개) 의미는?',
    difficulty: 'High',
    vulnerability: '정낭의 개수별 외출 거리(잠깐 외출 vs 반나절 vs 며칠)를 임의로 지어내거나 올레를 현대 걷기길로만 설명하는 오류가 흔합니다.',
    groundTruthFact: '정낭 1개(잠깐 이웃집 외출), 2개(반나절/밭일 외출), 3개(하루 이상 먼 출타), 0개(집에 주인이 있음)를 의미하며, 소와 말의 가옥 침입을 방지하는 지혜였습니다.',
    targetKeywords: ['정낭', '정주석', '올레', '외출', '이웃집']
  },
  {
    id: 'case-6',
    category: '인물/예술',
    poiName: '추사관',
    query: '추사 김정희가 제주 대정현 유배 시절 완성한 국보 "세한도(歲寒圖)"의 탄생 배경과 수령자는?',
    difficulty: 'Very High',
    vulnerability: '스승이나 임금(헌종), 혹은 아내에게 보낸 그림이라고 수령자를 잘못 답변하는 환각이 발생합니다.',
    groundTruthFact: '9년간의 대정현 유배 기간 동안 권세를 잃었음에도 북경에서 최신 서책을 구해 변함없이 보내준 역관 제자 이상적(李尙迪)의 의리에 감동하여 소나무와 잣나무를 그려 선물한 그림입니다.',
    targetKeywords: ['세한도', '이상적', '대정현', '유배', '소나무']
  },
  {
    id: 'case-7',
    category: '신앙/설화',
    poiName: '송당본향당',
    query: '제주 무속 신앙의 본산인 송당 본향당과 제주 당신(堂神)의 어머니로 불리는 "백주또"의 신화적 역할은?',
    difficulty: 'Very High',
    vulnerability: '설문대할망이나 삼성혈 신화와 혼동하거나, 불교의 관세음보살 신앙으로 잘못 해석하는 경우가 많습니다.',
    groundTruthFact: '송당본향당은 제주 1만 8천 신들의 총본산으로, 서울 강남천자국에서 내려온 농경신 백주또(금백주)가 소천국과 혼인하여 수많은 자식 신들을 낳고 각 마을 당으로 분파시킨 당신(堂神)의 원조입니다.',
    targetKeywords: ['백주또', '송당', '소천국', '농경신', '1만 8천']
  },
  {
    id: 'case-8',
    category: '해양/생활',
    poiName: '해녀박물관',
    query: '제주 해녀의 "불턱"과 "숨비소리", 그리고 물질 채취 도구인 "테왁"의 과학적 원리와 구조는?',
    difficulty: 'High',
    vulnerability: '테왁을 일반 그물망으로만 설명하거나 숨비소리를 주술적인 노래로 왜곡하는 오류가 발생합니다.',
    groundTruthFact: '불턱(바람을 막고 불을 피워 체온 회복 및 공동체 회의를 하던 둥근 돌담), 숨비소리(수면 위로 올라와 뇌 손상을 막고 이산화탄소를 배출하는 휘파람 호흡법), 테왁(박이나 스티로폼 부표에 망사리를 매단 부력 지지 도구)입니다.',
    targetKeywords: ['불턱', '숨비소리', '테왁', '망사리', '체온']
  },
  {
    id: 'case-9',
    category: '자연/지형',
    poiName: '쇠소깍',
    query: '서귀포 쇠소깍의 어원(쇠, 소, 깍의 뜻)과 담수와 해수가 만나는 독특한 하천 지형의 형성 원리는?',
    difficulty: 'Very High',
    vulnerability: '소(Cow)가 누워있는 계곡이라거나 쇠(Iron)가 묻힌 계곡 등 민간어원설을 지어내는 환각이 대표적입니다.',
    groundTruthFact: '효돈마을의 옛 지명인 "쇠(효돈)" + 물웅덩이를 뜻하는 "소" + 끝머리를 뜻하는 "깍"의 합성어로, 현무암 지하 용천수가 흘러나와 바닷물과 만나는 깊은 계곡 웅덩이입니다.',
    targetKeywords: ['효돈', '웅덩이', '용천수', '하천', '현무암']
  },
  {
    id: 'case-10',
    category: '음식/식문화',
    poiName: '동문재래시장',
    query: '제주 전통 잔치 음식인 "몸국"과 척박한 화산토 메밀로 만든 "빙떡"의 주재료와 역사적 유래는?',
    difficulty: 'High',
    vulnerability: '몸국을 소고기 해장국이나 미역국으로 잘못 설명하고, 빙떡을 달콤한 팥/설탕 찹쌀떡으로 지어낼 위험이 있습니다.',
    groundTruthFact: '몸국은 돼지고기를 삶은 진한 육수에 모자반(해조류, 몸)과 메밀가루를 풀어 끓인 대소사 잔치 음식이며, 빙떡은 메밀전병에 채 썬 무나물을 소로 넣고 멍석처럼 빙빙 말아먹는 담백한 전통 떡입니다.',
    targetKeywords: ['모자반', '메밀', '돼지고기', '무나물', '잔치']
  }
];
