from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime

app = Flask(__name__)
CORS(app)

def prepare_features(data):
    """
    시간대와 요일에 따른 가중치를 포함한 특성 추출
    """
    features = []
    for session in data:
        hour = session['hour']
        # 시간대별 선호도 가중치 (0-1 사이 값)
        if 5 <= hour < 10:  # 아침
            time_weight = 1.0
        elif 10 <= hour < 15:  # 오후
            time_weight = 0.8
        elif 15 <= hour < 20:  # 저녁
            time_weight = 0.7
        else:  # 밤
            time_weight = 0.5
            
        # 주말 여부에 따른 가중치
        weekend_weight = 0.8 if session['dayOfWeek'] >= 5 else 1.0
        
        features.append([
            time_weight,
            weekend_weight,
            session['score'] / 100.0  # 평점을 0-1 사이로 정규화
        ])
    
    return np.array(features)

def train_model(X, y):
    """
    선형 회귀 모델 학습 및 신뢰도 계산
    """
    if len(X) < 5:  # 최소 5개의 데이터 필요
        return None, None, 0.0
        
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_scaled, y)
    
    # 예측 및 신뢰도 계산
    y_pred = model.predict(X_scaled)
    
    # 평균 절대 오차 비율 계산 (0으로 나누기 방지)
    non_zero_mask = y != 0
    if np.any(non_zero_mask):
        mape = np.mean(np.abs((y[non_zero_mask] - y_pred[non_zero_mask]) / y[non_zero_mask])) * 100
    else:
        mape = 100  # 모든 값이 0인 경우 최대 오차로 설정
    
    # 데이터 수에 따른 보정
    data_factor = min(1.0, len(X) / 20)  # 20개 이상이면 1.0
    
    # 신뢰도 계산 (MAPE가 20% 이하면 높은 신뢰도)
    base_confidence = max(0, 1 - (mape / 20))
    confidence = base_confidence * data_factor
    
    return model, scaler, confidence

