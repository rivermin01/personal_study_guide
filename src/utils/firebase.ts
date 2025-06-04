import { collection, addDoc, doc, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { TestResult } from '../types/result';

// 결과 저장 (사용자 ID 포함)
export const saveTestResult = async (result: Omit<TestResult, 'id'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const resultWithUser = {
      ...result,
      userId,  // 사용자 ID 추가
    };

    const docRef = await addDoc(collection(db, 'testResults'), resultWithUser);
    return docRef.id;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
};

// 특정 결과 조회 (사용자 확인 포함)
export const getTestResult = async (id: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'testResults', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TestResult;
    }
    return null;
  } catch (error) {
    console.error('Error getting test result:', error);
    throw error;
  }
};

// 사용자의 모든 결과 조회 (최신순)
export const getAllTestResults = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'testResults'),
      where('userId', '==', userId),  // 현재 사용자의 결과만 조회
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TestResult[];
  } catch (error) {
    console.error('Error getting all test results:', error);
    throw error;
  }
}; 