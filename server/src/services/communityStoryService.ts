import { FieldValue, Firestore } from '@google-cloud/firestore';

/**
 * 방명록(커뮤니티 스토리) 저장소.
 *
 * Firestore 를 쓴다. 이전 구현은 server/data/community_stories.json 에 파일로
 * 저장했는데 Cloud Run 에서는 동작하지 않는다:
 *
 *   1. 인스턴스 격리 — max-instances=5 라 인스턴스마다 별도 파일시스템을 갖는다.
 *      사용자 A 의 글이 #2 에 저장되면 #4 로 라우팅된 사용자 B 는 볼 수 없다.
 *      파일 락은 한 인스턴스 안에서만 유효하므로 이 문제를 막지 못한다.
 *   2. 휘발성 — 컨테이너 파일시스템은 인메모리(tmpfs)다. 인스턴스가 재활용되거나
 *      새로 배포되면 글이 전부 사라진다.
 *   3. 공감 카운터 경합 — read-modify-write 라 동시 요청 시 갱신이 유실된다.
 *
 * Firestore 는 셋 다 해결한다. 특히 공감은 FieldValue.increment 로 원자적이다.
 */

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

/** 문서 ID 를 고정해 둔다 — 시드를 여러 번 돌려도 덮어쓰기만 되고 중복되지 않는다. */
export const INITIAL_SEED_STORIES: UserCommunityStory[] = [
  {
    id: 'story-odungdong-1',
    poiId: 'c20902',
    authorName: '아라동 30년 삼촌',
    authorType: '우리 동네 주민',
    category: '옛날 이야기/전설',
    content:
      '어릴 적 어르신들께서 말씀하시길, 절왓(절이 있던 밭) 샘물에서 불타버린 사찰의 기와 조각이 나오곤 했습니다. 수풀이 무성하지만 비가 많이 온 뒤엔 수로 흔적이 맑게 드러납니다. 조용히 제주 역사의 옛 숨결을 느끼기 좋은 우리 동네 아카이브 장소입니다.',
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
    content:
      '고려 시대부터 조선 중기까지 이어진 사찰 터입니다. 지정된 관광지가 아닌 보존 장소이므로 쓰레기를 버리지 않고 옛 기와 흔적만 살포시 눈으로 둘러보는 미덕이 필요한 곳입니다.',
    createdAt: '2026.08.21',
    likes: 8
  },
  {
    id: 'story-ara1dong-1',
    poiId: 'c20901',
    authorName: '제주대 공대 재학생',
    authorType: '우리 동네 주민',
    category: '어릴 적 추억',
    content:
      '공과대학 4호관 주변으로 봄이면 벚꽃과 고사리가 피어나고, 산책로 따라 삼나무 숲길이 이어져요. 아라동은 옛 제주 서당과 선비들의 정취가 남아있는 차분하고 고즈넉한 마을입니다.',
    createdAt: '2026.08.22',
    likes: 15
  },
  {
    id: 'story-sungsan-1',
    poiId: 'c20101',
    authorName: '성산 해녀 삼춘',
    authorType: '제주 이웃/삼촌',
    category: '옛날 이야기/전설',
    content:
      '우리 어릴 때는 일출봉 아래 우도해협에서 물질하고 올라와 우뭇가사리를 말리곤 했습니다. 99개 바위 봉우리는 설문대할망이 신발에 묻은 흙을 털어 만든 것이라는 전설을 어머니께 들으며 자랐지요.',
    createdAt: '2026.08.19',
    likes: 24
  },
  {
    id: 'story-yongduam-1',
    poiId: 'c20102',
    authorName: '용담동 바다지기',
    authorType: '우리 동네 주민',
    category: '나만의 풍경/사진',
    content:
      '석양 무렵 용두암 실루엣 너머로 노을이 질 때가 제일 예쁩니다. 어릴 때는 용머리바위 아래서 해녀 해산물 파는 천막이 정겨웠던 기억이 있네요.',
    createdAt: '2026.08.18',
    likes: 19
  }
];

