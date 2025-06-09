import requests
import json
from datetime import datetime, timedelta
import random

def generate_realistic_session(start_time):
    """현실적인 학습 세션 데이터 생성"""
    hour = start_time.hour
    
    # 시간대별 기본 점수 설정
    if 5 <= hour < 10:  # 아침
        base_score = random.uniform(80, 95)
    elif 10 <= hour < 15:  # 오후
        base_score = random.uniform(70, 85)
    elif 15 <= hour < 20:  # 저녁
        base_score = random.uniform(60, 75)
    else:  # 밤
        base_score = random.uniform(50, 65)
    
    # 요일 효과
    if start_time.weekday() >= 5:  # 주말
        base_score *= 0.9
    
    # 점수에 따른 학습 시간 설정
    score = round(base_score)
    if score >= 80:  # 높은 점수
        duration = random.uniform(40, 50) * 60  # 40-50분
        break_ratio = random.uniform(0.15, 0.20)
    elif score >= 60:  # 중간 점수
        duration = random.uniform(25, 35) * 60  # 25-35분
        break_ratio = random.uniform(0.20, 0.25)
    else:  # 낮은 점수
        duration = random.uniform(15, 25) * 60  # 15-25분
        break_ratio = random.uniform(0.25, 0.30)
    
    break_time = duration * break_ratio
    
    return {
        'hour': hour,
        'duration': duration,
        'breakTime': break_time,
        'score': score,
        'dayOfWeek': start_time.weekday(),
    }

def test_prediction(num_sessions=7):
    """
    학습 시간 예측 테스트
    """
    # 테스트 데이터 생성
    current_time = datetime.now()
    sessions = []
    
    # 최근 일주일간의 데이터 생성
    for i in range(num_sessions):
        # 하루 전씩 이동
        session_time = current_time - timedelta(days=i)
        
        # 하루 중 선호 시간대 (아침/오후/저녁)
        hour = random.choice([8, 13, 18])
        session_time = session_time.replace(hour=hour, minute=0)
        sessions.append(generate_realistic_session(session_time))
    
    # API 요청 데이터 준비
    request_data = {
        'trainingData': sessions,
        'currentHour': current_time.hour,
        'dayOfWeek': current_time.weekday()
    }
    
    try:
        # API 호출
        response = requests.post(
            'http://localhost:5001/predict',
            json=request_data
        )
        
        # 응답 확인
        if response.status_code == 200:
            result = response.json()
            print(f"\n{'='*60}")
            print(f"=== 학습 시간 예측 결과 (데이터 {len(sessions)}개) ===")
            print(f"{'='*60}")
            print(f"추천 학습 시간: {result['duration'] // 60}분")
            print(f"추천 휴식 시간: {result['break_time'] // 60}분")
            print(f"신뢰도: {result['confidence']:.2f}")
            print(f"메시지: {result.get('message', '없음')}")
            print(f"{'='*60}")
            
            # 학습 패턴 분석
            durations = [s['duration'] // 60 for s in sessions]
            scores = [s['score'] for s in sessions]
            break_times = [s['breakTime'] // 60 for s in sessions]
            
            print("\n학습 패턴 분석:")
            print(f"학습 시간 - 최소: {min(durations):.1f}분, 최대: {max(durations):.1f}분, 평균: {sum(durations)/len(durations):.1f}분")
            print(f"휴식 시간 - 최소: {min(break_times):.1f}분, 최대: {max(break_times):.1f}분, 평균: {sum(break_times)/len(break_times):.1f}분")
            print(f"평점 - 최소: {min(scores)}, 최대: {max(scores)}, 평균: {sum(scores)/len(scores):.1f}")
            
            # 시간대별 분포
            morning = len([s for s in sessions if 5 <= s['hour'] < 10])
            afternoon = len([s for s in sessions if 10 <= s['hour'] < 15])
            evening = len([s for s in sessions if 15 <= s['hour'] < 20])
            night = len([s for s in sessions if s['hour'] >= 20 or s['hour'] < 5])
            
            print("\n시간대별 학습 횟수:")
            print(f"아침(05-10시): {morning}회")
            print(f"오후(10-15시): {afternoon}회")
            print(f"저녁(15-20시): {evening}회")
            print(f"밤(20-05시): {night}회")
            print(f"{'='*60}\n")
            
        else:
            print(f"\n{'='*60}")
            print(f"에러 발생: {response.status_code}")
            print(response.text)
            print(f"{'='*60}\n")
            
    except requests.exceptions.ConnectionError:
        print("\n서버 연결 실패. 서버가 실행 중인지 확인해주세요.")
    except Exception as e:
        print(f"\n테스트 중 오류 발생: {str(e)}")

def test_save_session():
    """
    세션 저장 테스트
    """
    test_session = generate_realistic_session(datetime.now())
    
    try:
        response = requests.post(
            'http://localhost:5001/save-session',
            json=test_session
        )
        
        print(f"\n{'='*60}")
        print("=== 세션 저장 테스트 ===")
        print(f"{'='*60}")
        print(f"상태 코드: {response.status_code}")
        print(f"응답: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print(f"{'='*60}\n")
        
    except requests.exceptions.ConnectionError:
        print("\n서버 연결 실패. 서버가 실행 중인지 확인해주세요.")
    except Exception as e:
        print(f"\n테스트 중 오류 발생: {str(e)}")

if __name__ == '__main__':
    print("ML API 테스트를 시작합니다...")
    print("일주일치 데이터로 학습 시간을 예측합니다.")
    print("(시간대와 요일에 따라 학습 효율이 다르게 설정됩니다.)\n")
    
    # 예측 테스트
    test_prediction(num_sessions=7)
    
    # 세션 저장 테스트
    test_save_session() 