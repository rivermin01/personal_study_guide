import { auth, db } from '../config/firebase';
import { collection } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    // Auth 테스트
    const currentUser = auth.currentUser;
    console.log('Auth 초기화 상태:', !!auth);
    console.log('현재 사용자:', currentUser);

    // Firestore 테스트
    const testCollection = collection(db, 'test');
    console.log('Firestore 초기화 상태:', !!db);
    
    return {
      isAuthInitialized: !!auth,
      isFirestoreInitialized: !!db,
      currentUser: currentUser
    };
  } catch (error) {
    console.error('Firebase 연결 테스트 실패:', error);
    throw error;
  }
}; 