const COLLECTION = 'communityStories';
const MAX_CONTENT_LENGTH = 2000;

type StoryDoc = Omit<UserCommunityStory, 'id'>;

class CommunityStoryService {
  private db: Firestore | null = null;

  private client(): Firestore {
    return (this.db ??= new Firestore({ ignoreUndefinedProperties: true }));
  }

  /**
   * 시드 데이터를 적재한다. 문서 ID 가 고정이라 여러 번 실행해도 안전하다.
   * 이미 존재하는 문서는 건드리지 않는다 — 사용자가 누른 공감 수가 초기화되면 안 된다.
   */
  public async seedIfEmpty(): Promise<number> {
    const col = this.client().collection(COLLECTION);
    const batch = this.client().batch();
    let created = 0;

    const existing = await Promise.all(
      INITIAL_SEED_STORIES.map((s) => col.doc(s.id).get())
    );

    existing.forEach((snap, i) => {
      if (snap.exists) return;
      const { id, ...rest } = INITIAL_SEED_STORIES[i];
      batch.set(col.doc(id), rest satisfies StoryDoc);
      created++;
    });

    if (created > 0) await batch.commit();
    return created;
  }

  public async getStoriesByPoiId(poiId: string): Promise<UserCommunityStory[]> {
    // 정렬은 애플리케이션에서 한다. poiId 등호 + likes 정렬 복합 인덱스를 요구하지
    // 않으므로 인덱스 배포 없이 동작하고, POI 당 글 수가 적어 비용도 동일하다.
    const snap = await this.client().collection(COLLECTION).where('poiId', '==', poiId).get();

    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as StoryDoc) }))
      .sort((a, b) => b.likes - a.likes || b.createdAt.localeCompare(a.createdAt));
  }

  public async getAllStories(): Promise<UserCommunityStory[]> {
    const snap = await this.client().collection(COLLECTION).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as StoryDoc) }))
      .sort((a, b) => b.likes - a.likes || b.createdAt.localeCompare(a.createdAt));
  }

  public async createStory(params: {
    poiId: string;
    authorName: string;
    authorType?: UserCommunityStory['authorType'];
    category?: UserCommunityStory['category'];
    content: string;
    imageUrl?: string;
  }): Promise<UserCommunityStory> {
    const doc: StoryDoc = {
      poiId: params.poiId,
      authorName: (params.authorName || '제주 이웃').slice(0, 40),
      authorType: params.authorType || '우리 동네 주민',
      category: params.category || '옛날 이야기/전설',
      content: params.content.trim().slice(0, MAX_CONTENT_LENGTH),
      imageUrl: params.imageUrl,
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      likes: 0
    };

    const ref = await this.client().collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc };
  }

  /**
   * 공감 토글. increment 는 서버 측 원자 연산이라 동시 요청에도 갱신이 유실되지 않는다.
   * 파일 기반 read-modify-write 로는 보장할 수 없던 부분이다.
   */
  public async toggleLike(
    storyId: string,
    isLike: boolean
  ): Promise<{ found: boolean; likes: number }> {
    const ref = this.client().collection(COLLECTION).doc(storyId);

    try {
      await ref.update({ likes: FieldValue.increment(isLike ? 1 : -1) });
    } catch (e: any) {
      // NOT_FOUND(5) — 존재하지 않는 글
      if (e?.code === 5) return { found: false, likes: 0 };
      throw e;
    }

    const snap = await ref.get();
    const likes = (snap.data() as StoryDoc | undefined)?.likes ?? 0;

    // 취소가 몰려 음수가 되면 0 으로 되돌린다.
    if (likes < 0) {
      await ref.update({ likes: 0 });
      return { found: true, likes: 0 };
    }

    return { found: true, likes };
  }
}

export const communityStoryService = new CommunityStoryService();
