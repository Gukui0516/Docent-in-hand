import { POI } from "../types/docent";

export const POI_LIST: POI[] = [
  // ==================== [1. 설문대할망 - 신화 / 자연 / 오름 / 폭포 / 지질] ====================
  {
    id: "GC04600071",
    name: "성산일출봉",
    category: "자연과 지리",
    region: "서귀포시 성산읍",
    latitude: 33.4586,
    longitude: 126.9423,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "설문대할망의 빨래바구니와 99봉우리",
      summary: "설문대할망이 우도를 빨래판 삼고 일출봉 분화구를 빨래바구니 삼아 빨래를 했다는 창조 설화",
      details: "약 5,000년 전 얕은 바다에서 분출한 수성화산 응회구(Tuff Cone)로 99개의 바위 봉우리가 분화구를 성곽처럼 둘러싸고 있습니다. 유네스코 세계자연유산이자 천연기념물 제420호입니다."
    },
    sampleQuestions: [
      "할머니, 일출봉 분화구를 빨래바구니로 쓸 때 좁지 않으셨나요?",
      "99개 바위 봉우리는 어떻게 생겨난 건가요?",
      "수성화산 분출은 일반 화산과 어떻게 다른가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "성산일출봉 분화구와 푸른 제주 바다 전경",
    imageSource: "한국관광공사 / 한국학중앙연구원 한국향토문화전자대전",
    tags: ["유네스코 세계자연유산", "천연기념물", "일출명소", "수성화산"]
  },
  {
    id: "GC04600070",
    name: "제주 서귀포 산방산",
    category: "자연과 지리",
    region: "서귀포시 안덕면",
    latitude: 33.2364,
    longitude: 126.3129,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "한라산 꼭대기를 쥐어뜯어 던진 산방산",
      summary: "설문대할망이 한라산 봉우리를 뽑아 던졌더니 산방산이 되고 패인 곳이 백록담이 되었다는 천지개벽 설화",
      details: "약 80만 년 전 점성이 높은 조면암질 용암이 분출하여 분화구 없이 돔 형태로 굳어진 395m 높이의 거대한 종상화산입니다. 국가지정명승 제77호입니다."
    },
    sampleQuestions: [
      "산방산과 백록담 둘레가 진짜 꼭 맞나요?",
      "산방굴사 천장에서 떨어지는 물방울은 누구의 눈물인가요?",
      "조면암질 용암은 왜 분화구 없이 돔 모양으로 굳었나요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "웅장한 조면암질 용암돔 산방산 전경",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["국가지정명승", "종상화산", "산방굴사", "산방덕이"]
  },
  {
    id: "GC04600034",
    name: "대포동 주상절리대",
    category: "자연과 지리",
    region: "서귀포시 중문동",
    latitude: 33.2376,
    longitude: 126.4253,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "신들이 먹줄을 튕겨 깎은 돌계단 지삿개",
      summary: "바다 용왕이 옥황상제를 알현하러 오르내리던 신성한 계단이라는 설화가 깃든 육각형 돌기둥",
      details: "1,100도의 뜨거운 현무암질 용암이 차가운 바닷물과 만나 급랭하며 수축해 빚어낸 30~40m 높이의 천연기념물 제443호 주상절리 절벽입니다."
    },
    sampleQuestions: [
      "돌기둥이 왜 신기하게 육각형 모양으로 굳었나요?",
      "지삿개라는 이름은 무슨 뜻인가요?",
      "파도가 부딪칠 때 어떤 소리가 나나요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "대포동 해안 육각 주상절리 절벽",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["천연기념물 제443호", "주상절리", "지삿개", "중문관광단지"]
  },
  {
    id: "GC04600133",
    name: "천지연폭포",
    category: "자연과 지리",
    region: "서귀포시 천지동",
    latitude: 33.2448,
    longitude: 126.5596,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "하늘과 땅이 만나는 못과 칠선녀",
      summary: "옥황상제를 모시던 일곱 선녀가 밤마다 오색 구름을 타고 내려와 맑은 물에 멱을 감았다는 연못",
      details: "높이 22m 폭포와 깊이 20m의 천연 소로, 천연기념물 무태장어 서식지 및 아열대 난대림 숲이 어우러져 있습니다."
    },
    sampleQuestions: [
      "선녀들이 목욕하러 내려왔다는 연못 깊이가 몇 미터인가요?",
      "무태장어는 실제로 밤에만 볼 수 있나요?",
      "천지연 계곡에 자라는 희귀 식물은 무엇이 있나요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "기암절벽 사이로 떨어지는 천지연폭포",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["천연기념물", "칠선녀설화", "무태장어", "서귀포명소"]
  },
  {
    id: "GC04600134",
    name: "정방폭포",
    category: "자연과 지리",
    region: "서귀포시 동홍동",
    latitude: 33.2449,
    longitude: 126.5718,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "동양 유일 해안 폭포와 서복 전설",
      summary: "진시황의 불로초를 찾던 사신 서복이 서불과차를 새기고 서쪽으로 돌아갔다는 서귀포의 유래",
      details: "높이 23m의 거대한 물줄기가 바다로 곧장 떨어지는 동양 유일의 해안 수직 폭포로 국가지정명승 제43호입니다."
    },
    sampleQuestions: [
      "폭포수가 바다로 바로 떨어지는 곳이 세계적으로 드문가요?",
      "서귀포라는 이름이 서복 때문에 생긴 게 맞나요?",
      "주변 암벽 주상절리는 어떻게 형성되었나요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "바다로 직접 떨어지는 정방폭포",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["국가지정명승", "해안폭포", "서복전설", "영주십경"]
  },
  {
    id: "GC04601383",
    name: "쇠소깍",
    category: "자연과 지리",
    region: "서귀포시 하효동",
    latitude: 33.2519,
    longitude: 126.6234,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "용이 살던 연못 쇠소와 애틋한 사랑 설화",
      summary: "효돈천 민물과 바닷물이 만나 빚어낸 깊은 용소(쇠소)와 비련의 연인 전설",
      details: "현무암 용암류 틈새로 흐르는 효돈천 지하수가 바닷물과 만나는 깊은 계곡으로 국가지정명승 제78호입니다."
    },
    sampleQuestions: [
      "쇠소깍의 물빛이 에메랄드빛인 이유는 무엇인가요?",
      "전통 나룻배인 테우는 어떻게 타나요?",
      "쇠소라는 이름에 담긴 뜻은 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "기암괴석과 투명한 물빛의 쇠소깍 계곡",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["명승 제78호", "전통나룻배", "현무암계곡", "효돈천"]
  },
  {
    id: "GC04600039",
    name: "섭지코지",
    category: "자연과 지리",
    region: "서귀포시 성산읍",
    latitude: 33.4241,
    longitude: 126.9298,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "선녀를 사랑한 용왕 아들의 촛대바위(선돌바위)",
      summary: "하늘에서 내려온 선녀를 사랑한 용왕의 아들이 승천하지 못하고 굳어졌다는 애틋한 사랑 전설",
      details: "붉은 화산송이(스코리아)로 이루어진 화산암 지대와 해안 절벽, 봄철 노란 유채꽃이 장관을 이루는 성산의 대표 곶입니다."
    },
    sampleQuestions: [
      "촛대바위(선돌바위)에 얽힌 선녀 이야기가 궁금해요.",
      "붉은 화산송이 언덕은 어떻게 만들어졌나요?",
      "성산일출봉을 바라보는 최고의 뷰포인트는 어디인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "섭지코지 붉은오름과 선돌바위 해안",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["선돌바위", "붉은오름", "유채꽃명소", "화산송이"]
  },
  {
    id: "GC04600055",
    name: "외돌개",
    category: "자연과 지리",
    region: "서귀포시 서홍동",
    latitude: 33.2403,
    longitude: 126.5458,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "최영 장군의 장군석과 망부석 설화",
      summary: "고려 말 최영 장군이 왜구를 물리칠 때 장수로 위장시켰다는 바위이자 바다로 나간 남편을 기다리다 바위가 된 할망 전설",
      details: "약 150만 년 전 화산 분출로 형성된 높이 20m의 해식 기둥(시스택, Sea Stack)으로 국가지정명승 제79호입니다."
    },
    sampleQuestions: [
      "외돌개가 장군바위라고 불리게 된 최영 장군 이야기는 무엇인가요?",
      "바다 한가운데 우뚝 솟은 돌기둥은 어떻게 깎여 남았나요?",
      "올레 7코스에서 바라보는 외돌개의 절경 포인트는 어디인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "푸른 서귀포 바다 위에 우뚝 솟은 외돌개",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["명승 제79호", "시스택", "장군바위", "올레7코스"]
  },
  {
    id: "GC04600056",
    name: "용머리해안",
    category: "자연과 지리",
    region: "서귀포시 안덕면",
    latitude: 33.2323,
    longitude: 126.3147,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "진시황 사신 고종달이 용의 혈을 끊은 설화",
      summary: "천하를 얻을 왕이 날 것을 두려워한 진나라 사신이 칼로 꼬리와 잔등을 끊어 피를 흘렸다는 전설",
      details: "산방산 해안가에 위치한 수성화산체로 수천만 년 동안 층층이 쌓인 사암층 암벽이 파도에 깎여 웅장한 협곡을 이룹니다."
    },
    sampleQuestions: [
      "용머리해안 바위 지층이 층층이 쌓인 이유는 무엇인가요?",
      "하멜 표류비가 이곳에 세워진 역사적 배경은 무엇인가요?",
      "물때(만조/간조)에 따라 입장 시간이 달라지는 이유는 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "층층이 깎아지른 수성화산 사암층 용머리해안",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["천연기념물", "수성화산", "사암층", "하멜표류비"]
  },
  {
    id: "GC00710008",
    name: "만장굴",
    category: "자연과 지리",
    region: "제주시 구좌읍",
    latitude: 33.5284,
    longitude: 126.7716,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "거대한 땅의 용이 뚫고 지나간 태고의 지하 궁전",
      summary: "설문대할망의 지하 숨결이 서린 총길이 7.4km의 세계 최장급 용암동굴",
      details: "약 25만 년 전 거문오름 용암류가 바다로 흘러가며 형성된 유네스코 세계자연유산으로 7.6m 높이의 세계 최대 용암석주가 있습니다."
    },
    sampleQuestions: [
      "용암이 어떻게 지하에 이렇게 거대한 터널을 만들었나요?",
      "동굴 내부의 거북바위는 자연이 만든 모양이 맞나요?",
      "세계자연유산 거문오름 용암동굴계의 지질학적 가치는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01737",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01737",
            "alt": "만장굴 내부",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04505",
            "alt": "만장굴 입구",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01740",
            "alt": "만장굴 내 세계 제일의 용암주",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01738",
            "alt": "만장굴 용암교",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01739",
            "alt": "만장굴 용암구",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03324",
            "alt": "1970년대 만장굴 입구",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "신비로운 만장굴 내부 7.6m 용암석주",
    imageSource: "한국관광공사 / 한국학중앙연구원",
    tags: ["유네스코 세계자연유산", "천연기념물 제98호", "용암석주", "거북바위"]
  },
  {
    id: "GC00700010",
    name: "용두암",
    category: "자연과 지리",
    region: "제주시 용담동",
    latitude: 33.5165,
    longitude: 126.5126,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "여의주를 훔치려다 바위가 된 성난 용의 전설",
      summary: "한라산 신령의 옥구슬을 훔쳐 승천하려다 활을 맞고 바다로 굳어버린 포효하는 용의 형상",
      details: "뜨거운 용암이 분출하여 바다와 맞닿아 급랭하며 굳은 10m 높이의 현무암 기암괴석입니다."
    },
    sampleQuestions: [
      "용두암 바위가 진짜 용의 머리와 닮아 보이는 이유는 무엇인가요?",
      "파도가 칠 때 울부짖는 소리가 난다는 전설이 사실인가요?",
      "제주공항과 가장 가까운 역사적 명소로서의 매력은 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03480",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03480",
            "alt": "1900년대 초, 용연",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03481",
            "alt": "2005년 용연야범재현축제 장면",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00684",
            "alt": "용두암",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00686",
            "alt": "용연",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00687",
            "alt": "용연다리",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P05040",
            "alt": "용연야범재현축제",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "바다를 향해 포효하는 형상의 용두암",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["공항근처명소", "용담해안", "기암괴석", "포효하는용"]
  },
  {
    id: "GC00700967",
    name: "비자림",
    category: "자연과 지리",
    region: "제주시 구좌읍",
    latitude: 33.4912,
    longitude: 126.8115,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "천년의 숲을 지키는 새천년 비자나무",
      summary: "수령 500~800년 비자나무 2,800여 그루가 뿜어내는 피톤치드 원시림 설화",
      details: "천연기념물 제374호로 지정된 단일 수종 세계 최대 규모의 비자나무 숲으로 붉은 송이길이 잘 닦여 있습니다."
    },
    sampleQuestions: [
      "새천년 비자나무는 나이가 몇 살인가요?",
      "비자나무 열매는 옛 선조들이 어디에 약재로 썼나요?",
      "화산송이 흙길을 맨발로 걸으면 어떤 점이 좋나요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01764",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01764",
            "alt": "비자림 원경",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "천년 비자나무 원시림과 붉은 송이 산책로",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["천연기념물 제374호", "천년비자나무", "피톤치드", "화산송이길"]
  },
  {
    id: "GC04603004",
    name: "사려니숲길",
    category: "자연과 지리",
    region: "제주시 조천읍 / 서귀포시 표선면",
    latitude: 33.4077,
    longitude: 126.6434,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "솔솔 부는 바람과 신성한 숲의 기운",
      summary: "사려니(신성한 숲)라는 이름처럼 태고의 평온함과 삼나무 피톤치드가 넘치는 숲길",
      details: "해발 500m 유네스코 생물권보전지역으로 삼나무, 졸참나무, 서어나무 등이 울창하게 우거진 약 15km의 에코 힐링 로드입니다."
    },
    sampleQuestions: [
      "사려니라는 이름의 순우리말 뜻은 무엇인가요?",
      "삼나무 숲이 빽빽하게 자라난 역사는 어떻게 되나요?",
      "물찻오름으로 이어지는 숲길 탐방 팁이 궁금해요."
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09066",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09066",
            "alt": "사려니 숲길 입구",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09067",
            "alt": "사려니 숲길 탐방로",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09068",
            "alt": "사려니 숲길 탐방로",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "하늘 높이 뻗은 삼나무와 사려니 숲길",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["유네스코 생물권보전지역", "삼나무숲길", "에코로드", "힐링명소"]
  },
  {
    id: "GC00710001",
    name: "한라산 백록담",
    category: "자연과 지리",
    region: "서귀포시 토평동",
    latitude: 33.3617,
    longitude: 126.5332,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "흰 사슴을 타고 노닐던 신선과 백록담",
      summary: "신선들이 흰 사슴을 타고 유영하며 영생의 물을 마셨다는 남한 최고봉 한라산 분화구",
      details: "해발 1,947m 남한 최고봉으로 둘레 약 1.7km, 깊이 108m의 화산체 분화구 호수이며 국가지정명승 제84호입니다."
    },
    sampleQuestions: [
      "백록담이라는 이름에 흰 사슴 설화가 깃든 유래는 무엇인가요?",
      "성판악 코스와 관음사 코스의 차이점은 무엇인가요?",
      "백록담 분화구에 물이 고이는 원리는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01747",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01747",
            "alt": "한라산의 가을",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01748",
            "alt": "한라산의 겨울",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04775",
            "alt": "방패형화산, 한라산의 하와이형 순상화산",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01404",
            "alt": "백록담 기슭에 위치한 백록샘 용천수",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01749",
            "alt": "백록담 전경",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02142",
            "alt": "5&#183;16도로",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "남한 최고봉 한라산 백록담 분화구 전경",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["유네스코 세계자연유산", "국가지정명승", "남한최고봉", "백록담"]
  },
  {
    id: "GC00701801",
    name: "새별오름",
    category: "자연과 지리",
    region: "제주시 애월읍",
    latitude: 33.3664,
    longitude: 126.3578,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "저녁 하늘의 샛별처럼 빛나는 오름",
      summary: "고려 말 최영 장군이 목호를 토벌한 역사적 전적지이자 가을 억새 은빛 물결의 명소",
      details: "표고 519m의 기생화산으로 복합형 화산체이며, 매년 정월대보름 들불축제가 열리는 서부 대표 오름입니다."
    },
    sampleQuestions: [
      "새별오름이라는 이름이 붙은 이유는 무엇인가요?",
      "정월대보름 들불축제는 왜 시작되었나요?",
      "가을 억새 절경을 즐기기 가장 좋은 시간대는 언제인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02409",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02409",
            "alt": "새별 오름",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "은빛 억새 물결이 넘실대는 새별오름 능선",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["들불축제", "억새명소", "애월오름", "최영장군전적지"]
  },
  {
    id: "GC00701802",
    name: "용눈이오름",
    category: "자연과 지리",
    region: "제주시 구좌읍",
    latitude: 33.4601,
    longitude: 126.8322,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "용이 누워있는 부드러운 곡선의 여왕",
      summary: "용이 누워있는 모습 같다고 하여 이름 붙여진 3개 분화구를 품은 가장 아름다운 능선 오름",
      details: "표고 247.8m로 동부 오름 군락의 중심에 있으며 성산일출봉과 우도, 다랑쉬오름이 파노라마로 조망됩니다."
    },
    sampleQuestions: [
      "용눈이오름 정상에서 보이는 3개 분화구의 특징은 무엇인가요?",
      "능선이 유독 부드럽고 완만한 지질학적 이유는 무엇인가요?",
      "김영갑 사진작가가 사랑한 오름의 매력은 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01360",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01360",
            "alt": "「용눈이 오름」",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P05039",
            "alt": "용눈이 오름",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "부드러운 벨벳 능선을 자랑하는 용눈이오름",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["동부오름", "능선미", "일출일몰명소", "구좌오름"]
  },
  {
    id: "GC00701803",
    name: "다랑쉬오름 (월랑봉)",
    category: "자연과 지리",
    region: "제주시 구좌읍",
    latitude: 33.4735,
    longitude: 126.8378,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "오름의 여왕, 쟁반 같은 달맞이 분화구",
      summary: "달이 떠오르는 모습이 너무나 우아해 월랑봉이라 불리는 깊이 115m의 웅장한 원형 분화구",
      details: "표고 382.4m로 구좌읍 일대에서 가장 높고 균형 잡힌 원추형 화산체로 오름의 여왕이라 불립니다."
    },
    sampleQuestions: [
      "분화구 깊이가 백록담과 비슷하게 깊은 이유는 무엇인가요?",
      "다랑쉬오름 아래 아끈다랑쉬오름의 이름 뜻은 무엇인가요?",
      "제주 4·3 사건 다랑쉬굴 유적의 역사는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02564",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02564",
            "alt": "다랑쉬 오름",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02575",
            "alt": "아끈다랑쉬 오름",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "웅장한 원형 분화구를 품은 다랑쉬오름",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["오름의여왕", "원형분화구", "동부전망대", "구좌명소"]
  },
  {
    id: "GC04600057",
    name: "송악산",
    category: "자연과 지리",
    region: "서귀포시 대정읍",
    latitude: 33.2036,
    longitude: 126.2907,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "일흔아홉 개 봉우리와 가파도·마라도의 수호자",
      summary: "바람이 많이 불어 절울이(물결이 운다)라 불렸던 이중 분화구 해안 화산",
      details: "제주 최남단 해안 화산체로 99개 봉우리와 이중 분화구가 발달해 있으며, 태평양전쟁 당시 일제 진지동굴 유적이 남아있습니다."
    },
    sampleQuestions: [
      "송악산 해안 절벽 아래 일제 진지동굴은 왜 파놓은 건가요?",
      "이중 분화구 안쪽 분화구는 어떻게 형성되었나요?",
      "가파도와 마라도, 산방산이 한눈에 보이는 둘레길 코스는 어디인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "푸른 바다와 산방산이 한눈에 보이는 송악산 둘레길",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["이중분화구", "일제진지동굴", "가파도조망", "해안둘레길"]
  },
  {
    id: "GC00701804",
    name: "수월봉",
    category: "자연과 지리",
    region: "제주시 한경면",
    latitude: 33.2965,
    longitude: 126.1628,
    assignedCharacterId: "seolmundae",
    mythAndFact: {
      mythTitle: "수월이와 녹고 남매의 눈물, 녹고물",
      summary: "어머니의 약초를 캐다 목숨을 잃은 누이 수월이를 기리며 동생 녹고가 흘린 눈물샘 설화",
      details: "유네스코 세계지질공원의 핵심 명소로 화산재가 겹겹이 쌓인 완벽한 화산 쇄설층(화산재 지층 교과서) 단면을 관찰할 수 있습니다."
    },
    sampleQuestions: [
      "화산재가 시루떡처럼 겹겹이 쌓인 엉알길 단면의 특징은 무엇인가요?",
      "차귀도 너머로 떨어지는 일몰이 아름다운 이유는 무엇인가요?",
      "녹고물 약수터에 얽힌 효심 설화는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04786",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04786",
            "alt": "암석해안, 수월봉의 해식애 전경",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09147",
            "alt": "제주 수월봉 화산 쇄설층",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09144",
            "alt": "제주 수월봉 화산 쇄설층",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09145",
            "alt": "제주 수월봉 화산 쇄설층",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09146",
            "alt": "제주 수월봉 화산 쇄설층",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "세계지질공원 수월봉 화산쇄설층 엉알길",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["유네스코 세계지질공원", "화산쇄설층", "일몰명소", "차귀도조망"]
  },

  // ==================== [2. 해녀 삼춘 - 바다 / 해수욕장 / 섬 / 해녀문화] ====================
  {
    id: "GC00702597",
    name: "협재해수욕장",
    category: "생활과 민속",
    region: "제주시 한림읍",
    latitude: 33.3940,
    longitude: 126.2397,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "비양도를 품은 은빛 조개 모래와 해녀 숨비소리",
      summary: "조개껍질이 부서져 만들어진 은빛 백사장과 천년 화산섬 비양도가 마주보는 해녀들의 삶의 바다",
      details: "수심이 완만하고 패사로 이루어진 에메랄드빛 해변으로 한림읍 해녀들의 대표 물질 구역입니다."
    },
    sampleQuestions: [
      "삼춘, 테왁 하나만 메고 바다에 들어가면 안 무서우신가요?",
      "숨비소리는 낼 때 왜 휘파람 소리가 나나요?",
      "저기 손에 잡힐 듯 보이는 섬이 비양도가 맞나요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02688",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02688",
            "alt": "협재굴 내부",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02620",
            "alt": "협재해수욕장",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01754",
            "alt": "소천굴",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01753",
            "alt": "소천굴의 용암 산호",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01755",
            "alt": "협재굴 내부",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02501",
            "alt": "협재리",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "협재해수욕장과 건너편 비양도 에메랄드 해안",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["은빛백사장", "비양도조망", "해녀물질", "에메랄드바다"]
  },
  {
    id: "GC00702598",
    name: "금능해수욕장",
    category: "생활과 민속",
    region: "제주시 한림읍",
    latitude: 33.3892,
    longitude: 126.2348,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "썰물 때 드러나는 드넓은 모래톱과 원담",
      summary: "돌을 쌓아 물고기를 가두어 잡던 제주 전통 어로 방식인 원담 유적이 살아있는 포구",
      details: "협재와 이어지는 투명한 에메랄드빛 바다로 썰물 때 바다 멀리까지 모래밭이 드러나 아이들과 걷기 좋은 곳입니다."
    },
    sampleQuestions: [
      "제주 전통 어로 방식인 원담은 어떻게 물고기를 잡나요?",
      "썰물 때 모래톱이 얼마나 멀리까지 열리나요?",
      "금능 바다에서 주로 잡히는 해산물은 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03024",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03024",
            "alt": "금능농공단지",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02030",
            "alt": "금능리",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09032",
            "alt": "금능 으뜸원 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09034",
            "alt": "금능 으뜸원 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09033",
            "alt": "금능 으뜸원 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "원담과 투명한 에메랄드빛 물결의 금능해수욕장",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["원담유적", "에메랄드빛바다", "비양도", "가족휴양지"]
  },
  {
    id: "GC00702599",
    name: "함덕해수욕장",
    category: "생활과 민속",
    region: "제주시 조천읍",
    latitude: 33.5434,
    longitude: 126.6693,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "서우봉 아래 에메랄드빛 낙원",
      summary: "제주를 지키던 살찐 물소 형상의 서우봉과 하얀 모래사장, 해녀들의 숨비소리가 울려 퍼지는 명소",
      details: "수심이 얕고 모래톱이 발달하여 한국의 몰디브라 불리며, 봄철 서우봉 유채꽃과 어우러져 장관을 이룹니다."
    },
    sampleQuestions: [
      "서우봉 오름 위에 올라가면 함덕 바다가 어떻게 보이나요?",
      "함덕 해녀 삼춘들은 주로 어떤 계절에 물질을 많이 하나요?",
      "바다 한가운데 구름다리 산책로는 어떻게 연결되었나요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03156",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03156",
            "alt": "함덕해수욕장",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02997",
            "alt": "조천면 함덕출장소",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00162",
            "alt": "집중호우로 인한 농경지 침수 모습",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04209",
            "alt": "함덕리 유물산포지",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02599",
            "alt": "함덕포",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02939",
            "alt": "1960~1970년대의 함덕해수욕장",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "서우봉과 에메랄드빛 바다가 어우러진 함덕해수욕장",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["서우봉", "유채꽃", "에메랄드바다", "동부대표해변"]
  },
  {
    id: "GC00702596",
    name: "김녕해수욕장 & 해녀 불턱",
    category: "생활과 민속",
    region: "제주시 구좌읍",
    latitude: 33.5574,
    longitude: 126.7592,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "거친 바다를 이겨내는 해녀들의 쉼터, 불턱",
      summary: "물질을 마친 해녀들이 모여 불을 피우고 몸을 녹이며 바다의 지혜를 나누던 돌담 쉼터",
      details: "유네스코 인류무형문화유산으로 등재된 제주 해녀문화의 본고장으로 코발트빛 바다와 풍력발전기가 어우러집니다."
    },
    sampleQuestions: [
      "불턱 안에서는 어떤 이야기와 규칙이 오갔나요?",
      "김녕 바다의 갯바위에는 어떤 해조류가 자라나요?",
      "해녀들이 물질할 때 착용하는 고무옷과 물안경의 유래는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02197",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02197",
            "alt": "김녕미로공원",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03104",
            "alt": "김녕사굴",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04784",
            "alt": "김녕해수욕장",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04787",
            "alt": "인공해안, 김녕해안도로 전경",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02995",
            "alt": "구좌읍 김녕출장소(1951년 7월 1일 개소) 정면",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03101",
            "alt": "김녕리",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "김녕 해안의 코발트빛 바다와 현무암 풍경",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["유네스코 인류무형유산", "해녀불턱", "김녕바당", "풍력발전"]
  },
  {
    id: "GC00702600",
    name: "월정리해변",
    category: "생활과 민속",
    region: "제주시 구좌읍",
    latitude: 33.5562,
    longitude: 126.7958,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "달이 머무는 바다와 해녀들의 뿔소라 밭",
      summary: "하얀 백사장과 푸른 풍력발전기, 해녀들이 물질하며 갓 건져 올린 싱싱한 뿔소라의 바다",
      details: "아름다운 해안 도로와 카페 거리, 투명한 에메랄드빛 바다와 서핑 명소로 사랑받는 동부 해변입니다."
    },
    sampleQuestions: [
      "월정리라는 이름이 달이 머무는 마을이라는 뜻인가요?",
      "월정 바다의 풍력발전기는 왜 바닷가에 세워졌나요?",
      "해녀들이 채취하는 뿔소라는 언제 가장 맛이 좋나요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02168",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02168",
            "alt": "월정리",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09117",
            "alt": "월정리 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09120",
            "alt": "월정리 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09119",
            "alt": "월정리 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09118",
            "alt": "월정리 해변",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "하얀 모래사장과 에메랄드빛 물결의 월정리해변",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["달이머무는곳", "풍차해안", "카페거리", "서핑명소"]
  },
  {
    id: "GC00702601",
    name: "세화해수욕장",
    category: "생활과 민속",
    region: "제주시 구좌읍",
    latitude: 33.5242,
    longitude: 126.8617,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "제주 해녀 항일운동의 발상지이자 오일장 바당",
      summary: "일제의 착취에 맞서 일어난 1932년 제주 해녀 항일운동의 뜨거운 역사가 살아 숨 쉬는 곳",
      details: "세화 오일시장과 제주해녀박물관이 위치하며, 간조 때 투명한 바닥을 드러내는 코발트빛 해안입니다."
    },
    sampleQuestions: [
      "1932년 제주 해녀 항일운동은 어떻게 일어났나요?",
      "제주해녀박물관에서 꼭 보아야 할 전시물은 무엇인가요?",
      "세화 민속오일시장이 서는 날짜는 언제인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02210",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02210",
            "alt": "세화중학교",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03115",
            "alt": "세화리",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03892",
            "alt": "세화원씨 가옥",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03895",
            "alt": "세화원씨 가옥",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03363",
            "alt": "세화원씨 가옥",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03893",
            "alt": "세화원씨 가옥",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "세화 해변의 맑은 바다와 해녀박물관 전경",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["제주해녀박물관", "해녀항일운동", "세화오일장", "코발트바다"]
  },
  {
    id: "GC00702602",
    name: "이호테우해수욕장",
    category: "생활과 민속",
    region: "제주시 이호동",
    latitude: 33.4984,
    longitude: 126.4529,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "붉은 말·하얀 말 등대와 떼배(테우)",
      summary: "통나무를 엮어 만든 제주 전통 고깃배 테우와 조마(제주마)를 형상화한 이국적인 목마 등대",
      details: "제주 시내에서 가장 가까운 해수욕장으로 야경과 일몰이 아름다우며 전통 원담 어로 체험장이 복원되어 있습니다."
    },
    sampleQuestions: [
      "붉은 조마 등대와 하얀 조마 등대는 어떤 의미를 담고 있나요?",
      "통나무 떼배인 테우는 어떻게 바다에 띄웠나요?",
      "이호테우 축제에서는 어떤 체험을 할 수 있나요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "이호테우 해변의 상징 붉은 목마 등대와 일몰",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["목마등대", "테우체험", "공항근처", "일몰야경명소"]
  },
  {
    id: "GC00702603",
    name: "곽지과물해변",
    category: "생활과 민속",
    region: "제주시 애월읍",
    latitude: 33.4509,
    longitude: 126.3106,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "바닷가에서 솟아나는 차가운 민물, 과물 노천탕",
      summary: "바닷가 모래밭 틈새에서 차가운 용천수가 솟아올라 해녀들이 목욕을 하던 남녀 노천탕 유적",
      details: "천연 용천수 노천탕이 보존된 독특한 해수욕장으로 고운 백사장과 투명한 바다가 펼쳐집니다."
    },
    sampleQuestions: [
      "바닷가 바로 옆에서 짠물이 아닌 시원한 민물이 솟는 원리는 무엇인가요?",
      "해녀 삼춘들이 물질 후에 과물 노천탕을 어떻게 이용했나요?",
      "애월 한담해안산책로로 이어지는 길은 어디인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02401",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02401",
            "alt": "곽지해수욕장",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04780",
            "alt": "제주시의 용천 중 곽지물 모습",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02505",
            "alt": "과물 입구",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02191",
            "alt": "곽금초등학교",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03010",
            "alt": "곽지리",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03284",
            "alt": "곽지포",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "곽지과물해변과 천연 용천수 노천탕",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["용천수노천탕", "과물", "애월해변", "가족휴양지"]
  },
  {
    id: "GC00710026",
    name: "우도 (우도등대 & 산호해변)",
    category: "생활과 민속",
    region: "제주시 우도면",
    latitude: 33.5042,
    longitude: 126.9538,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "소가 누워있는 섬, 홍조단괴 서빈백사",
      summary: "설문대할망의 거대한 빨래판이자 세계적으로 희귀한 홍조단괴 산호빛 백사장의 섬",
      details: "성산항에서 배로 15분 거리에 있는 제주의 대표 부속섬으로 검멀레 해변, 동안경굴, 우도봉 등 우도 8경을 자랑합니다."
    },
    sampleQuestions: [
      "서빈백사의 하얀 모래가 일반 모래가 아니라 홍조단괴라는 게 사실인가요?",
      "동안경굴 안에서 고래가 살았다는 동굴 음악회 이야기는 무엇인가요?",
      "우도 땅콩이 다른 지역보다 고소하고 달콤한 이유는 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03421",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03421",
            "alt": "우도",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02526",
            "alt": "서빈백사",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04508",
            "alt": "서빈백사",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02537",
            "alt": "우도 홍조단괴 해빈",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P02954",
            "alt": "우도",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P04511",
            "alt": "우도",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "소가 누워있는 형태의 아름다운 섬 우도 전경",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["우도8경", "홍조단괴", "서빈백사", "우도땅콩"]
  },
  {
    id: "GC04601369",
    name: "가파도",
    category: "생활과 민속",
    region: "서귀포시 대정읍",
    latitude: 33.1678,
    longitude: 126.2731,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "봄날 청보리 물결과 가장 낮은 섬",
      summary: "키 큰 나무 없이 완만하게 펼쳐진 청보리밭과 해녀들이 가장 질 좋은 미역을 채취하던 바다",
      details: "모슬포항 남쪽 5.5km에 위치한 최고 높이 20.5m의 평탄한 섬으로 봄철 18만 평 청보리 축제가 열립니다."
    },
    sampleQuestions: [
      "가파도 청보리 축제는 몇 월에 가장 푸른가요?",
      "섬 전체에 전봇대와 키 큰 나무가 없는 이유는 무엇인가요?",
      "가파도 해녀들이 채취하는 자연산 미역과 톳의 맛은 어떤가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "바람에 일렁이는 가파도 청보리밭 풍경",
    imageSource: "한국관광공사 / 제주향토문화대전",
    tags: ["청보리축제", "올레10-1코스", "평탄한섬", "가파도미역"]
  },
  {
    id: "GC04601370",
    name: "마라도",
    category: "생활과 민속",
    region: "서귀포시 대정읍",
    latitude: 33.1189,
    longitude: 126.2681,
    assignedCharacterId: "haenyeo",
    mythAndFact: {
      mythTitle: "대한민국 최남단과 애기업개당 설화",
      summary: "바람이 불어 섬에 갇힌 사람들을 위해 스스로 희생한 소녀를 기리는 본향당 애기업개당",
      details: "대한민국 최남단 기념비와 마라도 성당, 등대가 위치한 천연기념물 제423호 섬 전체가 천연보호구역입니다."
    },
    sampleQuestions: [
      "대한민국 최남단 기념비 앞에서 바라보는 태평양 바다는 어떤 느낌인가요?",
      "애기업개당에 얽힌 눈물겨운 전설은 무엇인가요?",
      "마라도 등대가 한국 해양 항로에서 갖는 중요한 역할은 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "대한민국 최남단 마라도 해안 절벽과 등대",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["대한민국최남단", "천연기념물 제423호", "애기업개당", "마라도등대"]
  },

  // ==================== [3. 돌하르방 - 역사 / 문화유산 / 유적 / 읍성] ====================
  {
    id: "GC00700266",
    name: "제주목관아 & 관덕정",
    category: "문화유산",
    region: "제주시 삼도2동",
    latitude: 33.5134,
    longitude: 126.5218,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "탐라의 심장을 지키는 돌하르방의 수호 이야기",
      summary: "조선시대 제주 행정의 중심지이자 제주 읍성을 수호하던 돌하르방 48기의 역사",
      details: "보물 제322호인 관덕정(觀德亭)은 1448년(세종 30)에 건립된 제주에서 가장 오래된 대표 목조 건축물이며 사적 제380호입니다."
    },
    sampleQuestions: [
      "돌하르방은 원래 제주도 전체에 몇 기가 세워졌었나요?",
      "관덕정 편액 글씨와 처마 밑 벽화에는 어떤 역사가 담겨 있나요?",
      "조선시대 제주목사가 정사를 보던 관아 건물의 복원 과정은 어떠했나요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00071",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00071",
            "alt": "관덕정",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03504",
            "alt": "1950년대 관덕정 거리의 교통대",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P09012",
            "alt": "관덕정 앞 관덕로 구간",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "제주에서 가장 오래된 목조 건물 보물 관덕정",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["사적 제380호", "보물 제322호", "조선시대목관아", "돌하르방"]
  },
  {
    id: "GC00701036",
    name: "삼성혈",
    category: "문화유산",
    region: "제주시 이도1동",
    latitude: 33.4981,
    longitude: 126.5317,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "탐라국 개국 시조 삼을나의 탄생 신화",
      summary: "태초에 고을나, 양을나, 부을나 삼신인이 땅에서 솟아올라 탐라국을 세웠다는 성스러운 세 구멍",
      details: "수백 년 된 고목들로 둘러싸인 신성한 성역으로 사적 제134호이며, 비나 눈이 와도 구멍 안에 쌓이지 않는 신비로움이 있습니다."
    },
    sampleQuestions: [
      "삼신인이 솟아났다는 세 개의 품혈 구멍은 왜 눈이나 비가 고이지 않나요?",
      "삼신인이 쏜 화살이 꽂힌 땅을 나누어 가졌다는 사시장올악 설화는 무엇인가요?",
      "삼성혈을 둘러싼 울창한 고목 숲의 수령은 몇 년인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01724",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01724",
            "alt": "제주 삼성혈 경내",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P00435",
            "alt": "제주 삼성혈 입구",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "탐라국 개국 신화의 성지 삼성혈 품혈",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["사적 제134호", "탐라개국신화", "삼을나", "모흥혈"]
  },
  {
    id: "GC00710736",
    name: "삼양동 선사유적",
    category: "문화유산",
    region: "제주시 삼양동",
    latitude: 33.5222,
    longitude: 126.5861,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "기원전 탐라 선조들의 삶의 터전",
      summary: "수천 년 전 청동기·초기철기시대 한반도 남부 최대 규모의 해안 마을 유적",
      details: "기원전 1세기 전후 제주도 고대 탐라인들이 집단 거주했던 대규모 마을 유적으로 230여 기의 집자리가 발굴된 사적 제416호입니다."
    },
    sampleQuestions: [
      "기원전 삼양동 선사마을 사람들은 어떤 도구를 만들어 썼나요?",
      "복원된 원형 움집의 내부 구조는 어떻게 생겼나요?",
      "삼양동 검은모래해변과 선사유적의 연관성은 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03021",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P03021",
            "alt": "삼양동",
            "source": "한국학중앙연구원 향토문화전자대전"
      },
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P05074",
            "alt": "제주 삼양동 유적 발굴",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "삼양동 선사마을 원형 움집 복원 경관",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["사적 제416호", "청동기마을", "탐라선사문화", "원형움집"]
  },
  {
    id: "GC00701050",
    name: "항파두리 항몽유적지",
    category: "문화유산",
    region: "제주시 애월읍",
    latitude: 33.4528,
    longitude: 126.4116,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "삼별초의 결사항전과 김통정 장군의 살손물",
      summary: "고려 무인정권 삼별초가 몽골 제국에 끝까지 맞서 성을 쌓고 최후의 항쟁을 벌였던 호국의 성지",
      details: "토성과 석성으로 축조된 내성 및 외성 구조의 요새로 사적 제396호이며 김통정 장군의 발자국에서 솟았다는 장수물이 있습니다."
    },
    sampleQuestions: [
      "삼별초가 강화도, 진도를 거쳐 왜 제주 항파두리에 마지막 성을 쌓았나요?",
      "항파두리 토성은 흙과 돌을 어떻게 섞어 튼튼하게 쌓았나요?",
      "김통정 장군이 바위를 밟아 솟아났다는 장수물의 전설은 무엇인가요?"
    ],
    imageUrl: "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01733",
    images: [
      {
            "src": "https://jeju.grandculture.net/Image?localName=jeju&id=GC007P01733",
            "alt": "항파두리 토성",
            "source": "한국학중앙연구원 향토문화전자대전"
      }
],
    imageTitle: "호국 삼별초의 최후 항전지 항파두리 토성",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["사적 제396호", "삼별초항몽", "김통정장군", "항파두리토성"]
  },
  {
    id: "GC04600527",
    name: "성읍민속마을",
    category: "문화유산",
    region: "서귀포시 표선면",
    latitude: 33.3872,
    longitude: 126.7994,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "조선 500년 정의현의 옛 도읍지와 돌담길",
      summary: "초가집과 돌담, 팽나무, 정의현 관아가 원형 그대로 보존되어 주민들이 실제로 살아가는 살아있는 민속촌",
      details: "국가지정 국가민속문화재 제188호로 일관헌, 정의향교, 500년 수령의 느티나무와 팽나무, 12기의 원형 돌하르방이 지키고 있습니다."
    },
    sampleQuestions: [
      "성읍민속마을 돌하르방은 제주시 돌하르방과 얼굴 표정이 어떻게 다른가요?",
      "제주 전통 초가의 짚풀 지붕은 바람에 날아가지 않게 어떻게 묶나요?",
      "성읍마을에 보존된 제주 전통 똥돼지 돗통시의 원리는 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "옛 정의현 도읍의 정취를 간직한 성읍민속마을",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["국가민속문화재 제188호", "정의현도읍지", "원형초가", "살아있는민속마을"]
  },
  {
    id: "GC04600528",
    name: "추사 김정희 유배지 & 세한도",
    category: "문화유산",
    region: "서귀포시 대정읍",
    latitude: 33.2483,
    longitude: 126.2489,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "추사체와 국보 세한도가 탄생한 고난의 쉼터",
      summary: "조선의 대학자 추사 김정희가 9년간의 가시울타리(위리안치) 유배 속에서 불멸의 예술을 꽃피운 곳",
      details: "사적 제487호로 지정된 복원 가옥과 추사관이 위치하며 국보 제180호 세한도와 추사체의 정수를 감상할 수 있습니다."
    },
    sampleQuestions: [
      "추사 김정희가 가시울타리 안에서 세한도를 그리게 된 사연은 무엇인가요?",
      "독창적인 서체인 추사체는 제주 유배 시절 어떻게 완성되었나요?",
      "대정골 유배지 가옥의 안거리, 밖거리 구조는 어떠한가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "추사 김정희 유배지 가옥과 제주 추사관",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["사적 제487호", "추사김정희", "세한도", "추사체"]
  },
  {
    id: "GC04600529",
    name: "혼인지 (婚姻池)",
    category: "문화유산",
    region: "서귀포시 성산읍",
    latitude: 33.4358,
    longitude: 126.8973,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "탐라 삼신인과 벽랑국 삼공주의 혼례 설화",
      summary: "삼성혈에서 솟아난 삼신인이 동쪽 바다에서 온 벽랑국 세 공주와 첫 혼례를 올리고 신혼방을 차린 굴",
      details: "제주특별자치도 기념물 제17호로 500여 평의 자연 연못과 신방굴이라 불리는 삼공주 추억의 천연 동굴이 보존되어 있습니다."
    },
    sampleQuestions: [
      "벽랑국 세 공주가 가져온 오곡의 씨앗과 망아지, 송아지가 제주 농경의 시작인가요?",
      "혼인지 옆 신방굴 안에는 실제로 세 칸의 굴 방이 있나요?",
      "봄과 여름철 혼인지 연못 주변에 피어나는 수국길의 매력은 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "탐라국 시조들의 혼례터 혼인지 연못",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["제주도기념물 제17호", "벽랑국삼공주", "신방굴", "탐라혼례설화"]
  },
  {
    id: "GC00701051",
    name: "조천 연북정 (戀北亭)",
    category: "문화유산",
    region: "제주시 조천읍",
    latitude: 33.5411,
    longitude: 126.6342,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "북녘의 임금님을 그리워하던 유배객의 정자",
      summary: "뭍에서 제주로 들어오는 첫 관문인 조천포구 성곽 위에 북쪽 한양을 바라보며 지은 정자",
      details: "제주특별자치도 유형문화재 제3호로 1590년 조천관을 중수하며 연북정이라 개칭하였으며 왜구를 감시하던 방어 망루 역할을 겸했습니다."
    },
    sampleQuestions: [
      "조선시대 유배객들이 연북정에서 북쪽을 바라보며 지은 시문에는 어떤 애환이 담겨 있나요?",
      "조천포구가 제주와 육지를 잇는 가장 중요한 관문 포구였던 이유는 무엇인가요?",
      "정자 아래 타원형 석성의 건축적 특징은 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "조천포구 석성 위에 우뚝 선 연북정",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["유형문화재 제3호", "조천포구", "연북정", "왜구방어망루"]
  },
  {
    id: "GC00701052",
    name: "별방진 (別防鎭)",
    category: "문화유산",
    region: "제주시 구좌읍",
    latitude: 33.5287,
    longitude: 126.8839,
    assignedCharacterId: "dolhareubang",
    mythAndFact: {
      mythTitle: "왜구의 침탈을 막아낸 동북부 최대의 검은 돌성",
      summary: "조선 중종 1510년 제주목사 장림이 왜구 침입에 대비해 타원형으로 쌓은 검은 현무암 석성",
      details: "제주특별자치도 기념물 제24호로 성 둘레 약 1,008m, 높이 3.5m의 석성이 해안을 감싸고 있으며 봄철 성벽 안 유채꽃이 장관입니다."
    },
    sampleQuestions: [
      "조선시대 왜구들이 왜 유독 우도와 하도리 해안으로 자주 침범했나요?",
      "성벽을 쌓을 때 사용한 거친 현무암 돌쌓기 축조 기법은 어떠한가요?",
      "성벽 위를 걸으며 바라보는 하도리 앞바다의 방어적 가치는 무엇인가요?"
    ],
    imageUrl: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=85",
    imageTitle: "검은 현무암으로 해안을 에워싼 별방진 성벽",
    imageSource: "한국관광공사 / 한국향토문화전자대전",
    tags: ["제주도기념물 제24호", "현무암석성", "하도리포구", "왜구방어성곽"]
  }
];
