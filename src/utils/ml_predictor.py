import sys
import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def prepare_features(data):
    X = np.array([[
        session['hour'],
        session['dayOfWeek'],
        session['focusScore'],
        session['productivity']
    ] for session in data])
    
    y_duration = np.array([session['duration'] for session in data])
    y_break = np.array([session['breakTime'] for session in data])
    
    return X, y_duration, y_break

def train_models(X, y_duration, y_break):
    # 데이터 스케일링
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 학습/테스트 데이터 분리
    X_train, X_test, y_duration_train, y_duration_test = train_test_split(
        X_scaled, y_duration, test_size=0.2, random_state=42
    )
    _, _, y_break_train, y_break_test = train_test_split(
        X_scaled, y_break, test_size=0.2, random_state=42
    )
    
    # 모델 학습
    duration_model = RandomForestRegressor(n_estimators=100, random_state=42)
    break_model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    duration_model.fit(X_train, y_duration_train)
    break_model.fit(X_train, y_break_train)
    
    # 모델 성능 평가
    duration_score = duration_model.score(X_test, y_duration_test)
    break_score = break_model.score(X_test, y_break_test)
    
    return duration_model, break_model, scaler, (duration_score + break_score) / 2

def predict_optimal_pattern(models, current_features, scaler):
    duration_model, break_model = models
    features_scaled = scaler.transform([current_features])
    
    predicted_duration = duration_model.predict(features_scaled)[0]
    predicted_break = break_model.predict(features_scaled)[0]
    
    return predicted_duration, predicted_break

def main():
    # 입력 데이터 읽기
    input_data = json.loads(sys.stdin.read())
    training_data = input_data['trainingData']
    current_hour = input_data['currentHour']
    
    if len(training_data) < 10:  # 최소 데이터 요구사항
        print(json.dumps({
            'duration': 25 * 60,  # 25분을 초 단위로
            'break_time': 5 * 60,  # 5분을 초 단위로
            'confidence': 0.0
        }))
        return
    
    # 특성 준비
    X, y_duration, y_break = prepare_features(training_data)
    
    # 모델 학습
    duration_model, break_model, scaler, confidence = train_models(X, y_duration, y_break)
    
    # 현재 시간에 대한 예측
    current_features = [
        current_hour,
        input_data.get('dayOfWeek', 0),  # 현재 요일
        np.mean([s['focusScore'] for s in training_data]),  # 평균 집중도
        np.mean([s['productivity'] for s in training_data])  # 평균 생산성
    ]
    
    predicted_duration, predicted_break = predict_optimal_pattern(
        (duration_model, break_model),
        current_features,
        scaler
    )
    
    # 결과 출력
    result = {
        'duration': int(predicted_duration),
        'break_time': int(predicted_break),
        'confidence': float(confidence)
    }
    
    print(json.dumps(result))

if __name__ == '__main__':
    main() 