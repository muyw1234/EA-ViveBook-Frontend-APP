import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Text, TextInput, Button, Avatar, Card, ActivityIndicator } from "react-native-paper";
import { useTranslation } from 'react-i18next';
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles } from "../../styles/default";

export default function ProfileScreen({ route }: any) {
    const { t } = useTranslation();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [updating, setUpdating] = useState(false);
    const [isMyProfile, setIsMyProfile] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

    const userId = route?.params?.userId;

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            let response;
            let currentUserId;
            
            const storedUserStr = await AsyncStorage.getItem('user');
            if (storedUserStr) {
                currentUserId = JSON.parse(storedUserStr)._id;
            }

            if (userId) {
                response = await api.get(`/usuarios/${userId}`);
                setIsMyProfile(currentUserId === userId);
            } else {
                response = await api.get("/auth/profile");
                setIsMyProfile(true);
            }
            
            setUser(response.data);
            setName(response.data.name);
            setEmail(response.data.email);
            setDescription(response.data.description || "");

            // Fetch reviews only if we have a valid target ID
            const targetId = userId || response.data._id || currentUserId;
            if (targetId && typeof targetId === 'string' && targetId.length === 24) {
                try {
                    const reviewsResponse = await api.get(`/valoraciones/received/${targetId}`);
                    setReviews(reviewsResponse.data.valoraciones || []);
                    setStats(reviewsResponse.data.stats || { averageRating: 0, totalReviews: 0 });
                } catch (revError) {
                    console.error("Error fetching reviews:", revError);
                    // Don't fail the whole profile load if only reviews fail
                }
            }
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            const errorMsg = error.response?.data?.message || t('profile_err_loading');
            Alert.alert(t('error'), errorMsg);
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
            const response = await api.put(`/usuarios/${user._id}`, { name, email, description });
            if (response.status === 200) {
                setUser(response.data);
                setIsEditing(false);
                if (isMyProfile) {
                    await AsyncStorage.setItem('user', JSON.stringify(response.data));
                }
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

    if (!user) {
        return (
            <View style={[globalStyles.container, styles.centered]}>
                <Text variant="bodyLarge" style={{ color: '#666' }}>{t('profile_err_loading')}</Text>
                <Button mode="contained" onPress={fetchProfile} style={{ marginTop: 20 }}>{t('retry')}</Button>
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.container}>
            <View style={styles.header}>
                <Avatar.Text 
                    size={80} 
                    label={(name || "U").substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: '#D183BA' }} 
                />
                <Text variant="headlineMedium" style={[globalStyles.title, { marginTop: 10 }]}>
                    {isEditing ? t('profile_title') : (name || t('loading'))}
                </Text>
                {stats.totalReviews > 0 && (
                    <View style={styles.ratingRow}>
                        <Text variant="titleMedium" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                            {"★".repeat(Math.max(0, Math.round(stats.averageRating || 0)))}{"☆".repeat(Math.max(0, 5 - Math.round(stats.averageRating || 0)))} {stats.averageRating || 0}
                        </Text>
                        <Text variant="bodySmall" style={{ marginLeft: 5, color: '#666' }}>
                            ({stats.totalReviews} {t('reviews_header').toLowerCase()})
                        </Text>
                    </View>
                )}
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
                            <TextInput
                                label={t('about_me_label')}
                                value={description}
                                onChangeText={setDescription}
                                mode="flat"
                                underlineColor="transparent"
                                multiline
                                numberOfLines={4}
                                style={[globalStyles.input, { height: 100 }]}
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
                                        setDescription(user.description || "");
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
                            <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <Text variant="labelLarge" style={[styles.label, { marginBottom: 5 }]}>{t('about_me_label')}</Text>
                                <Text variant="bodyMedium" style={{ color: '#444' }}>
                                    {user.description || "Sin descripción"}
                                </Text>
                            </View>
                            {isMyProfile && (
                                <Button 
                                    mode="contained" 
                                    onPress={() => setIsEditing(true)}
                                    buttonColor="#D183BA"
                                    style={{ marginTop: 20 }}
                                >
                                    {t('profile_edit_btn')}
                                </Button>
                            )}
                        </>
                    )}
                </Card.Content>
            </Card>

            {/* Reviews Section */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <Text variant="titleLarge" style={{ marginBottom: 15, fontWeight: 'bold' }}>
                    {t('reviews_header')}
                </Text>
                {reviews.length === 0 ? (
                    <Text style={{ color: '#888', fontStyle: 'italic' }}>{t('no_reviews')}</Text>
                ) : (
                    reviews.map((rev) => (
                        <Card key={rev._id} style={{ marginBottom: 12, backgroundColor: '#fff' }}>
                            <Card.Content>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text variant="labelLarge" style={{ color: '#D183BA' }}>{rev.usuarioAutor?.name}</Text>
                                    <Text variant="labelMedium" style={{ color: '#f59e0b' }}>{"★".repeat(Math.max(0, rev.puntuacion || 0))}{"☆".repeat(Math.max(0, 5 - (rev.puntuacion || 0)))}</Text>
                                </View>
                                <Text variant="bodySmall" style={{ color: '#999', marginBottom: 5 }}>
                                    {rev.libro?.title} ({rev.tipoOperacion.toLowerCase()})
                                </Text>
                                {rev.comentario ? (
                                    <Text variant="bodyMedium">{rev.comentario}</Text>
                                ) : null}
                                <Text variant="bodySmall" style={{ alignSelf: 'flex-end', color: '#ccc', marginTop: 5 }}>
                                    {new Date(rev.createdAt).toLocaleDateString()}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </View>
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
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
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