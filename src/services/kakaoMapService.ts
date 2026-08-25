/**
 * Kakao Maps Javascript SDK Loader & Key Management Service
 */

const STORAGE_KEY = 'DOCENT_KAKAO_MAP_API_KEY';

export class KakaoMapService {
  private static instance: KakaoMapService;
  private currentKey: string = '';
  private isLoaded: boolean = false;
  private loadPromise: Promise<any> | null = null;

  private constructor() {
    this.currentKey = this.resolveInitialKey();
  }

  public static getInstance(): KakaoMapService {
    if (!KakaoMapService.instance) {
      KakaoMapService.instance = new KakaoMapService();
    }
    return KakaoMapService.instance;
  }

  private resolveInitialKey(): string {
    const envKey =
      (import.meta.env.VITE_KAKAO_MAP_API_KEY as string | undefined) ||
      (import.meta.env.VITE_KAKAO_JS_KEY as string | undefined) ||
      '';

    if (envKey && envKey !== 'your_kakao_map_api_key_here') {
      return envKey.trim();
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored.trim();
    }

    return '';
  }

  public getAppKey(): string {
    return this.currentKey;
  }

  public setAppKey(key: string): void {
    const cleanKey = key.trim();
    this.currentKey = cleanKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, cleanKey);
    }
    // Reset loaded state to reload with new key
    this.isLoaded = false;
    this.loadPromise = null;
  }

  public hasAppKey(): boolean {
    return Boolean(this.currentKey && this.currentKey.length > 5);
  }

  /**
   * Dynamically loads Kakao Maps SDK
   */
  public loadSDK(keyOverride?: string): Promise<any> {
    const keyToUse = (keyOverride || this.currentKey).trim();

    if (!keyToUse) {
      return Promise.reject(new Error('카카오 지도 Javascript API 키가 등록되지 않았습니다.'));
    }

    if (this.isLoaded && window.kakao && window.kakao.maps) {
      return Promise.resolve(window.kakao);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // If window.kakao.maps is already initialized
      if (window.kakao && window.kakao.maps) {
        if (window.kakao.maps.load) {
          window.kakao.maps.load(() => {
            this.isLoaded = true;
            resolve(window.kakao);
          });
        } else {
          this.isLoaded = true;
          resolve(window.kakao);
        }
        return;
      }

      // Remove existing SDK script tag if any
      const existing = document.getElementById('kakao-maps-sdk');
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.id = 'kakao-maps-sdk';
      script.type = 'text/javascript';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${keyToUse}&autoload=false&libraries=services`;
      script.async = true;

      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            this.isLoaded = true;
            resolve(window.kakao);
          });
        } else {
          this.loadPromise = null;
          reject(new Error('카카오 지도 SDK 객체를 초기화할 수 없습니다.'));
        }
      };

      script.onerror = () => {
        this.loadPromise = null;
        reject(
          new Error(
            '카카오 지도 스크립트 로드에 실패했습니다. (1) Kakao Developers 콘솔의 [플랫폼] > [Web]에 "http://localhost:5173" 도메인이 등록되어 있는지, (2) REST API 키가 아닌 "JavaScript 키"를 입력하셨는지 확인해 주세요.'
          )
        );
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Searches for addresses or keywords using Kakao Maps services (Geocoder + Places)
   */
  public async searchAddressOrKeyword(query: string): Promise<Array<{ title: string; address: string; lat: number; lng: number }>> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    // Ensure SDK is loaded
    await this.loadSDK();

    if (!window.kakao?.maps?.services) {
      throw new Error('카카오 지도 Services 라이브러리가 로드되지 않았습니다.');
    }

    const results: Array<{ title: string; address: string; lat: number; lng: number }> = [];

    // 1. Keyword search (Places)
    const placesPromise = new Promise<void>((resolve) => {
      try {
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(cleanQuery, (data: any[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && Array.isArray(data)) {
            data.slice(0, 5).forEach((item) => {
              results.push({
                title: item.place_name,
                address: item.road_address_name || item.address_name,
                lat: parseFloat(item.y),
                lng: parseFloat(item.x)
              });
            });
          }
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });

    // 2. Geocoder address search
    const geocoderPromise = new Promise<void>((resolve) => {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(cleanQuery, (data: any[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && Array.isArray(data)) {
            data.slice(0, 5).forEach((item) => {
              const alreadyExists = results.some((r) => Math.abs(r.lat - parseFloat(item.y)) < 0.0001 && Math.abs(r.lng - parseFloat(item.x)) < 0.0001);
              if (!alreadyExists) {
                results.push({
                  title: item.address_name,
                  address: item.road_address?.address_name || item.address_name,
                  lat: parseFloat(item.y),
                  lng: parseFloat(item.x)
                });
              }
            });
          }
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });

    await Promise.all([placesPromise, geocoderPromise]);
    return results;
  }
}

export const kakaoMapService = KakaoMapService.getInstance();
