import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Text, TextInput, Button, Avatar, Card, ActivityIndicator } from "react-native-paper";
import { useTranslation } from 'react-i18next';
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";

export default function ProfileScreen() {
    const { t } = useTranslation();
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
            Alert.alert(t('error'), t('profile_err_loading'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!name || !email) {
            Alert.alert(t('error'), t('profile_err_fields'));
            return;
        }

        setUpdating(true);
        try {
            const response = await api.put(`/usuarios/${user._id}`, { name, email });
            if (response.status === 200) {
                setUser(response.data);
                setIsEditing(false);
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
                Alert.alert(t('success'), t('profile_success_update'));
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert(t('error'), t('profile_err_update'));
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
                    {isEditing ? t('profile_title') : name}
                </Text>
            </View>

            <Card style={[globalStyles.card, { margin: 20 }]}>
                <Card.Content>
                    {isEditing ? (
                        <>
                            <TextInput
                                label={t('profile_name_label')}
                                value={name}
                                onChangeText={setName}
                                mode="flat"
                                underlineColor="transparent"
                                style={globalStyles.input}
                            />
                            <TextInput
                                label={t('profile_email_label')}
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
                                    {t('save')}
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
                                    {t('cancel')}
                                </Button>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge" style={styles.label}>{t('profile_name_label')}</Text>
                                <Text variant="bodyLarge">{user.name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge" style={styles.label}>{t('profile_email_label')}</Text>
                                <Text variant="bodyLarge">{user.email}</Text>
                            </View>
                            <Button 
                                mode="contained" 
                                onPress={() => setIsEditing(true)}
                                buttonColor="#D183BA"
                                style={{ marginTop: 20 }}
                            >
                                {t('profile_edit_btn')}
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
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontWeight: 'bold',
        color: '#666',
    }
});