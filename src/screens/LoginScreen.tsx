import React, { useState } from "react";
import { View, Alert, StyleSheet, Image, Text as RNText } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { AppText as Text } from '../components/AppText';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from 'react-i18next';
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";

export default function LoginScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('error'), t('err_credentials'));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signin", { email, password });

            if (response.status === 200) {
                // const { token, user } = response.data;
                const  token  = response.data.data.token;
                const user = response.data.data.user;
                console.log("Login successful. User:", JSON.stringify(user));
                
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                
                navigation.navigate("Main" as never);
            }
        } catch (error: any) {
            const message = typeof error.response?.data === 'string' 
                ? error.response.data 
                : t('err_login_failed');
            Alert.alert(t('error'), message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#F5EBF4', '#F5EBF4']}
            style={globalStyles.gradient}
        >
            <View style={globalStyles.card}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                    <Image 
                        source={require('../../assets/libro_inicio.webp')} 
                        style={{ width: 120, height: 120, resizeMode: 'contain' }} 
                    />
                </View>
                <Text variant="headlineLarge" style={globalStyles.title}>{t('login_title')}</Text>
                <Text variant="bodyMedium" style={globalStyles.subtitle}>{t('login_subtitle')}</Text>
                
                <TextInput
                    label={t('email_label')}
                    value={email}
                    onChangeText={setEmail}
                    mode="flat"
                    underlineColor="transparent"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={globalStyles.input}
                    left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>✉️</RNText>} />}
                />

                <TextInput
                    label={t('password_label')}
                    value={password}
                    onChangeText={setPassword}
                    mode="flat"
                    underlineColor="transparent"
                    secureTextEntry={!showPassword}
                    style={globalStyles.input}
                    left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>🔒</RNText>} />}
                    right={
                        <TextInput.Icon 
                            icon={() => <RNText style={{ fontSize: 20 }}>{showPassword ? "👁️" : "👀"}</RNText>} 
                            onPress={() => setShowPassword(!showPassword)} 
                        />
                    }
                />

                <Button 
                    mode="contained" 
                    onPress={handleLogin} 
                    loading={loading}
                    disabled={loading}
                    style={globalStyles.button}
                    buttonColor="#D183BA"
                >
                    {t('btn_enter')}
                </Button>

                <Button 
                    onPress={() => navigation.navigate("Register" as never)}
                    textColor="#D183BA"
                >
                    {t('no_account_link')}
                </Button>
                
                <Button 
                    onPress={() => navigation.navigate("Home" as never)}
                    textColor="#64748b"
                >
                    {t('back')}
                </Button>
            </View>
        </LinearGradient>
    );
}