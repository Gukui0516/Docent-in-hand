# 📍 GPS 실시간 위치 측정기 (Docent-in-hand)

기기의 GPS 수신기를 사용하여 현재 실시간 위치 좌표(위도, 경도) 및 상세 정보(오차 범위, 고도, 이동 속도 등)를 한눈에 볼 수 있는 모던한 웹 애플리케이션입니다.

![GPS Tracker](https://img.shields.io/badge/Vite-5.3-646CFF?logo=vite&logoColor=white) ![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)

---

## ✨ 주요 기능 (Key Features)

* **📍 단발 위치 측정 (Single Measurement)**: 단 한 번의 클릭으로 신속하게 현재 위도와 경도 수집.
* **🔄 실시간 연속 추적 (Real-Time Live Tracking)**: 브라우저의 `watchPosition` API를 이용하여 이동 중에도 계속해서 위치 좌표를 동적으로 업데이트. (추적 중에는 수려한 그린 펄스 애니메이션 활성화)
* **📊 상세 위치 메타데이터**:
  * **위도 (Latitude) & 경도 (Longitude)**
  * **오차 범위 (Accuracy)**: 현재 측정의 정밀도 제공 (오차 ±N 미터 단위)
  * **고도 (Altitude)**: 디바이스 센서가 허용할 시 해발 고도 미터값 출력
  * **이동 속도 (Speed)**: 이동 중일 경우 실시간 속도 시속(km/h)으로 자동 변환해 출력
  * **마지막 업데이트 시각**: 위치 정보가 마지막으로 갱신된 타임스탬프
* **📋 일괄 좌표 복사**: 위도와 경도 텍스트 정보를 원클릭으로 클립보드에 복사.
* **🗺️ 구글 지도 연동**: 측정된 현재 위치 정보를 클릭 시 새 창에서 Google Maps 위치 핀으로 매핑 및 확인 가능.
* **🎨 모던 UI/UX**: 글래스모피즘(Glassmorphism)과 반응형 다크 슬레이트 테마, 레이더 형태의 수려한 GPS 탐지 로딩 애니메이션 구현.

---

## 🛠️ 개발 및 실행 방법 (Getting Started)

### 사전 요구 사항
- **Node.js** (v18 이상 권장)
- **npm** (v9 이상 권장)

### 1. 패키지 설치
프로젝트 루트 폴더에서 아래 명령어를 실행하여 종속성 패키지를 설치합니다.
```bash
npm install
```

### 2. 로컬 개발 서버 실행
설치가 끝나면 아래 명령어로 개발 서버를 엽니다.
```bash
npm run dev
```
개발 서버가 켜지면 브라우저에서 제공되는 로컬 호스트 링크(기본값: `http://localhost:5173`)로 접속합니다.

### 3. 빌드 (배포용 파일 생성)
```bash
npm run build
```
빌드가 완료되면 `dist` 폴더 안에 최적화된 정적 HTML/CSS/JS 리소스 파일이 생성됩니다.

---

## ⚠️ 위치 수신 주의사항
- 본 웹사이트는 사용자의 위치 정보를 외부 서버로 절대 전송하지 않으며, 전적으로 클라이언트(브라우저) 환경에서만 안전하게 처리합니다.
- 정확한 위치 측정을 위해 기기의 GPS 기능이 켜져 있어야 하며, 브라우저가 위치 권한 요청 시 **"허용(Allow)"**을 선택해 주셔야 합니다.
