import { GoogleGenAI } from '@google/genai';
import { POI, Character } from '../types/docent';
import { RAGService } from './ragService';

// RAG-Enhanced High-Fidelity 3-Act Narratives (550~750 chars) in Natural Standard Korean
const RAG_FALLBACK_STORIES: Record<string, string> = {
  GC04600071: `반갑습니다. 푸른 바다 위에 우뚝 솟은 이 웅장한 분화구가 한눈에 내려다보이시지요?

제가 아득한 태초에 치마폭에 흙을 담아 나르며 이 아름다운 제주 섬과 360여 개의 오름들을 빚어낼 때, 유독 반듯하고 거대하게 솟아오른 이 성산일출봉을 제 가장 요긴한 빨래바구니로 삼았답니다. 저기 바다 건너 둥둥 떠 있는 우도는 제 널찍한 빨래판이었고, 분화구 둘레를 성곽처럼 에워싼 99개의 날카로운 바위 봉우리는 빨래를 널어 말리던 옷걸이였지요. 원래 100번째 봉우리까지 있었다면 대륙으로 뻗칠 명산이 되었을 텐데, 딱 하나가 모자라 제주의 바다를 지키는 파수꾼으로 남았다는 정겨운 옛이야기가 전해 내려옵니다.

사실 이곳은 약 5천 년 전 뜨거운 마그마가 차가운 바닷물과 격렬하게 반응하며 솟구쳐 오른 수성화산의 세계적인 걸작입니다. 여행자님, 저 푸른 바다를 품은 99개 봉우리 너머로 솟아오르는 장엄한 기운이 가슴에 와닿으십니까?`,

  GC04600070: `반갑습니다. 눈앞에 거대한 병풍처럼 우뚝 솟아오른 바위산의 위용이 참 대단하지요?

옛날 옛적 제가 한라산 꼭대기를 손으로 툭 쥐어뜯어 남쪽 바다로 휙 던졌더니 바로 이 산방산이 되었고, 뜯겨나간 한라산 자리가 움푹 파여 백록담이 되었다는 천지개벽 설화가 전해집니다. 실제로 산방산의 암질과 웅장한 둘레가 백록담 크기와 꼭 닮아 옛 조상들의 놀라운 직관을 엿볼 수 있지요. 저 산 중턱 천연 석굴인 산방굴사 천장에서는 사시사철 맑은 석간수가 똑똑 떨어지는데, 인간 세상의 탐욕에 상처 입고 스스로 바위가 된 수호 여신 '산방덕이'가 흘리는 눈물방울이라는 애틋한 전설이 깃들어 있습니다.

약 80만 년 전 끈적끈적한 조면암질 용암이 분화구 없이 솟구쳐 굳어버린 395m 높이의 거대한 용암돔이지요. 비바람에도 끄떡없는 저 듬직한 바위산의 숨결을 마주하니 마음이 편안해지지 않으신가요?`,

  GC04600034: `반갑습니다. 바다를 향해 정교하게 깎아지른 저 육각형 돌기둥 병풍들이 참 신비롭지 않나요?

옛 제주 사람들은 이곳을 '신들이 거대한 먹줄을 튕겨 바다와 육지의 경계를 지어놓은 돌계단'이라 불렀습니다. 기와지붕처럼 층층이 겹쳐졌다 하여 '지삿개'라 불렀는데, 바다 용왕님이 하늘의 옥황상제를 알현하러 오르내리던 신성한 계단이라는 설화가 깃들어 있지요. 거센 파도가 30m 높이의 주상절리 절벽에 부딪쳐 하얀 포말을 뿜어낼 때마다 바위 틈새에서 웅장하게 울려 퍼지는 소리는 바다 밑에 잠든 해신의 거친 숨소리로 여겨졌습니다.

섭씨 1,100도가 넘는 뜨거운 용암이 차가운 제주 바다로 흘러들어 급격히 식으며 수축하여 빚어낸 자연의 위대한 조각품입니다. 저 웅장한 바위 절벽과 포효하는 파도를 마주하니 어떤 감동이 느껴지시나요?`,

  GC04600133: `반갑습니다. 기암절벽 사이로 시원하게 쏟아지는 천지연의 물소리가 가슴을 맑게 울리지요?

'하늘과 땅이 만나는 신성한 연못'이라 하여, 예부터 밤마다 옥황상제를 모시던 어여쁜 칠선녀들이 오색 구름을 타고 내려와 맑은 물에 멱을 감고 노닐다 하늘로 올라갔다는 낭만적인 전설이 전해집니다. 깊이가 20m에 이르는 이 신비로운 연못 속에는 밤에만 모습을 드러낸다는 전설의 영물, 천연기념물 무태장어가 깊은 물속을 지키고 있지요.

주변의 울창한 난대림 숲과 기암절벽이 빚어낸 천연의 비경 속에서 옛 선조들은 자연을 경외하며 마음을 씻어냈습니다. 시원하게 떨어지는 물줄기를 바라보고 있으니 도심의 번뇌가 싹 씻겨 내려가는 듯하지 않으신가요?`,

  GC04600134: `반갑습니다. 수직 절벽에서 쏟아진 거대한 물줄기가 푸른 바다로 곧장 내리꽂히는 장관이 눈에 들어오시지요?

바다로 직접 떨어지는 폭포는 동양에서 오직 이곳 정방폭포뿐입니다. 옛날 진시황의 명을 받고 불로초를 찾아 제주에 온 사신 서복(徐福)이 이 폭포의 기막힌 절경에 매료되어 절벽 암벽에 '서불과차(徐市過此, 서복이 이곳을 지나가다)'라는 글씨를 새겨두고 서쪽으로 돌아갔다 하여 오늘날 '서귀포(西歸浦)'라는 지명이 탄생했답니다.

높이 23m 절벽에서 쏟아지는 폭포수와 드넓은 태평양 바다가 만나는 이 경이로운 광경 앞에서, 수천 년 전 불로장생을 꿈꾸며 바다를 건넜던 옛사람들의 염원이 느껴지지 않으신가요?`,

  GC00710008: `반갑습니다. 지하 수십 미터 아래 끝없이 펼쳐진 암흑 속에서 대지의 깊은 맥박이 느껴지시지요?

이곳 만장굴은 약 25만 년 전 거문오름에서 터져 나온 뜨거운 용암이 바다를 향해 질주하며 뚫어놓은 총길이 7.4km의 세계 최장급 용암동굴입니다. 옛 어르신들은 땅속 깊은 곳에 거대한 땅의 용(地龍)이 잠들어 있다고 믿었지요. 동굴 안쪽으로 깊숙이 들어가면 천장에서 흘러내린 용암이 굳어 신전의 기둥처럼 우뚝 솟은 7.6m의 세계 최대 '용암석주'와, 신기하게도 제주도 섬 모양을 쏙 빼닮은 거대한 '용암 거북바위'가 위용을 뽐내고 있습니다.

한여름에도 섭씨 12도의 서늘한 기운을 간직한 이 태고의 지하 궁전에 서 있으니, 거대한 화산이 살아 숨 쉬던 태초의 순간이 눈앞에 그려지지 않으십니까?`,

  GC00702597: `반갑습니다, 여행자님! 눈앞에 에메랄드빛으로 반짝이는 맑은 협재 바다가 참 아름답지요?

저기 손에 잡힐 듯 떠 있는 비양도는 천년 전 고려시대에 바다 한가운데서 산이 불쑥 솟아올라 만들어졌다는 신비로운 화산섬입니다. 우리 협재 바다의 은빛 백사장은 오랜 세월 파도에 잘게 부서진 조개껍질 가루가 쌓여 만들어진 '패사(貝砂)' 해변이지요. 우리 해녀들은 산소통 하나 없이 오직 이 '테왁'이라는 둥근 부표 하나에 몸을 의지하고, 10m 깊은 바다 밑바닥까지 내려가 전복과 뿔소라를 채취한답니다.

물 위로 솟구쳐 오를 때 터져 나오는 '호오이-' 맑은 숨비소리는 저승에서 벌어 이승의 가족을 지켜낸 제주 어머니들의 숭고한 생명 숨소리입니다. 에메랄드빛 바다와 함께 살아 숨 쉬는 해녀들의 숨결이 느껴지시나요?`,

  GC00700266: `반갑습니다. 탐라의 유구한 역사를 지켜온 제주의 수호신, 돌하르방입니다.

이곳 제주목관아는 조선시대 제주를 다스리던 목사가 정사를 집행하던 행정의 중심지이자, 우리 돌하르방들이 제주 읍성의 사대문을 굳건히 지키던 유서 깊은 터전입니다. '활을 쏘며 덕을 닦는다'는 뜻을 지닌 보물 제322호 관덕정은 1448년 조선 세종 때 안무사 신숙청이 군사들을 훈련하고 백성들의 상무정신을 기르기 위해 창건한 건물로, 제주에 남아있는 가장 오래된 대표 목조 건축물입니다. 부리부리한 눈과 듬직한 손을 지닌 48기의 돌하르방은 왜구의 침략과 역병, 액운을 막아내며 온 고을의 안녕을 지켜온 파수꾼이었습니다.

수백 년의 세월 동안 숱한 왜변과 격동의 역사를 묵묵히 견뎌낸 이 듬직한 관덕정 처마 아래서, 이 땅을 지켜온 선조들의 결연한 호국 기상이 느껴지십니까?`
};

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('Gemini client init fallback:', err);
      }
    }
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Generates or streams the RAG-grounded 3-act deep story in natural standard Korean.
   */
  public async generateSnackStory(
    poi: POI,
    character: Character,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; ttftMs: number; totalLatencyMs: number; references?: string[] }> {
    const startTime = performance.now();
    let ttftMs = 0;

    const ragContext = RAGService.getRAGContext(poi, character);
    const fallbackText = RAG_FALLBACK_STORIES[poi.id] || 
      `${character.greeting} 이곳 ${poi.name}은 ${poi.mythAndFact.summary} ${poi.mythAndFact.details} 저 ${character.name}이 들려주는 이야기와 함께 뜻깊은 제주 여행이 되시길 바랍니다.`;

    if (!this.client || !this.apiKey) {
      // Simulate rich streaming in demo mode
      await new Promise((r) => setTimeout(r, 60));
      ttftMs = Math.round(performance.now() - startTime);

      if (onChunk) {
        const words = fallbackText.split(' ');
        let accumulated = '';
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          accumulated += chunk;
          onChunk(chunk);
          await new Promise((r) => setTimeout(r, 18));
        }
      }

      return {
        text: fallbackText,
        ttftMs,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    }

    try {
      const prompt = RAGService.buildDeepStoryPrompt(poi, character);

      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.7,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (!ttftMs) {
          ttftMs = Math.round(performance.now() - startTime);
        }
        const text = chunk.text || '';
        fullText += text;
        if (onChunk) {
          onChunk(text);
        }
      }

      return {
        text: fullText || fallbackText,
        ttftMs: ttftMs || 250,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    } catch (err) {
      console.warn('Gemini API stream error, using RAG fallback:', err);
      if (onChunk) onChunk(fallbackText);
      return {
        text: fallbackText,
        ttftMs: 120,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    }
  }

  /**
   * Real-time Interactive Q&A (Tiki-taka) in natural standard Korean.
   */
  public async sendChatMessage(
    poi: POI,
    character: Character,
    userMessage: string,
    history: { sender: 'user' | 'model'; text: string }[],
    onChunk?: (text: string) => void
  ): Promise<{ text: string; ttftMs: number; totalLatencyMs: number }> {
    const startTime = performance.now();
    let ttftMs = 0;

    const ragContext = RAGService.getRAGContext(poi, character);

    if (!this.client || !this.apiKey) {
      // Natural standard Korean simulation responses
      await new Promise((r) => setTimeout(r, 120));
      ttftMs = Math.round(performance.now() - startTime);

      let mockReply = '';
      if (character.id === 'seolmundae') {
        mockReply = `거칠기는요! 제 손바닥이 바위보다 단단해서 우도 정도면 아주 부드러운 비단 빨래판이었답니다. 제 거대한 치마폭을 싹싹 문질러 헹구면 바닷물이 하얗게 포말을 일으키며 파도가 일었지요. 아흔아홉 개 바위 봉우리에 빨래를 널어두면 제주 바람과 따스한 햇살이 바짝 말려주었답니다. 여행자님도 여기서 바다를 내려다보면 제 오랜 손길이 느껴지지 않으신가요?`;
      } else if (character.id === 'haenyeo') {
        mockReply = `숨비소리는 물속에서 2분 넘게 턱 끝까지 차오른 숨을 밖으로 토해낼 때 '호오이-' 하고 내쉬는 맑은 생명의 소리입니다. 산소통 없이 맨몸으로 깊은 바다 밑바닥까지 내려갔다 솟구쳐 오르면 비로소 살아있음을 온몸으로 느끼지요. 오늘 저녁에는 바다 향기가 가득한 싱싱한 뿔소라 한 접시 꼭 맛보고 가세요!`;
      } else {
        mockReply = `탐라의 읍성을 묵묵히 지켜온 우리 돌하르방의 부리부리한 눈은 언제나 왜구와 액운을 경계하고 있었습니다. 조선시대 성문 앞을 지키며 백성들의 안녕과 평화를 수호하던 굳건한 파수꾼의 기상이 오늘날까지 이 땅의 역사 속에 살아 숨 쉬고 있는 것이랍니다.`;
      }

      if (onChunk) {
        const words = mockReply.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          onChunk(chunk);
          await new Promise((r) => setTimeout(r, 18));
        }
      }

      return {
        text: mockReply,
        ttftMs,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }

    try {
      const contents = history.slice(-4).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{
          text: `[현재 장소]: ${poi.name}
${ragContext.groundedPromptContext}
[관광객의 질문]: "${userMessage}"
위 질문에 대해 당신(${character.name})의 1인칭 페르소나와 품격을 지키며, 어색한 사투리 조합을 일체 배제하고 100% 유려하고 자연스러운 표준어 구술체로 200~350자 내외로 답변해 주세요.`
        }]
      });

      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents,
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.7,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (!ttftMs) {
          ttftMs = Math.round(performance.now() - startTime);
        }
        const text = chunk.text || '';
        fullText += text;
        if (onChunk) {
          onChunk(text);
        }
      }

      return {
        text: fullText,
        ttftMs: ttftMs || 300,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    } catch (err) {
      console.warn('Gemini chat error, using fallback:', err);
      const fallback = `좋은 질문이십니다. 이곳 ${poi.name}에는 아직도 전해 내려오는 깊은 역사와 설화가 아주 많답니다. 또 어떤 점이 궁금하신가요?`;
      if (onChunk) onChunk(fallback);
      return {
        text: fallback,
        ttftMs: 150,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }
  }
}

export const geminiService = new GeminiService();
