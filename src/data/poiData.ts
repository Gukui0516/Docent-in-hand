import { POI } from '../types/docent';

export const POI_LIST: POI[] = [
  {
    id: 'GC04600071',
    name: '성산일출봉',
    category: '자연과 지리',
    region: '서귀포시 성산읍',
    latitude: 33.4586,
    longitude: 126.9423,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '설문대할망의 빨래바구니와 99봉우리',
      summary: '설문대할망이 우도를 빨래판 삼고 일출봉 분화구를 빨래바구니 삼아 빨래를 했다는 창조 설화',
      details: '성산일출봉은 약 5,000년 전 얕은 바다에서 일어난 수성 화산활동으로 형성된 대표적인 응회구(Tuff Cone)입니다. 99개의 날카로운 바위 봉우리가 분화구 가장자리를 둘러싸고 있어 마치 거대한 성곽(Castle)처럼 보입니다. 유네스코 세계자연유산이자 천연기념물 제420호로 지정되어 있습니다.'
    },
    sampleQuestions: [
      '할망, 우도를 빨래돌로 쓰면 안 거칠었어요?',
      '분화구 안에는 진짜 물이 고여 있었나요?',
      '일출봉 바위가 99개인 이유가 뭐예요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '성산일출봉 분화구와 푸른 제주 바다 전경',
    imageSource: '한국관광공사 / 한국학중앙연구원 한국향토문화전자대전',
    tags: ['유네스코 세계자연유산', '천연기념물', '일출명소', '응회구']
  },
  {
    id: 'GC04600070',
    name: '제주 서귀포 산방산',
    category: '자연과 지리',
    region: '서귀포시 안덕면',
    latitude: 33.2364,
    longitude: 126.3129,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '한라산 꼭대기를 뽑아 던져 만든 산방산',
      summary: '설문대할망이 한라산 봉우리를 쥐어뜯어 던졌더니 산방산이 되고, 뽑힌 자리가 백록담이 되었다는 설화',
      details: '약 80만 년 전 점성이 높은 조면암질 용암이 분출하여 분화구 없이 돔 형태로 굳어진 전형적인 종상화산(Lava Dome)입니다. 높이 395m의 거대한 단일 바위산으로 서남쪽 중턱에 천연 석굴인 산방굴사가 있습니다.'
    },
    sampleQuestions: [
      '산방산이랑 백록담 크기가 진짜 딱 맞나요?',
      '산방굴사 천장에서 떨어지는 물방울은 누구 눈물인가요?',
      '바위산인데 나무는 어떻게 자라나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '웅장한 조면암질 용암돔 산방산 전경',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['종상화산', '산방굴사', '국가지정명승', '안덕면']
  },
  {
    id: 'GC04600034',
    name: '대포동 주상절리대',
    category: '자연과 지리',
    region: '서귀포시 중문동',
    latitude: 33.2376,
    longitude: 126.4253,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '신들의 조각품, 지삿개 주상절리',
      summary: '용암이 차가운 바다와 만나 빚어낸 4~6각형 돌기둥 병풍',
      details: '뜨거운 현무암질 용암이 해안으로 흘러들어 급격히 냉각되면서 수축 작용으로 형성된 육각형 기둥 군락입니다. 높이 30~40m의 깎아지른 수직 절벽이 약 2km에 걸쳐 발달해 있습니다.'
    },
    sampleQuestions: [
      '돌기둥이 왜 신기하게 육각형 모양으로 굳었나요?',
      '파도가 칠 때 돌 틈에서 소리가 나는 이유가 뭐예요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '대포동 해안 육각 주상절리 절벽',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['주상절리', '천연기념물 제443호', '중문관광단지']
  },
  {
    id: 'GC04600133',
    name: '천지연폭포',
    category: '자연과 지리',
    region: '서귀포시 천지동',
    latitude: 33.2448,
    longitude: 126.5596,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '하늘과 땅이 만나는 연못과 칠선녀',
      summary: '옥황상제를 모시던 일곱 선녀가 밤마다 내려와 맑은 물에 목욕을 하고 올라갔다는 전설',
      details: '높이 22m, 너비 12m의 폭포로 깊이 20m에 이르는 천연 소를 이룹니다. 천지연 계곡 일대는 난대림 지대로 천연기념물인 무태장어 서식지 및 담팔수 자생지가 함께 위치합니다.'
    },
    sampleQuestions: [
      '선녀들이 목욕하러 왔다는 연못 깊이가 몇 미터예요?',
      '무태장어는 실제로 얼마나 크게 자라나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '기암절벽 사이로 떨어지는 천지연폭포',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['칠선녀설화', '무태장어', '서귀포명소']
  },
  {
    id: 'GC04600134',
    name: '정방폭포',
    category: '자연과 지리',
    region: '서귀포시 동홍동',
    latitude: 33.2449,
    longitude: 126.5718,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '서복과 서귀포 지명의 유래',
      summary: '진시황의 불로초를 찾던 사신 서복이 절경에 감탄해 글을 새겨두고 서쪽으로 돌아갔다는 유래',
      details: '동양 유일의 해안 폭포로 수직 절벽에서 쏟아지는 높이 23m의 폭포수가 직접 바다로 떨어지는 희귀한 지형 경관입니다.'
    },
    sampleQuestions: [
      '폭포수가 바다로 바로 떨어지는 곳이 세계적으로 드문가요?',
      '서복이 바위에 새겼다는 글씨는 어디 있나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '바다로 직접 떨어지는 정방폭포',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['해안폭포', '서복전설', '영주십경']
  },
  {
    id: 'GC00710008',
    name: '만장굴',
    category: '자연과 지리',
    region: '제주시 구좌읍',
    latitude: 33.5284,
    longitude: 126.7716,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '용암이 뚫고 지나간 거대한 지하 궁전',
      summary: '설문대할망의 지하 숨결이 서린 세계 최장급 용암동굴',
      details: '총길이 약 7.4km로 세계에서 가장 긴 용암동굴 중 하나입니다. 약 25만 년 전 거문오름에서 분출된 용암이 바다로 흘러가며 형성되었으며 세계 최대 규모의 용암석주(7.6m)와 거북바위가 있습니다.'
    },
    sampleQuestions: [
      '용암이 어떻게 이렇게 거대한 동굴을 만들었나요?',
      '동굴 안에 거북이 모양 바위는 자연이 만든 게 맞나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '신비로운 만장굴 내부 용암석주 경관',
    imageSource: '한국관광공사 / 한국학중앙연구원',
    tags: ['유네스코 세계자연유산', '거문오름용암동굴계', '천연기념물']
  },
  {
    id: 'GC00700010',
    name: '용두암',
    category: '자연과 지리',
    region: '제주시 용담동',
    latitude: 33.5165,
    longitude: 126.5126,
    assignedCharacterId: 'seolmundae',
    mythAndFact: {
      mythTitle: '여의주를 훔치려다 바위가 된 용의 전설',
      summary: '한라산 신령의 옥구슬을 훔쳐 승천하려다 화살을 맞고 바위로 굳어버린 성난 용의 형상',
      details: '용암이 분출하다가 바닷물과 만나 급격히 식어 굳어진 10m 높이의 기암괴석으로, 울부짖으며 바다에서 솟구쳐 오르는 용의 머리를 빼닮았습니다.'
    },
    sampleQuestions: [
      '용두암 머리 부분이 진짜 용 머리랑 똑같나요?',
      '바람 불 때 파도가 치면 왜 용이 우는 소리가 나나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '바다를 향해 포효하는 형상의 용두암',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['제주국제공항근처', '용담해안', '기암괴석']
  },
  {
    id: 'GC00702597',
    name: '협재해수욕장 & 해녀 바당',
    category: '생활과 민속',
    region: '제주시 한림읍',
    latitude: 33.3940,
    longitude: 126.2397,
    assignedCharacterId: 'haenyeo',
    mythAndFact: {
      mythTitle: '비양도를 품은 은빛 모래밭과 해녀의 숨비소리',
      summary: '조개껍질 가루가 섞인 은빛 백사장과 천년 섬 비양도를 바라보며 물질하는 해녀들의 터전',
      details: '수심이 얕고 경사가 완만하며 조개껍질이 부서져 만들어진 패사(貝砂)로 은빛 백사장과 에메랄드빛 바다를 자랑합니다. 한림 해녀들의 주요 해녀어업 구역입니다.'
    },
    sampleQuestions: [
      '삼춘, 테왁 하나만 메고 바다에 들어가면 안 무서우꽈?',
      '숨비소리는 낼 때 왜 휘파람 소리가 나나요?',
      '저기 손에 잡힐 듯 보이는 섬이 비양도 맞수꽈?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '협재해수욕장과 건너편 비양도 에메랄드 해안',
    imageSource: '한국관광공사 / 제주향토문화대전',
    tags: ['해녀문화', '비양도', '에메랄드바다', '패사해변']
  },
  {
    id: 'GC00702596',
    name: '김녕해수욕장 & 해녀 불턱',
    category: '생활과 민속',
    region: '제주시 구좌읍',
    latitude: 33.5574,
    longitude: 126.7592,
    assignedCharacterId: 'haenyeo',
    mythAndFact: {
      mythTitle: '거친 바다를 이겨내는 해녀들의 쉼터, 불턱',
      summary: '물질을 마친 해녀들이 모여 불을 피워 차가운 몸을 녹이고 바다 지혜를 나누던 돌담 쉼터',
      details: '김녕리는 유네스코 인류무형문화유산으로 등재된 제주 해녀문화의 본고장 중 하나입니다. 코발트빛 바다와 풍력발전기, 해녀들이 만든 천연 현무암 불턱 유적이 보존되어 있습니다.'
    },
    sampleQuestions: [
      '불턱에서는 옷을 갈아입고 무엇을 했나요?',
      '김녕 바다는 소라나 전복이 많이 나오나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '김녕 해안의 코발트빛 바다와 현무암 풍경',
    imageSource: '한국관광공사 / 제주향토문화대전',
    tags: ['유네스코 인류무형유산', '해녀불턱', '김녕바당']
  },
  {
    id: 'GC00700266',
    name: '제주목관아 & 관덕정',
    category: '문화유산',
    region: '제주시 삼도2동',
    latitude: 33.5134,
    longitude: 126.5218,
    assignedCharacterId: 'dolhareubang',
    mythAndFact: {
      mythTitle: '탐라의 심장을 지키는 돌하르방의 수호 이야기',
      summary: '조선시대 제주 행정의 중심지이자 제주 읍성을 수호하던 돌하르방 48기의 역사',
      details: '조선시대 제주목의 행정 중심지였던 관아 터로, 보물 제322호인 관덕정(觀德亭)은 1448년(세종 30)에 건립된 제주에서 가장 오래된 대표 목조 건축물입니다.'
    },
    sampleQuestions: [
      '돌하르방은 원래 제주도 전체에 몇 기가 있었나요?',
      '관덕정 처마 밑 벽화에는 어떤 그림이 그려져 있나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '제주에서 가장 오래된 목조 건물 보물 관덕정',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['사적 제380호', '보물 제322호', '조선시대관아']
  },
  {
    id: 'GC00710736',
    name: '삼양동 선사유적',
    category: '문화유산',
    region: '제주시 삼양동',
    latitude: 33.5222,
    longitude: 126.5861,
    assignedCharacterId: 'dolhareubang',
    mythAndFact: {
      mythTitle: '기원전 탐라 선조들의 삶의 터전',
      summary: '수천 년 전 청동기·초기철기시대 한반도 남부 최대 규모의 해안 마을 유적',
      details: '기원전 1세기 전후 제주도 고대 탐라인들이 집단 거주했던 대규모 마을 유적으로, 230여 기의 집자리와 토기, 석기, 옥환 등이 출토된 사적 제416호입니다.'
    },
    sampleQuestions: [
      '수천 년 전 삼양동 사람들은 주로 무엇을 먹고 살았나요?',
      '움집은 어떤 구조로 지어졌나요?'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&auto=format&fit=crop&q=85',
    imageTitle: '삼양동 선사마을 원형 움집 복원 경관',
    imageSource: '한국관광공사 / 한국향토문화전자대전',
    tags: ['사적 제416호', '청동기마을', '탐라선사문화']
  }
];
