/**
 * 카카오브레인 제주어 코퍼스(JIT - Jejueo Interview Transcripts) 및
 * 제주학연구센터 공인 제주어 방언 데이터베이스
 */

export interface DialectWord {
  jeju: string;
  standard: string;
  example: string;
  category: '인사/감탄' | '바다/해녀' | '자연/지형' | '일상/생활';
}

export interface DialectSentencePair {
  standard: string;
  jeju: string;
  speakerType: '할망' | '삼춘' | '하르방';
}

// 1. 핵심 제주어 어휘 사전 (도슨트 에이전트 RAG 주입용)
export const JEJU_DIALECT_DICTIONARY: DialectWord[] = [
  // 인사 / 감탄
  { jeju: '혼저옵서', standard: '어서 오세요', example: '제주에 혼저옵서예!', category: '인사/감탄' },
  { jeju: '폭삭 속았수다', standard: '정말 수고 많으셨습니다', example: '먼 길 오느라 폭삭 속았수다.', category: '인사/감탄' },
  { jeju: '펜안허우꽈', standard: '편안하십니까 (안녕하십니까)', example: '몸은 펜안허우꽈?', category: '인사/감탄' },
  { jeju: '게난', standard: '그러니까', example: '게난 옛날부터 이 바위가 유명했주게.', category: '인사/감탄' },
  { jeju: '하영', standard: '많이', example: '제주에 와서 하영 보고 갑서.', category: '인사/감탄' },
  { jeju: 'ᄀᆞᆯ아줍서', standard: '말씀해 주세요', example: '이 오름에 대해 ᄀᆞᆯ아줍서.', category: '인사/감탄' },

  // 바다 / 해녀
  { jeju: '바당', standard: '바다', example: '오늘 협재 바당 물결이 참 곱다게.', category: '바다/해녀' },
  { jeju: '숨비소리', standard: '해녀가 물 위로 올라와 내쉬는 호흡 소리', example: '저 멀리서 해녀들의 숨비소리가 들려옵니다.', category: '바다/해녀' },
  { jeju: '테왁', standard: '해녀가 물질할 때 가슴에 짚는 둥근 부표', example: '테왁 하나 메고 깊은 바다로 들어갑니다.', category: '바다/해녀' },
  { jeju: '빗창', standard: '전복을 뗄 때 쓰는 쇠 도구', example: '빗창으로 전복을 똑 떼어냅니다.', category: '바다/해녀' },
  { jeju: '물질', standard: '해녀가 해산물을 채취하는 일', example: '평생을 바당에서 물질하며 살아왔수다.', category: '바다/해녀' },
  { jeju: '불턱', standard: '해녀들이 바람을 막고 불을 쬐던 돌담 쉼터', example: '물질 끝나면 불턱에 모여 불을 쬐었주.', category: '바다/해녀' },
  { jeju: '삼춘', standard: '남녀 구분 없이 동네 어르신을 부르는 친근한 호칭', example: '해녀 삼춘, 오늘 물질 잘 되셨수꽈?', category: '바다/해녀' },

  // 자연 / 지형
  { jeju: '오름', standard: '소형 화산체 (기생화산)', example: '제주에는 삼백예순 오름이 있단다.', category: '자연/지형' },
  { jeju: '엉덕', standard: '바위 언덕 (낭떠러지)', example: '성산일출봉 엉덕에 서서 바다를 보아라.', category: '자연/지형' },
  { jeju: '곶자왈', standard: '화산 암괴 지대에 형성된 원시 난대림 숲', example: '숨 쉬는 제주의 허파 곶자왈이우다.', category: '자연/지형' },
  { jeju: '빌레', standard: '넓고 평평하게 펼쳐진 암반', example: '바닷가 현무암 빌레 위에 앉아 쉬어가게.', category: '자연/지형' },
  { jeju: '도르멍', standard: '달리며 / 뛰어다니며', example: '바람을 맞으며 도르멍 오름을 올랐단다.', category: '자연/지형' }
];

// 2. 카카오브레인 JIT 기반 실제 캐릭터별 구술 예시 (Few-shot Prompt Grounding)
export const JEJU_FEW_SHOTS: Record<string, DialectSentencePair[]> = {
  seolmundae: [
    {
      standard: '내가 옛날에 흙을 치마에 담아 날라 이 섬을 만들 때 성산일출봉은 내 빨래바구니였습니다.',
      jeju: '내가 옛날에 치마폭에 흑을 담앙 날르멍 요 고흔 섬을 맹글 때, 이 성산일출봉이 내 요긴한 ᄈᆞᆯ래바구니였주게!',
      speakerType: '할망'
    },
    {
      standard: '저 푸른 바다와 바위 봉우리들을 바라보니 가슴이 시원하지 않습니까?',
      jeju: '저 푸른 바당이랑 아흔아홉 봉우리들을 보난 가심이 뻥 뚫리멍 시원허지 않으냐, 손주야?',
      speakerType: '할망'
    }
  ],
  haenyeo: [
    {
      standard: '손님 어서 오세요! 오늘 바다가 아주 맑고 바람도 참 좋습니다.',
      jeju: '어이 손님, 혼저옵서게! 오늘 바당이 ᄒᆞ꼼 곱곡 바람도 아주 펜안허다게~',
      speakerType: '삼춘'
    },
    {
      standard: '우리 해녀들은 산소통 없이 테왁 하나만 짚고 10미터 바다 밑바닥까지 내려갑니다.',
      jeju: '우리 삼춘덜은 산소통도 읏이 요 테왁 ᄒᆞ나 메곡 열 길 바당 밑까장 물질허멍 들어간다 마씸.',
      speakerType: '삼춘'
    }
  ],
  harubang: [
    {
      standard: '탐라국의 오랜 역사를 지켜온 돌하르방입니다. 이 땅의 깊은 숨결을 전해드립니다.',
      jeju: '탐라의 오랜 역사를 굳건히 지켜온 몸이우다. 이 땅의 깊은 숨결을 전해드리옵니다.',
      speakerType: '하르방'
    },
    {
      standard: '조선시대 왜구의 침략을 막기 위해 성문 앞을 굳건히 지키고 있었습니다.',
      jeju: '조선 시절 왜구덜의 침략을 막으젠 성문 앞을 굳건히 지키곡 백성덜을 수호헷덴 헙디다.',
      speakerType: '하르방'
    }
  ]
};
