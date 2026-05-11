import React, { useState } from "react";
import { View, Alert, StyleSheet, ScrollView } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { styles as globalStyles } from "../../styles/default";

export default function RegisterScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert(t("error"), t("err_missing_reg"));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/auth/signup", { name, email, password });

            if (response.status === 201) {
                Alert.alert(t("success"), t("msg_reg_success"));
                navigation.navigate("Login" as never);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t("error");
            Alert.alert(t("error"), message);
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
                        left={<TextInput.Icon icon="account" />}
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
                        left={<TextInput.Icon icon="email" />}
                    />

                    <TextInput
                        label={t("password_label")}
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
                        {t("btn_create_account")}
                    </Button>

                    <Button 
                        onPress={() => navigation.navigate("Login" as never)}
                        textColor="#D183BA"
                    >
                        {t("no_account_link")}
                    </Button>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}