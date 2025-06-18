# 개인 맞춤 학습 가이드 (Personal Study Guide)

## 프레젠테이션
https://docs.google.com/presentation/d/1-v4TSBe-17-E-EUl3VJRe3FrYnQhPE8sjguSffHHh50/edit?usp=sharing

## 프로젝트 소개
개인 맞춤 학습 가이드는 사용자의 학습 성향을 분석하고, 학습 세션을 관리하여 최적화된 학습 방법을 제안하는 모바일 애플리케이션입니다. 성격 유형 검사를 통해 사용자의 학습 스타일을 파악하고, 이에 맞는 맞춤형 학습 전략을 제공하며, 실제 학습 데이터를 기반으로 개인화된 피드백을 제공합니다.

## 주요 기능

### 1. 학습 성향 검사
- 과학적으로 검증된 성격 유형 검사 제공 (Big Five 성격 유형 검사, OCEAN 모델 기반)
- 5가지 주요 성향 분석 (외향성, 개방성, 성실성, 친화성, 정서 안정성)
- 실시간 검사 진행률 표시

### 2. 학습 세션 관리 (타이머)
- 스톱워치 기반의 공부 및 휴식 시간 측정
- 개별 공부 및 휴식 세그먼트 기록
- 세션 종료 시 총 공부/휴식 시간 및 공부/휴식 횟수 통계 제공
- 학습 세션 집중도 점수 기록
- AI 기반 학습 패턴 분석 및 맞춤 피드백 제공 (최적 학습 시간대, 추천 학습/휴식 시간, 강점/개선 영역 등)

### 3. 맞춤형 결과 분석
- 상세한 성향 분석 결과 제공
- 각 성향별 점수 표시
- 개인화된 학습 전략 추천
- 결과 공유 기능 (웹/모바일 환경 지원)

### 4. 기록 관리
- 과거 검사 결과 및 학습 세션 기록 열람
- 시간순 정렬된 기록 목록

### 5. 계정 관리
- Firebase 기반 사용자 인증
- 자동 로그인 지원

## 기술 스택

- **프론트엔드**: React Native, TypeScript, Expo
  - **React Native**: iOS 및 Android에서 실행되는 크로스 플랫폼 모바일 애플리케이션 개발에 사용됩니다. 학습 성향 검사, 타이머, 학습 세션 관리, 기록 열람 등의 사용자 인터페이스(UI)를 구성합니다.
  - **TypeScript**: JavaScript에 타입 안전성을 제공하여 코드의 안정성과 가독성을 높입니다. 특히 복잡한 데이터 구조와 비즈니스 로직을 명확하게 정의하는 데 활용됩니다.
  - **Expo**: React Native 애플리케이션의 개발 및 빌드를 간소화하는 프레임워크입니다. 개발 환경 설정, 앱 빌드 및 배포 과정을 효율적으로 지원합니다.

- **백엔드 (ML 서버)**: Python, Flask, Scikit-learn, NumPy
  - **Python / Flask**: AI/ML 관련 기능을 담당하는 백엔드 서버를 구축하는 데 사용됩니다. 클라이언트로부터 학습 데이터를 받아 분석하고, 최적의 학습/휴식 시간 예측 및 맞춤형 피드백을 제공하는 API 엔드포인트를 처리합니다.
  - **Scikit-learn**: 머신러닝 모델(예: 선형 회귀)을 구현하여 사용자의 과거 학습 데이터를 기반으로 최적의 학습 시간과 휴식 시간을 예측하는 데 활용됩니다.
  - **NumPy**: Scikit-learn과 함께 머신러닝 모델의 데이터 전처리 및 수치 계산에 필요한 배열 연산을 효율적으로 수행합니다.

- **데이터베이스**: Firebase (Authentication, Firestore)
  - **Firebase Authentication**: 사용자 계정 생성, 로그인, 자동 로그인 및 세션 관리 등 사용자 인증을 담당합니다.
  - **Firestore**: NoSQL 클라우드 데이터베이스로, 사용자의 학습 성향 검사 결과, 학습 세션 기록 등 모든 애플리케이션 데이터를 실시간으로 안전하게 저장하고 관리합니다.

## 개발 기간
2025.05.22 ~ 2025.06.10

## 개발 환경
- **Node.js**: v18.x.x (Expo 요구사항)
- **Python**: 3.x.x (Flask, Scikit-learn, NumPy)
- **Expo CLI**: 53.x.x
- **npm**: 10.x.x

## 프로젝트 아키텍처

이 프로젝트는 사용자 중심의 학습 경험을 제공하기 위해 **모바일 앱(클라이언트)**, **Firebase(데이터베이스)**, 그리고 **ML 서버(백엔드)**의 세 가지 핵심 구성 요소로 이루어져 있습니다.

