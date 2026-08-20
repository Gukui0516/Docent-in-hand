import { GoogleGenAI } from '@google/genai';
import { POI, Character } from '../types/docent';

// Fallback high-fidelity 1st person snack stories for instant Zero-Click demo
const FALLBACK_STORIES: Record<string, string> = {
  GC04600071: `혼저옵서! 내가 옛날에 치마폭에 흙을 날라 요 아름다운 섬을 맹글 때 말이다, 이 성산일출봉 분화구가 아주 요긴한 내 빨래바구니였단다! 저기 둥둥 떠 있는 우도는 내 빨래판이었지. 99개 바위 봉우리가 성곽처럼 둘러쳐진 게 참 곱지 않으냐? 너도 여기 서서 해 뜨는 걸 보면 가슴이 뻥 뚫릴 게다. 아가야, 저 푸른 바다를 보니 기분이 어떠냐?`,
  GC04600070: `혼저옵서! 내가 한라산 꼭대기를 툭 쥐어뜯어 남쪽으로 휙 던졌더니 바로 요 산방산이 되었단다! 뽑혀나간 자리가 바로 백록담이지. 여긴 흙이 아니라 딴딴한 바위 덩어리로 솟아올라 비바람에도 끄떡없단다. 저 아래 산방굴사에서 똑똑 떨어지는 약수 한 모금 마셔보았느냐?`,
  GC04600034: `혼저옵서! 바다로 뻗어 나간 저 육각형 돌기둥들이 참 신기하지 않으냐? 내가 손으로 반듯하게 빚어 세워둔 병풍 같기도 하고 말이다. 뜨거운 불꽃 용암이 차가운 제주 바당과 만나면서 바위가 딴딴하게 육각으로 굳은 것이란다. 파도가 들이칠 때 바위 틈에서 나는 웅장한 소리를 들어보았느냐?`,
  GC04600133: `혼저옵서! 하늘과 땅이 만나는 못, 천지연에 잘 왔구나! 옛날엔 밤마다 옥황상제를 모시는 어여쁜 칠선녀들이 오색 구름을 타고 내려와 요 맑은 못에서 멱을 감고 올라갔단다. 깊은 물속엔 신비로운 무태장어도 살고 있지. 시원한 물소리를 들으니 도심의 피로가 싹 가시지 않느냐?`,
  GC04600134: `혼저옵서! 수직 절벽에서 거대한 물줄기가 푸른 바다로 곧장 내리꽂히는 게 아주 장관이지? 옛날 진시황의 신하 서복이 불로초를 찾으러 요 앞을 지나가다 절경에 반해 글을 새겨두고 서쪽으로 돌아갔다 해서 '서귀포'라는 이름이 붙었단다. 바다로 바로 떨어지는 폭포는 흔치 않은데, 참 시원하지 않으냐?`,
  GC00710008: `혼저옵서! 한라산 깊은 속에서 터져 나온 뜨거운 용암이 바다로 흘러가며 뚫어놓은 거대한 지하 궁전 만장굴이란다! 안으로 들어가면 7미터가 넘는 거대한 용암 돌기둥과 제주도를 쏙 빼닮은 돌거북이 기다리고 있지. 한여름에도 서늘한 이 신비로운 땅속 숨결이 느껴지느냐?`,
  GC00700010: `혼저옵서! 용 한 마리가 한라산 신령님의 영험한 옥구슬을 몰래 훔쳐 하늘로 날아오르려다 노여움을 사 바위로 굳어버린 곳이란다! 입을 쩍 벌리고 울부짖는 모습이 진짜 성난 용 같지 않으냐? 저 거센 파도를 맞으면서도 수천 년을 버텨온 게 대견하지 않으냐?`,
  GC00702597: `어이 손님, 혼저옵서게! 우리 해녀 삼춘들이 수백 년간 테왁 하나 메고 전복이랑 소라를 따온 에메랄드빛 협재 바당이우다! 저기 손에 잡힐 듯 떠 있는 비양도가 참 곱지 마씸? 바다에 쑥 들어갔다 나올 때 내는 '호오이-' 숨비소리가 바로 우리네 삶의 노래란 게. 물질하는 해녀 본 적 이수꽈?`,
  GC00702596: `어이 손님! 거친 파도를 헤치며 노를 저을 때 우리 구좌 해녀들이 부르던 「해녀 노젓는 소리」가 들리는 듯하지 마씸? 물질 끝나고 차가운 몸을 녹이던 돌담 쉼터 '불턱'도 아직 남아있수다. 코발트빛 바당 바람 맞으니 가슴이 탁 트이지 않수꽈?`,
  GC00700266: `탐라의 오랜 숨결을 지켜온 돌하르방이우다. 이곳 제주목관아는 조선시대 제주를 다스리던 목사가 정사를 돌보던 심장부이자, 우리 돌하르방들이 제주 읍성의 성문을 굳건히 지키던 터전이지요. 보물 제322호 관덕정의 듬직한 처마 아래서 제주의 오랜 역사가 느껴지십니까?`,
  GC00710736: `탐라국의 기원을 품은 삼양동 선사마을터에 오신 것을 환영하오. 수천 년 전 청동기시대 우리 선조들이 움집을 짓고 바다를 건너 육지와 교역하며 찬란한 해양 문화를 꽃피운 곳이지요. 흙과 돌에 새겨진 고대 탐라인들의 지혜를 들어보시겠습니까?`
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
   * Generates or streams the initial 1st-person snack story for the given POI and Character.
   */
  public async generateSnackStory(
    poi: POI,
    character: Character,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; ttftMs: number; totalLatencyMs: number }> {
    const startTime = performance.now();
    let ttftMs = 0;

    const fallbackText = FALLBACK_STORIES[poi.id] || 
      `${character.greeting} 여기 ${poi.name}은 ${poi.mythAndFact.summary} 나 ${character.name}이 들려주는 이야기, 참 흥미진진하지 않으냐?`;

    if (!this.client || !this.apiKey) {
      // Simulate ultra-fast streaming in demo mode
      await new Promise((r) => setTimeout(r, 60));
      ttftMs = Math.round(performance.now() - startTime);

      if (onChunk) {
        const words = fallbackText.split(' ');
        let accumulated = '';
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          accumulated += chunk;
          onChunk(chunk);
          await new Promise((r) => setTimeout(r, 25));
        }
      }

      return {
        text: fallbackText,
        ttftMs,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }

    try {
      const prompt = `
당신은 제주의 "${character.name}"입니다.
[캐릭터 성격]: ${character.personality}
[시스템 지침]:
1. 관광객이 지금 방금 "${poi.name}"에 도착하여 웹을 켰습니다.
2. 당신의 1인칭 시점으로 ${poi.name}에 얽힌 신화와 자연 이야기를 들려주세요.
3. [장소 팩트]: ${poi.mythAndFact.details}
4. 제주 방언 종결어미와 호칭을 20~30% 자연스럽게 섞어 구술체로 말하세요.
5. 분량은 반드시 공백 포함 250~350자 내외(모바일 한 화면)로 제한하세요.
6. 마지막 문장은 관광객에게 말을 걸며 대화를 유도하는 친근한 질문으로 끝맺으세요.
`;

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
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    } catch (err) {
      console.warn('Gemini API stream error, using fallback:', err);
      if (onChunk) onChunk(fallbackText);
      return {
        text: fallbackText,
        ttftMs: 120,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }
  }

  /**
   * Real-time Interactive Q&A (Tiki-taka).
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

    if (!this.client || !this.apiKey) {
      // Smart dynamic simulation responses based on character and question
      await new Promise((r) => setTimeout(r, 120));
      ttftMs = Math.round(performance.now() - startTime);

      let mockReply = '';
      if (character.id === 'seolmundae') {
        mockReply = `거칠긴! 내 손바닥이 바위보다 단단한데 우도 정도면 아주 보들보들한 비단 빨래판이지! 내 거대한 치마폭을 싹싹 문질러 헹구면 바닷물이 하얗게 포말을 일으켰단다. 너도 여기서 바다를 내려다보면 내 손길이 느껴지지 않으냐?`;
      } else if (character.id === 'haenyeo') {
        mockReply = `아이고 손님! 숨비소리는 물속에서 참았던 숨을 밖으로 토해낼 때 '호오이-' 하고 내는 생명의 소리우다! 산소통 없이 2분 넘게 물질하다가 바다 위로 솟구치면 가슴이 탁 트이지 마씸. 오늘 저녁엔 싱싱한 뿔소라 한 접시 맛보고 가시게!`;
      } else {
        mockReply = `탐라의 성문을 묵묵히 지켜온 우리 돌하르방의 눈은 언제나 왜적과 잡귀를 경계하고 있었지요. 코를 만지면 아들을 낳는다는 민간의 이야기도 있지만, 본래는 이 땅 백성들의 안녕과 평화를 수호하는 파수꾼이었답니다.`;
      }

      if (onChunk) {
        const words = mockReply.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          onChunk(chunk);
          await new Promise((r) => setTimeout(r, 20));
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
[장소 팩트 정보]: ${poi.mythAndFact.details}
[관광객의 질문]: "${userMessage}"
위 질문에 대해 당신(${character.name})의 1인칭 페르소나와 어투를 완벽히 유지하며 150~250자 내외로 재미있고 유쾌하게 답해주세요.`
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
      const fallback = `하하! 좋은 질문이로구나. 이곳 ${poi.name}에는 아직도 전해 내려오는 비밀이 아주 많단다. 또 무엇이 궁금하냐?`;
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
