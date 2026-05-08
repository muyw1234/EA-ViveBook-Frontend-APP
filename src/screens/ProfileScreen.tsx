import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Text, TextInput, Button, Avatar, Card, ActivityIndicator } from "react-native-paper";
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/auth/profile");
            setUser(response.data);
            setName(response.data.name);
            setEmail(response.data.email);
        } catch (error) {
            console.error("Error fetching profile:", error);
            Alert.alert("Error", "No se pudo cargar el perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!name || !email) {
            Alert.alert("Error", "El nombre y el email son obligatorios");
            return;
        }

        setUpdating(true);
        try {
            const response = await api.put(`/usuarios/${user._id}`, { name, email });
            if (response.status === 200) {
                setUser(response.data);
                setIsEditing(false);
                // Actualizar usuario en AsyncStorage también
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
                Alert.alert("¡Éxito!", "Perfil actualizado correctamente");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "No se pudo actualizar el perfil");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.container}>
            <View style={styles.header}>
                <Avatar.Text 
                    size={80} 
                    label={name.substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: '#D183BA' }} 
                />
                <Text variant="headlineMedium" style={[globalStyles.title, { marginTop: 10 }]}>
                    {isEditing ? "Editar Perfil" : name}
                </Text>
            </View>

            <Card style={[globalStyles.card, { margin: 20 }]}>
                <Card.Content>
                    {isEditing ? (
                        <>
                            <TextInput
                                label="Nombre"
                                value={name}
                                onChangeText={setName}
                                mode="flat"
                                underlineColor="transparent"
                                style={globalStyles.input}
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
                            />
                            <View style={styles.buttonRow}>
                                <Button 
                                    mode="contained" 
                                    onPress={handleUpdate} 
                                    loading={updating}
                                    buttonColor="#D183BA"
                                    style={{ flex: 1, marginRight: 5 }}
                                >
                                    Guardar
                                </Button>
                                <Button 
                                    mode="outlined" 
                                    onPress={() => {
                                        setIsEditing(false);
                                        setName(user.name);
                                        setEmail(user.email);
                                    }}
                                    textColor="#64748b"
                                    style={{ flex: 1, marginLeft: 5 }}
                                >
                                    Cancelar
                                </Button>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge" style={styles.label}>Nombre:</Text>
                                <Text variant="bodyLarge">{user.name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge" style={styles.label}>Email:</Text>
                                <Text variant="bodyLarge">{user.email}</Text>
                            </View>
                            <Button 
                                mode="contained" 
                                onPress={() => setIsEditing(true)}
                                buttonColor="#D183BA"
                                style={{ marginTop: 20 }}
                            >
                                Editar
                            </Button>
                        </>
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    infoRow: {
        marginBottom: 15,
    },
    label: {
        color: '#64748b',
        marginBottom: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 10,
    }
});

