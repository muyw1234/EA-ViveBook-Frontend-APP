import React, { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";

export default function LoginScreen() {
    const navigation = useNavigation();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Por favor, introduce tus credenciales");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signin", { email, password });

            if (response.status === 200) {
                const { token, user } = response.data;
                console.log("Login exitoso. Usuario:", user.name);
                
                // Guardar sesión
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                
                navigation.navigate("Main" as never);
            }
        } catch (error: any) {
            const message = typeof error.response?.data === 'string' 
                ? error.response.data 
                : "Email o contraseña incorrectos";
            Alert.alert("Error de acceso", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#F5E4F0', '#F5E4F0']}
            style={globalStyles.gradient}
        >
            <View style={globalStyles.card}>
                <Text variant="headlineLarge" style={globalStyles.title}>ViveBook</Text>
                <Text variant="bodyMedium" style={globalStyles.subtitle}>Inicia sesión para continuar</Text>
                
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="flat"
                    underlineColor="transparent"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={globalStyles.input}
                    left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    mode="flat"
                    underlineColor="transparent"
                    secureTextEntry
                    style={globalStyles.input}
                    left={<TextInput.Icon icon="lock" />}
                />

                <Button 
                    mode="contained" 
                    onPress={handleLogin} 
                    loading={loading}
                    disabled={loading}
                    style={globalStyles.button}
                    buttonColor="#D183BA"
                >
                    Entrar
                </Button>

                <Button 
                    onPress={() => navigation.navigate("Register" as never)}
                    textColor="#D183BA"
                >
                    ¿No tienes cuenta? Regístrate
                </Button>
                
                <Button 
                    onPress={() => navigation.navigate("Home" as never)}
                    textColor="#64748b"
                >
                    Volver
                </Button>
            </View>
        </LinearGradient>
    );
}