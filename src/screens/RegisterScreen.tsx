import React, { useState, useEffect } from "react";
import { View, Alert, StyleSheet, ScrollView, Text as RNText, Platform } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { AppText as Text } from '../components/AppText';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";
import { configureGoogleSignIn, loginWithGoogle, isAppleLoginAvailable, loginWithApple } from "../services/socialAuth";

export default function RegisterScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [appleAvailable, setAppleAvailable] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
        const checkApple = async () => {
            const isAvailable = await isAppleLoginAvailable();
            setAppleAvailable(isAvailable);
        };
        checkApple();
    }, []);

    // Real-time password requirement checks
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const metRequirementsCount = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;
    const strengthPercentage = password ? (metRequirementsCount / 3) * 100 : 0;

    let strengthColor = "#cbd5e1";
    let strengthText = "";
    if (password) {
        if (metRequirementsCount === 1) {
            strengthColor = "#ef4444"; // red
            strengthText = t("weak", "Débil");
        } else if (metRequirementsCount === 2) {
            strengthColor = "#f59e0b"; // yellow/orange
            strengthText = t("medium", "Media");
        } else if (metRequirementsCount === 3) {
            strengthColor = "#10b981"; // green
            strengthText = t("strong", "Fuerte");
        }
    }

    const handleRegister = async () => {
        setErrorMsg("");
        
        if (!name || !email || !confirmEmail || !password || !confirmPassword) {
            setErrorMsg(t("err_missing_reg"));
            return;
        }

        if (email !== confirmEmail) {
            setErrorMsg(t("err_emails_dont_match"));
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg(t("err_passwords_dont_match"));
            return;
        }

        if (!hasMinLength || !hasUppercase || !hasNumber) {
            setErrorMsg(t("err_pwd_requirements"));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signup", { 
                name, 
                email, 
                password
            });

            if (response.status === 201) {
                const dataObj = response.data?.data || response.data;
                const { token, user } = dataObj;
                
                // Si el backend devuelve token y usuario, iniciamos sesión automáticamente
                if (token && user) {
                    await AsyncStorage.setItem('token', token);
                    await AsyncStorage.setItem('user', JSON.stringify(user));
                    Alert.alert(t("success"), t("msg_reg_success"));
                    navigation.navigate("Discover" as never);
                } else {
                    Alert.alert(t("success"), t("msg_reg_success"));
                    navigation.navigate("Login" as never);
                }
            }
        } catch (error: any) {
            let message = t("err_reg_problem");
            
            if (error.response) {
                const status = error.response.status;
                if (status >= 500) {
                    message = `${t('err_server_error')} (Status: ${status})`;
                } else {
                    if (typeof error.response.data === 'string') {
                        message = error.response.data;
                    } else if (error.response.data && typeof error.response.data.message === 'string') {
                        message = error.response.data.message;
                    } else {
                        message = t("err_reg_problem");
                    }
                }
            } else if (error.request) {
                message = t('err_network_error');
                if (error.message) {
                    message += ` (${error.message})`;
                }
            } else {
                message = error.message || t("err_reg_problem");
            }
            
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setErrorMsg("");
        setLoading(true);
        try {
            let idToken = "";
            let name = "";
            if (provider === 'google') {
                const userInfo: any = await loginWithGoogle();
                idToken = userInfo?.data?.idToken || userInfo?.idToken || "";
                if (!idToken) throw new Error("No Google ID Token");
            } else if (provider === 'apple') {
                const credential = await loginWithApple();
                idToken = credential.identityToken || "";
                if (!idToken) throw new Error("No Apple Identity Token");
                if (credential.fullName?.givenName) {
                    name = `${credential.fullName.givenName} ${credential.fullName.familyName || ""}`.trim();
                }
            }

            const response = await api.post("/auth/social-login", { provider, idToken, name });

            if (response.status === 200 || response.status === 201) {
                const token = response.data.data.token;
                const user = response.data.data.user;
                
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                
                navigation.navigate("Discover" as never);
            }
        } catch (error: any) {
            console.log(error);
            const msg = error.message || t('err_reg_problem');
            setErrorMsg(msg);
            Alert.alert(t('error'), msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#F5E4F0', '#F5E4F0']}
            style={globalStyles.gradient}
        >
            <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
                <View style={globalStyles.card}>
                    <Text variant="headlineLarge" style={globalStyles.title}>
                        {t("register_title")}
                    </Text>
                    <Text variant="bodyMedium" style={globalStyles.subtitle}>
                        {t("register_subtitle")}
                    </Text>
                    
                    <TextInput
                        label={t("name_label")}
                        value={name}
                        onChangeText={setName}
                        mode="flat"
                        underlineColor="transparent"
                        style={globalStyles.input}
                        left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>👤</RNText>} />}
                    />

                    <TextInput
                        label={t("email_label")}
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
                        label={t("confirm_email_label")}
                        value={confirmEmail}
                        onChangeText={setConfirmEmail}
                        mode="flat"
                        underlineColor="transparent"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={globalStyles.input}
                        left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>✉️</RNText>} />}
                    />

                    <TextInput
                        label={t("password_label")}
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

                    {password.length > 0 && (
                        <View style={localStyles.strengthContainer}>
                            <View style={localStyles.strengthLabelContainer}>
                                <Text style={localStyles.strengthLabel}>{t("pwd_strength")}</Text>
                                <Text style={[localStyles.strengthText, { color: strengthColor }]}>
                                    {strengthText}
                                </Text>
                            </View>
                            <View style={localStyles.strengthBarTrack}>
                                <View 
                                    style={[
                                        localStyles.strengthBarFill, 
                                        { 
                                            width: `${strengthPercentage}%`, 
                                            backgroundColor: strengthColor 
                                        }
                                    ]} 
                                />
                            </View>
                            
                            <View style={localStyles.requirementsContainer}>
                                <View style={localStyles.requirementItem}>
                                    <View style={[
                                        localStyles.dotIndicator,
                                        { backgroundColor: hasMinLength ? "#10b981" : "#cbd5e1" }
                                    ]} />
                                    <Text style={[
                                        localStyles.requirementText, 
                                        { color: hasMinLength ? "#0f172a" : "#64748b" }
                                    ]}>
                                        {t("pwd_req_min_chars")}
                                    </Text>
                                </View>
                                
                                <View style={localStyles.requirementItem}>
                                    <View style={[
                                        localStyles.dotIndicator,
                                        { backgroundColor: hasUppercase ? "#10b981" : "#cbd5e1" }
                                    ]} />
                                    <Text style={[
                                        localStyles.requirementText, 
                                        { color: hasUppercase ? "#0f172a" : "#64748b" }
                                    ]}>
                                        {t("pwd_req_uppercase")}
                                    </Text>
                                </View>
                                
                                <View style={localStyles.requirementItem}>
                                    <View style={[
                                        localStyles.dotIndicator,
                                        { backgroundColor: hasNumber ? "#10b981" : "#cbd5e1" }
                                    ]} />
                                    <Text style={[
                                        localStyles.requirementText, 
                                        { color: hasNumber ? "#0f172a" : "#64748b" }
                                    ]}>
                                        {t("pwd_req_number")}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <TextInput
                        label={t("confirm_password_label")}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="flat"
                        underlineColor="transparent"
                        secureTextEntry={!showConfirmPassword}
                        style={globalStyles.input}
                        left={<TextInput.Icon icon={() => <RNText style={{ fontSize: 20 }}>🔒</RNText>} />}
                        right={
                            <TextInput.Icon 
                                icon={() => <RNText style={{ fontSize: 20 }}>{showConfirmPassword ? "👁️" : "👀"}</RNText>} 
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                            />
                        }
                    />

                    {errorMsg ? (
                        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                            {errorMsg}
                        </Text>
                    ) : null}

                    <Button 
                        mode="contained" 
                        onPress={handleRegister} 
                        loading={loading}
                        disabled={loading}
                        style={globalStyles.button}
                        buttonColor="#D183BA"
                    >
                        {t("btn_create_account")}
                    </Button>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10, width: '100%' }}>
                        {Platform.OS !== 'web' && (
                            <Button 
                                mode="outlined" 
                                onPress={() => handleSocialLogin('google')} 
                                disabled={loading}
                                style={{ flex: 1, marginRight: appleAvailable ? 5 : 0, borderColor: '#D183BA' }}
                                textColor="#D183BA"
                                icon={() => <RNText style={{ fontSize: 18 }}>G</RNText>}
                            >
                                Google
                            </Button>
                        )}
                        {appleAvailable && (
                            <Button 
                                mode="outlined" 
                                onPress={() => handleSocialLogin('apple')} 
                                disabled={loading}
                                style={{ flex: 1, marginLeft: 5, borderColor: '#D183BA' }}
                                textColor="#D183BA"
                                icon={() => <RNText style={{ fontSize: 18 }}></RNText>}
                            >
                                Apple
                            </Button>
                        )}
                    </View>

                    <Button 
                        onPress={() => navigation.navigate("Login" as never)}
                        textColor="#D183BA"
                    >
                        {t("already_have_account_link")}
                    </Button>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const localStyles = StyleSheet.create({
    strengthContainer: {
        marginBottom: 16,
        marginTop: -8,
        paddingHorizontal: 4,
    },
    strengthLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    strengthLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#64748b',
    },
    strengthText: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
    },
    strengthBarTrack: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    requirementsContainer: {
        paddingHorizontal: 2,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    requirementText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
});