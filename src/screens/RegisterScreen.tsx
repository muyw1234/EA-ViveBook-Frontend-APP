import React, { useState } from "react";
import { View, Alert, StyleSheet, ScrollView } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { styles as globalStyles } from "../../styles/default";

export default function RegisterScreen() {
    const navigation = useNavigation();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async () => {
        setErrorMsg("");
        
        if (!name || !email || !confirmEmail || !password || !confirmPassword) {
            setErrorMsg("Por favor, rellena todos los campos");
            return;
        }

        if (email !== confirmEmail) {
            setErrorMsg("Los correos electrónicos no coinciden");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signup", { 
                name, 
                email, 
                confirmEmail,
                password,
                confirmPassword
            });

            if (response.status === 201) {
                Alert.alert("¡Éxito!", "Usuario registrado correctamente");
                navigation.navigate("Login" as never);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Hubo un problema al registrarte";
            setErrorMsg(message);
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
                    <Text variant="headlineLarge" style={globalStyles.title}>Registro</Text>
                    <Text variant="bodyMedium" style={globalStyles.subtitle}>Crea tu cuenta en ViveBook</Text>
                    
                    <TextInput
                        label="Nombre Completo"
                        value={name}
                        onChangeText={setName}
                        mode="flat"
                        underlineColor="transparent"
                        style={globalStyles.input}
                        left={<TextInput.Icon icon="account" />}
                    />

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
                        label="Confirmar Email"
                        value={confirmEmail}
                        onChangeText={setConfirmEmail}
                        mode="flat"
                        underlineColor="transparent"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={globalStyles.input}
                        left={<TextInput.Icon icon="email-check" />}
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

                    <TextInput
                        label="Confirmar Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="flat"
                        underlineColor="transparent"
                        secureTextEntry
                        style={globalStyles.input}
                        left={<TextInput.Icon icon="lock-check" />}
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
                        Registrarme
                    </Button>

                    <Button 
                        onPress={() => navigation.navigate("Login" as never)}
                        textColor="#D183BA"
                    >
                        ¿Ya tienes cuenta? Inicia sesión
                    </Button>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}