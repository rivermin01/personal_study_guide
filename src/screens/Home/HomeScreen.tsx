import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const navigation = useNavigation();
    const handleStartTest = () => {
        navigation.navigate('검사 시작' as never); // 타입 오류 방지용 as never
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>당신만을 위한 학습 전략</Text>
        <TouchableOpacity style={styles.button} onPress={handleStartTest}>
            <Text style={styles.buttonText}>검사 시작하기</Text>
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // 2번 색상
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 20,
        color: COLORS.text,
        marginBottom: 32,
        fontWeight: '600',
    },
    button: {
        backgroundColor: COLORS.point, // 1번 색상
        paddingVertical: 16,
        paddingHorizontal: 36,
        borderRadius: 12,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});