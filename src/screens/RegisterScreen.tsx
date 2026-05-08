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
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Por favor, rellena todos los campos");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signup", { name, email, password });

            if (response.status === 201) {
                Alert.alert("¡Éxito!", "Usuario registrado correctamente");
                navigation.navigate("Login" as never);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Hubo un problema al registrarte";
            Alert.alert("Error de registro", message);
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