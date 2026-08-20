import { GoogleGenAI } from '@google/genai';
import { POI, Character } from '../types/docent';
import { RAGService } from './ragService';

// RAG-Enhanced High-Fidelity 3-Act Narratives (550~750 chars) for instant Deep Storytelling
const RAG_FALLBACK_STORIES: Record<string, string> = {
  GC04600071: `혼저옵서! 푸른 바다 위에 우뚝 솟은 이 웅장한 분화구가 한눈에 내려다보이지 않으냐?

내가 아득한 태초에 치마폭에 흙을 담아 나르며 요 어여쁜 제주 섬과 삼백예순 오름들을 빚어낼 때 말이다, 유독 반듯하고 거대하게 솟아오른 이 성산일출봉을 내 가장 요긴한 빨래바구니로 삼았단다! 저기 바다 건너 둥둥 떠 있는 우도는 내 널찍한 빨래판이었고, 분화구 둘레를 성곽처럼 에워싼 아흔아홉 개의 날카로운 바위 봉우리는 빨래를 널어 말리던 옷걸이였지. 원래 백 번째 봉우리까지 있었으면 대륙으로 뻗칠 명산이 되었을 텐데, 딱 하나가 모자라 제주의 바다를 지키는 파수꾼으로 남았다는 옛말이 전해진단다.

사실 5천 년 전 뜨거운 마그마가 차가운 바닷물과 격렬하게 부딪쳐 뿜어낸 거대한 화산재가 층층이 쌓여 굳어진 수성화산의 걸작이지. 아가야, 저 푸른 바다를 품은 99봉우리 너머로 솟아오르는 장엄한 기운이 네 가슴에도 와닿느냐?`,

  GC04600070: `혼저옵서! 눈앞에 병풍처럼 우뚝 솟아오른 거대한 바위산의 위용이 참 대단하지 않으냐?

옛날 옛적 내가 한라산 꼭대기를 손으로 툭 쥐어뜯어 남쪽 바다로 휙 던졌더니 바로 요 산방산이 되었고, 뜯겨나간 한라산 자리가 움푹 파여 백록담이 되었다는 천지개벽 설화가 전해진단다. 실제로 산방산의 암질과 웅장한 둘레가 백록담 크기와 꼭 닮아 옛 조상들의 놀라운 지혜를 엿볼 수 있지. 저 산 중턱 천연 석굴인 산방굴사 천장에서는 사시사철 맑은 석간수가 똑똑 떨어지는데, 인간 세상의 탐욕에 상처 입고 스스로 바위가 된 수호 여신 '산방덕이'가 흘리는 눈물방울이라는 애틋한 전설이 깃들어 있단다.

약 80만 년 전 끈적끈적한 조면암질 용암이 분화구 없이 솟구쳐 굳어버린 395미터의 거대한 용암돔이지. 비바람에도 끄떡없는 저 듬직한 바위산의 숨결을 느끼니 마음이 편안해지지 않으냐?`,

  GC04600034: `혼저옵서! 바다를 향해 정교하게 깎아지른 저 육각형 돌기둥 병풍들이 참 신비롭지 않으냐?

옛 제주 사람들은 이곳을 '신들이 거대한 먹줄을 튕겨 바다와 육지의 경계를 지어놓은 돌계단'이라 불렀단다. 기와지붕처럼 층층이 겹쳐졌다 하여 '지삿개'라 불렀는데, 바다 용왕님이 하늘의 옥황상제를 알현하러 오르내리던 신성한 계단이라는 설화가 깃들어 있지. 거센 파도가 30미터 높이의 주상절리 절벽에 부딪쳐 하얀 포말을 뿜어낼 때마다 바위 틈새에서 웅장하게 울려 퍼지는 소리는 바다 밑에 잠든 해신의 거친 숨소리로 여겨졌단다.

섭씨 1,100도가 넘는 뜨거운 용암이 차가운 제주 바당으로 흘러들어 급격히 식으며 수축하여 빚어낸 자연의 위대한 조각품이란다. 저 웅장한 바위 절벽과 포효하는 파도를 마주하니 어떤 생각이 드느냐?`,

  GC04600133: `혼저옵서! 기암절벽 사이로 시원하게 쏟아지는 천지연의 물소리가 가슴을 울리지 않으냐?

'하늘과 땅이 만나는 신성한 연못'이라 하여 예부터 밤마다 옥황상제를 모시던 어여쁜 칠선녀들이 오색 구름을 타고 내려와 맑은 물에 멱을 감고 노닐다 하늘로 올라갔다는 낭만적인 전설이 전해진단다. 깊이가 20미터에 이르는 이 신비로운 연못 속에는 밤에만 움직인다는 전설의 영물, 천연기념물 무태장어가 깊은 물속을 지키고 있지.

주변의 울창한 난대림 숲과 기암절벽이 빚어낸 천연의 비경 속에서 옛 선조들은 자연을 경외하며 마음을 씻어냈단다. 시원하게 떨어지는 물줄기를 바라보고 있으니 도심의 번뇌가 싹 씻겨 내려가는 듯하지 않으냐?`,

  GC04600134: `혼저옵서! 수직 절벽에서 쏟아진 거대한 물줄기가 푸른 바다로 곧장 내리꽂히는 장관이 눈에 들어오느냐?

바다로 직접 떨어지는 폭포는 동양에서 오직 이곳 정방폭포뿐이란다! 옛날 진시황의 명을 받고 불로초를 찾아 제주에 온 사신 서복(徐福)이 이 폭포의 기막힌 절경에 매료되어 절벽 암벽에 '서불과차(徐市過此, 서복이 이곳을 지나가다)'라는 글씨를 새겨두고 서쪽으로 돌아갔다 하여 오늘날 '서귀포(西歸浦)'라는 지명이 탄생했단다.

높이 23미터 절벽에서 쏟아지는 폭포수와 드넓은 태평양 바다가 만나는 이 경이로운 광경 앞에서, 수천 년 전 불로장생을 꿈꾸며 바다를 건넜던 옛사람들의 염원이 느껴지지 않으냐?`,

  GC00710008: `혼저옵서! 지하 수십 미터 아래 끝없이 펼쳐진 암흑 속에서 대지의 맥박이 느껴지지 않으냐?

이곳 만장굴은 약 25만 년 전 거문오름에서 터져 나온 뜨거운 용암이 바다를 향해 질주하며 뚫어놓은 총길이 7.4km의 세계 최장급 용암동굴이란다. 옛 어르신들은 땅속 깊은 곳에 거대한 지룡(地龍)이 잠들어 있다고 여겼지. 동굴 안쪽으로 깊숙이 들어가면 천장에서 흘러내린 용암이 굳어 신전의 기둥처럼 우뚝 솟은 7.6미터의 세계 최대 '용암석주'와, 신기하게도 제주도 섬 모양을 쏙 빼닮은 거대한 '용암 거북바위'가 위용을 뽐내고 있단다.

한여름에도 섭씨 12도의 서늘한 기운을 간직한 이 태고의 지하 궁전에 서 있으니, 거대한 화산이 살아 숨 쉬던 태초의 순간이 눈앞에 그려지지 않으냐?`,

  GC00702597: `어이 손님, 혼저옵서게! 눈앞에 에메랄드빛으로 반짝이는 맑은 협재 바당이 참 곱지 마씸?

저기 손에 잡힐 듯 떠 있는 비양도는 천년 전 고려 때 바다 한가운데서 산이 불쑥 솟아올라 만들어졌다는 신비의 섬이우다. 우리 협재 바당의 은빛 백사장은 오랜 세월 파도에 잘게 부서진 조개껍질 가루가 쌓여 만들어진 '패사(貝砂)' 해변이지 마씸. 우리 해녀 삼춘들은 산소통 하나 없이 오직 이 '테왁' 바가지 하나에 몸을 의지하고 10미터 깊은 바다 밑바닥까지 내려가 전복과 뿔소라를 채취한단 게.

물 위로 쑥 솟구쳐 오를 때 터져 나오는 '호오이-' 맑은 숨비소리는 저승에서 벌어 이승의 가족을 먹여 살린 제주 어머니들의 거룩한 생명 숨소리우다. 삼춘들의 거친 손과 에메랄드빛 바당의 숨결이 느껴지우꽈?`,

  GC00700266: `탐라의 유구한 숨결을 지켜온 돌하르방이우다.

이곳 제주목관아는 조선시대 제주를 다스리던 목사가 정사를 집행하던 행정의 심장부이자, 우리 돌하르방들이 제주 읍성의 사대문을 굳건히 지키던 터전이지요. '활을 쏘며 덕을 닦는다'는 뜻을 지닌 보물 제322호 관덕정은 1448년 조선 세종 때 지어진 제주에서 가장 오래된 대표 목조 건축물입니다. 부리부리한 눈과 듬직한 손을 지닌 48기의 돌하르방은 왜구의 침략과 역병, 액운을 막아내던 탐라의 굳건한 수호 파수꾼이었습니다.

수백 년의 세월 동안 숱한 왜변과 격동의 역사를 묵묵히 이겨낸 이 듬직한 관덕정 처마 아래서, 이 땅을 지켜온 선조들의 결연한 호국 기상이 느껴지십니까?`
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
   * Generates or streams the RAG-grounded 3-act deep story for the given POI and Character.
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
      `${character.greeting} 이곳 ${poi.name}은 ${poi.mythAndFact.summary} ${poi.mythAndFact.details} 나 ${character.name}이 들려주는 이야기와 함께 깊이 있는 제주 여행이 되길 바라오!`;

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
          temperature: 0.75,
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
   * Real-time Interactive Q&A (Tiki-taka) with RAG Grounding.
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
      // Deep dynamic simulation responses based on character and question
      await new Promise((r) => setTimeout(r, 120));
      ttftMs = Math.round(performance.now() - startTime);

      let mockReply = '';
      if (character.id === 'seolmundae') {
        mockReply = `거칠긴! 내 손바닥이 바위보다 단단한데 우도 정도면 아주 보들보들한 비단 빨래판이지! 내 거대한 치마폭을 싹싹 문질러 헹구면 바닷물이 하얗게 포말을 일으키며 파도가 쳤단다. 아흔아홉 개 바위 봉우리에 빨래를 널어두면 제주 바람이 햇살과 함께 바짝 말려주었지. 너도 여기서 바다를 내려다보면 내 옛 손길이 느껴지지 않으냐?`;
      } else if (character.id === 'haenyeo') {
        mockReply = `아이고 손님! 숨비소리는 물속에서 2분 넘게 턱 끝까지 차오른 숨을 밖으로 토해낼 때 '호오이-' 하고 내는 생명의 소리우다! 산소통 없이 맨몸으로 깊은 바당 밑바닥까지 내려갔다 솟구치면 비로소 살아있음을 느끼지 마씸. 오늘 저녁엔 바다의 향기가 가득한 싱싱한 뿔소라 한 접시 꼭 맛보고 가시게!`;
      } else {
        mockReply = `탐라의 읍성을 묵묵히 지켜온 우리 돌하르방의 부리부리한 눈은 언제나 왜적과 잡귀를 경계하고 있었지요. 조선시대 성문 앞을 지키며 백성들의 안녕과 평화를 수호하던 굳건한 파수꾼의 기상이 오늘날까지 이 땅을 지탱하고 있는 것이랍니다.`;
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

      const dialectContext = RAGService.getDialectPromptContext(character.id);

      contents.push({
        role: 'user',
        parts: [{
          text: `[현재 장소]: ${poi.name}
${ragContext.groundedPromptContext}
${dialectContext}
[관광객의 질문]: "${userMessage}"
위 질문에 대해 당신(${character.name})의 1인칭 페르소나와 제주 방언 어투를 완벽히 유지하며, RAG 학술 팩트에 근거하여 200~350자 내외로 깊이 있고 유쾌하게 답변해 주세요.`
        }]
      });

      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents,
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.75,
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
      const fallback = `하하! 좋은 질문이로구나. 이곳 ${poi.name}에는 아직도 전해 내려오는 학술적 비밀과 설화가 아주 많단다. 또 무엇이 궁금하냐?`;
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