def get_default_times():
    """
    기본 추천 시간 (분 단위)
    """
    return {
        'duration': 25,  # 25분 공부
        'break': 5      # 5분 휴식
    }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        training_data = data.get('trainingData', [])
        current_hour = data['currentHour']

        # 각 세션의 studySegments와 breakSegments에서 총 지속 시간 계산
        processed_training_data = []
        for session in training_data:
            total_study_segment_duration = sum(seg.get('duration', 0) for seg in session.get('studySegments', []))
            total_break_segment_duration = sum(seg.get('duration', 0) for seg in session.get('breakSegments', []))
            processed_training_data.append({
                'hour': session['hour'],
                'dayOfWeek': session['dayOfWeek'],
                'score': session['score'],
                'duration': total_study_segment_duration, # 계산된 총 학습 시간
                'breakTime': total_break_segment_duration,    # 계산된 총 휴식 시간
            })
        
        # 기본값 설정
        defaults = get_default_times()
        
        if len(processed_training_data) < 5:
            return jsonify({
                'duration': defaults['duration'] * 60,
                'break_time': defaults['break'] * 60,
                'confidence': 0.3,  # 기본값 사용 시 낮은 신뢰도
                'message': '데이터가 부족하여 기본 추천값을 사용합니다.'
            })
        
        # 특성 준비
        X = prepare_features(processed_training_data)
        y_duration = np.array([session['duration'] for session in processed_training_data])
        y_break = np.array([session['breakTime'] for session in processed_training_data])
        
        # 모델 학습
        duration_model, duration_scaler, duration_confidence = train_model(X, y_duration)
        break_model, break_scaler, break_confidence = train_model(X, y_break)
        
        # 현재 시간에 대한 특성 준비
        current_time_weight = 1.0 if 5 <= current_hour < 10 else (
            0.8 if 10 <= current_hour < 15 else (
            0.7 if 15 <= current_hour < 20 else 0.5
        ))
        current_weekend_weight = 0.8 if data.get('dayOfWeek', datetime.now().weekday()) >= 5 else 1.0
        
        # 최근 5개 세션의 평균 점수 사용
        recent_scores = [s['score'] for s in processed_training_data[-5:]] # processed_training_data에서 점수 가져옴
        avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 70  # 기본값 70
        
        current_features = np.array([[
            current_time_weight,
            current_weekend_weight,
            avg_score / 100.0
        ]])
        
        if duration_model is not None and break_model is not None:
            # 예측
            predicted_duration = duration_model.predict(duration_scaler.transform(current_features))[0]
            predicted_break = break_model.predict(break_scaler.transform(current_features))[0]
            
            # 기본값과 예측값을 결합 (가중 평균)
            confidence = (duration_confidence + break_confidence) / 2
            
            # 신뢰도가 낮을 때는 기본값에 더 많은 가중치
            ml_weight = confidence
            base_weight = 1 - confidence
            
            final_duration = int(
                ml_weight * predicted_duration + 
                base_weight * (defaults['duration'] * 60)
            )
            final_break = int(
                ml_weight * predicted_break + 
                base_weight * (defaults['break'] * 60)
            )
            
            # 현실적인 범위로 조정
            final_duration = max(min(final_duration, 120 * 60), 15 * 60)  # 15분~120분
            final_break = max(min(final_break, 30 * 60), 3 * 60)  # 3분~30분

            # 기본값 25분 학습 / 5분 휴식 기준으로 +/- 1분(60초) 변동폭 제한
            DEFAULT_STUDY_DURATION_SEC = 25 * 60
            DEFAULT_BREAK_DURATION_SEC = 5 * 60

            final_duration = max(min(final_duration, DEFAULT_STUDY_DURATION_SEC + 60), DEFAULT_STUDY_DURATION_SEC - 60)
            final_break = max(min(final_break, DEFAULT_BREAK_DURATION_SEC + 60), DEFAULT_BREAK_DURATION_SEC - 60)
            
            message = f"ML 모델 신뢰도: {confidence:.2f}, 기본값 가중치: {base_weight:.2f}"
        else:
            final_duration = defaults['duration'] * 60
            final_break = defaults['break'] * 60
            confidence = 0.3
            message = "모델 학습에 실패하여 기본값을 사용합니다."
        
        return jsonify({
            'duration': final_duration,
            'break_time': final_break,
            'confidence': float(confidence),
            'message': message
        })
        
    except Exception as e:
        return jsonify({
            'duration': get_default_times()['duration'] * 60,
            'break_time': get_default_times()['break'] * 60,
            'confidence': 0.0,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/save-session', methods=['POST'])
def save_session():
    try:
        data = request.get_json()
        required_fields = ['duration', 'breakTime', 'score']
        
        # 필수 필드 확인
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400
        
        # 점수 범위 확인
        if not (1 <= data['score'] <= 100):
            return jsonify({
                'error': '점수는 1에서 100 사이여야 합니다.'
            }), 400
            
        # 현재 시간 정보 추가
        now = datetime.now()
        data['hour'] = now.hour
        data['dayOfWeek'] = now.weekday()
        
        # 여기에 데이터 저장 로직 추가
        # (실제 구현에서는 데이터베이스에 저장)
        
        return jsonify({
            'message': '학습 세션이 성공적으로 저장되었습니다.',
            'session': data
        })
        
    except Exception as e:
        return jsonify({
            'error': f'오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/feedback', methods=['POST'])
def get_feedback():
    try:
        data = request.get_json()
        training_data = data.get('trainingData', [])

        if not training_data:
            return jsonify({
                "summary": "아직 분석할 학습 세션 데이터가 없습니다.",
                "strengths": [],
                "areasForImprovement": [],
                "recommendations": [
                    "몇 번의 학습 세션을 기록한 후 다시 시도해주세요. 학습 패턴을 분석하여 맞춤 피드백을 제공해드릴게요!"
                ]
            })

        # --- 분석 로직 시작 ---
        # 각 세션의 studySegments와 breakSegments에서 총 지속 시간 계산
        processed_training_data = []
        for session in training_data:
            total_study_segment_duration = sum(seg.get('duration', 0) for seg in session.get('studySegments', []))
            total_break_segment_duration = sum(seg.get('duration', 0) for seg in session.get('breakSegments', []))
            processed_training_data.append({
                'hour': session['hour'],
                'dayOfWeek': session['dayOfWeek'],
                'score': session['score'],
                'duration': total_study_segment_duration, # 계산된 총 학습 시간
                'breakTime': total_break_segment_duration,    # 계산된 총 휴식 시간
            })

        total_sessions = len(processed_training_data)
        total_study_duration = sum(s['duration'] for s in processed_training_data)
        total_break_duration = sum(s['breakTime'] for s in processed_training_data)
        total_score = sum(s['score'] for s in processed_training_data)

        avg_study_duration = total_study_duration / total_sessions / 60 if total_sessions > 0 else 0
        avg_break_duration = total_break_duration / total_sessions / 60 if total_sessions > 0 else 0
        avg_score = total_score / total_sessions if total_sessions > 0 else 0

        # 시간대별 집중도 분석
        time_of_day_scores = {
            'morning': {'total_score': 0, 'count': 0},
            'afternoon': {'total_score': 0, 'count': 0},
            'evening': {'total_score': 0, 'count': 0},
            'night': {'total_score': 0, 'count': 0},
        }

        for session in processed_training_data: # processed_training_data 사용
            hour = session['hour']
            time_label = ''
            if 5 <= hour < 12:
                time_label = 'morning'
            elif 12 <= hour < 17:
                time_label = 'afternoon'
            elif 17 <= hour < 21:
                time_label = 'evening'
            else:
                time_label = 'night'
            
            time_of_day_scores[time_label]['total_score'] += session['score']
            time_of_day_scores[time_label]['count'] += 1
        
        best_time_of_day = ''
        highest_avg_score = -1
        time_map = {'morning': '오전', 'afternoon': '오후', 'evening': '저녁', 'night': '밤'}

        for time_label, data in time_of_day_scores.items():
            if data['count'] > 0:
                current_avg_score = data['total_score'] / data['count']
                if current_avg_score > highest_avg_score:
                    highest_avg_score = current_avg_score
                    best_time_of_day = time_map[time_label]

        # 주말/평일 집중도 분석 (간단 버전)
        weekday_scores = {'total_score': 0, 'count': 0}
        weekend_scores = {'total_score': 0, 'count': 0}

        for session in processed_training_data: # processed_training_data 사용
            day_of_week = session['dayOfWeek']
            if day_of_week >= 5: # Sat, Sun
                weekend_scores['total_score'] += session['score']
                weekend_scores['count'] += 1
            else:
                weekday_scores['total_score'] += session['score']
                weekday_scores['count'] += 1
        
        avg_weekday_score = weekday_scores['total_score'] / weekday_scores['count'] if weekday_scores['count'] > 0 else 0
        avg_weekend_score = weekend_scores['total_score'] / weekend_scores['count'] if weekend_scores['count'] > 0 else 0

        # --- 피드백 메시지 생성 ---
        summary = f"총 {total_sessions}개의 학습 세션을 분석했습니다."
        strengths = []
        areas_for_improvement = []
        recommendations = []

        if best_time_of_day:
            strengths.append(f"최고의 집중 시간대는 {best_time_of_day} 입니다. 이때 중요한 학습을 배치하는 것이 효과적입니다.")
        
        if avg_score > 80:
            strengths.append(f"평균 집중 점수가 {int(avg_score)}점으로 매우 우수합니다. 꾸준히 좋은 집중력을 유지하고 계세요!")
        elif avg_score < 60 and total_sessions >= 5:
            areas_for_improvement.append(f"평균 집중 점수가 {int(avg_score)}점으로 다소 낮습니다. 학습 환경을 개선하거나 짧은 세션으로 집중하는 연습이 필요합니다.")

        if avg_weekend_score > 0 and avg_weekday_score > 0 and avg_weekday_score - avg_weekend_score > 10: # 주중 점수가 주말보다 10점 이상 높을 경우
            areas_for_improvement.append(f"주말 학습 시 집중도(평균 {int(avg_weekend_score)}점)가 평일(평균 {int(avg_weekday_score)}점)보다 낮아지는 경향이 있습니다. 주말에는 가벼운 복습 위주로 하는 것이 좋습니다.")
        elif avg_weekend_score > 0 and avg_weekday_score > 0 and avg_weekend_score - avg_weekday_score > 10: # 주말 점수가 주중보다 10점 이상 높을 경우
            strengths.append(f"주말 학습 시 집중도(평균 {int(avg_weekend_score)}점)가 평일(평균 {int(avg_weekday_score)}점)보다 높은 편입니다. 주말을 적극 활용해 보세요!")

        if avg_study_duration < 20 and total_sessions >= 5: # 평균 학습 시간이 20분 미만일 경우
            areas_for_improvement.append(f"평균 학습 시간이 {int(avg_study_duration)}분으로 짧은 편입니다. 조금씩 학습 시간을 늘려 집중력을 향상시켜 보세요.")
        elif avg_study_duration > 40 and total_sessions >= 5: # 평균 학습 시간이 40분 초과일 경우
            strengths.append(f"평균 학습 시간이 {int(avg_study_duration)}분으로 긴 시간 집중하는 데 능숙합니다. 하지만 너무 길어지지 않도록 적절한 휴식을 취하며 효율을 유지하세요.")

        if not strengths and not areas_for_improvement:
            recommendations.append("아직 분석할 데이터가 부족하거나 특별한 경향이 보이지 않습니다. 더 많은 학습 세션을 기록해 보세요!")
        
        if avg_score > 0: # 점수가 있을 때만 일반적인 추천
            recommendations.append(f"일관된 학습 루틴을 만들어 보세요. 매일 같은 시간에 학습을 시작하고 휴식을 취하는 것이 집중력 향상에 도움이 됩니다.")
            recommendations.append(f"학습 목표를 구체적으로 설정하고, 세션 후에 얼마나 달성했는지 평가하는 습관을 들이세요.")

        # --- 분석 로직 끝 ---

        return jsonify({
            "summary": summary,
            "strengths": strengths,
            "areasForImprovement": areas_for_improvement,
            "recommendations": recommendations
        })

    except Exception as e:
        return jsonify({
            "summary": "피드백 생성 중 오류가 발생했습니다.",
            "strengths": [],
            "areasForImprovement": [],
            "recommendations": [f"오류: {str(e)}. 서버 관리자에게 문의하세요."]
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 