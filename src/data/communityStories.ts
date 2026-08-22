export interface UserCommunityStory {
  id: string;
  poiId: string;
  authorName: string;
  authorType: '우리 동네 주민' | '제주 이웃/삼촌' | '제주 여행자' | '신화/문화 탐방객';
  category: '옛날 이야기/전설' | '어릴 적 추억' | '나만의 풍경/사진' | '현장 이용 팁';
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
}

export const INITIAL_COMMUNITY_STORIES: UserCommunityStory[] = [
  {
    id: 'story-odungdong-1',
    poiId: 'c20902', // 오등동 사지
    authorName: '아라동 30년 삼촌',
    authorType: '우리 동네 주민',
    category: '옛날 이야기/전설',
    content: '어릴 적 어르신들께서 말씀하시길, 절왓(절이 있던 밭) 샘물에서 불타버린 사찰의 기와 조각이 나오곤 했습니다. 수풀이 무성하지만 비가 많이 온 뒤엔 수로 흔적이 맑게 드러납니다. 조용히 제주 역사의 옛 숨결을 느끼기 좋은 우리 동네 아카이브 장소입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80',
    createdAt: '2026.08.20',
    likes: 12
  },
  {
    id: 'story-odungdong-2',
    poiId: 'c20902',
    authorName: '제주 신화 길잡이',
    authorType: '신화/문화 탐방객',
    category: '현장 이용 팁',
    content: '고려 시대부터 조선 중기까지 이어진 사찰 터입니다. 지정된 관광지가 아닌 보존 장소이므로 쓰레기를 버리지 않고 옛 기와 흔적만 살포시 눈으로 둘러보는 미덕이 필요한 곳입니다.',
    createdAt: '2026.08.21',
    likes: 8
  },
  {
    id: 'story-ara1dong-1',
    poiId: 'c20901', // 아라1동
    authorName: '제주대 공대 재학생',
    authorType: '우리 동네 주민',
    category: '어릴 적 추억',
    content: '공과대학 4호관 주변으로 봄이면 벚꽃과 고사리가 피어나고, 산책로 따라 삼나무 숲길이 이어져요. 아라동은 옛 제주 서당과 선비들의 정취가 남아있는 차분하고 고즈넉한 마을입니다.',
    createdAt: '2026.08.22',
    likes: 15
  },
  {
    id: 'story-sungsan-1',
    poiId: 'c20101', // 성산일출봉
    authorName: '성산 해녀 삼춘',
    authorType: '제주 이웃/삼촌',
    category: '옛날 이야기/전설',
    content: '우리 어릴 때는 일출봉 아래 우도해협에서 물질하고 올라와 우뭇가사리를 말리곤 했습니다. 99개 바위 봉우리는 설문대할망이 신발에 묻은 흙을 털어 만든 것이라는 전설을 어머니께 들으며 자랐지요.',
    createdAt: '2026.08.19',
    likes: 24
  },
  {
    id: 'story-yongduam-1',
    poiId: 'c20102', // 용두암
    authorName: '용담동 바다지기',
    authorType: '우리 동네 주민',
    category: '나만의 풍경/사진',
    content: '석양 무렵 용두암 실루엣 너머로 노을이 질 때가 제일 예쁩니다. 어릴 때는 용머리바위 아래서 해녀 해산물 파는 천막이 정겨웠던 기억이 있네요.',
    createdAt: '2026.08.18',
    likes: 19
  }
];