<img width="383" alt="Image" src="https://github.com/user-attachments/assets/7481d06e-e5ff-4ff4-bd4d-71f693099dc4" />

## 프로젝트 프로그램 설치방법

### 1. 저장소 클론
```bash
git clone https://github.com/rivermin01/personal_study_guide.git
cd personal_study_guide
```

### 2. 프론트엔드 (React Native/Expo) 의존성 설치
```bash
npm install
# 또는 yarn install
```

### 3. 백엔드 (Python/Flask) 의존성 설치
```bash
pip install -r src/server/requirements.txt
```

### 4. Firebase 프로젝트 설정
- 프로젝트 루트 디렉토리에 있는 `env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
- Firebase 콘솔에서 새 프로젝트를 생성합니다.
- `프로젝트 설정 > 일반`에서 웹 앱을 추가하고 제공된 구성 정보(API 키, 도메인, 프로젝트 ID 등)를 `.env` 파일에 `FIREBASE_API_KEY=YOUR_API_KEY`와 같은 형식으로 입력합니다.
- Firestore 데이터베이스를 생성하고, 필요한 경우 `firestore.rules` 파일을 기반으로 보안 규칙을 설정합니다.

## 프로젝트 프로그램 사용법

### 1. 백엔드 (ML 서버) 실행
별도의 터미널에서 프로젝트 루트 디렉토리로 이동하여 다음 명령어를 실행합니다.
```bash
python src/server/app.py
```
서버가 `http://127.0.0.1:5001`에서 실행되는 것을 확인합니다.

### 2. 프론트엔드 (React Native 웹 앱) 실행
다른 터미널에서 프로젝트 루트 디렉토리로 이동하여 다음 명령어를 실행합니다.
```bash
npm start
# 또는 expo start
```
브라우저에서 애플리케이션이 열립니다. (`http://localhost:8081`)

### 3. 애플리케이션 사용
- **회원가입/로그인**: 앱 실행 후 계정을 생성하거나 로그인합니다.
- **학습 성향 검사**: '검사' 탭에서 성향 검사를 진행하고 결과를 확인합니다.
- **학습 세션 관리**: '타이머' 탭에서 공부/휴식 타이머를 시작하고 종료하여 학습 세션을 기록합니다.
- **기록 확인**: '기록' 탭에서 과거의 검사 결과 및 학습 세션 기록을 열람합니다.
- **로그아웃**: 로그인된 상태에서 언제든지 로그아웃할 수 있습니다.

## 앱 UI


### 로그인 탭
- 로그인 화면
<img width="492" alt="Image" src="https://github.com/user-attachments/assets/3ab7c3c4-3c99-43bb-bc22-702e8f593cdc" />

- 회원가입 화면
<img width="499" alt="Image" src="https://github.com/user-attachments/assets/d75599a9-8559-45a8-9019-a8c94f9ae353" />

### 홈 탭
- 기본 홈 화면
<img width="498" alt="Image" src="https://github.com/user-attachments/assets/2aca3373-f8da-4d00-92b4-e50eefd6818a" />

- 검사 중 화면
<img width="496" alt="Image" src="https://github.com/user-attachments/assets/f8ff8a2c-98bf-407d-ac21-3c809f78975a" />

- 검사 결과 화면
<img width="492" alt="Image" src="https://github.com/user-attachments/assets/3df37144-77e6-443e-94cb-5342f9e7c81e" />

### 타이머 탭
- 타이머 화면
<img width="496" alt="Image" src="https://github.com/user-attachments/assets/b125450f-7920-425a-91c7-e66b1eae2379" />

- 타이머 시작시 (공부중)
<img width="497" alt="Image" src="https://github.com/user-attachments/assets/a4446b79-61db-4128-8df9-59f85d93ac3d" />

- 타이머 일시 정지시 (휴식중)
<img width="500" alt="Image" src="https://github.com/user-attachments/assets/fcfe3799-3dc3-4a44-900c-6fa41dc120d1" />

- 타이머 종료시 (이번 공부 세션 평가)
<img width="497" alt="Image" src="https://github.com/user-attachments/assets/996337f8-fbab-4840-bc51-81055fb0d012" />

- 공부 결과 화면
<img width="498" alt="Image" src="https://github.com/user-attachments/assets/6c798935-3665-4067-baa3-15dc82f3e04a" />

### 기록 탭
- 검사 기록 화면
<img width="500" alt="Image" src="https://github.com/user-attachments/assets/f3402ee0-10f2-4249-8597-01be7a1ce6a4" />

- 타이머 기록 화면
<img width="497" alt="Image" src="https://github.com/user-attachments/assets/74fc7df6-4bfb-4c68-a169-811a7d4fcbaa" />

### 설정 탭
- 설정 화면
<img width="499" alt="Image" src="https://github.com/user-attachments/assets/b997e2bc-6cf2-496a-8463-5a9efb68ef8f" />







