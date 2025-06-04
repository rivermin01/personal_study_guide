import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// 환경 변수 로드 확인
console.log('Firebase Config Check:', {
  apiKey: FIREBASE_API_KEY ? '설정됨' : '미설정',
  authDomain: FIREBASE_AUTH_DOMAIN ? '설정됨' : '미설정',
  projectId: FIREBASE_PROJECT_ID ? '설정됨' : '미설정',
  storageBucket: FIREBASE_STORAGE_BUCKET ? '설정됨' : '미설정',
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID ? '설정됨' : '미설정',
  appId: FIREBASE_APP_ID ? '설정됨' : '미설정',
});

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase 설정
auth.useDeviceLanguage(); // 디바이스 언어 사용

export { db, auth };
export default app; 