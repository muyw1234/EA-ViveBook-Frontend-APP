import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { TextInput, Button, Avatar, Card, ActivityIndicator, Menu, TouchableRipple, Chip, Portal, Modal } from "react-native-paper";
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import api from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { styles as globalStyles } from "../../styles/default";

export default function ProfileScreen({ route }: any) {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
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
    const [followers, setFollowers] = useState<any[]>([]);

    // Favorites state
    const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
    const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
    const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
    const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
    
    const [newAuthor, setNewAuthor] = useState("");
    const [newBook, setNewBook] = useState("");

    // Deletion Modal
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'menu' | 'confirm_soft' | 'confirm_perm'>('menu');
    const [deleting, setDeleting] = useState(false);

    const ALL_CATEGORIES = ['Terror', 'Misterio', 'Aventura', 'Juvenil', 'Policíaco', 'Infantil', 'Autoayuda', 'Novela', 'Biografías', 'Cómics', 'Otros'];

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
            
            // Set favorites
            setFavoriteAuthors(Array.isArray(response.data.favoriteAuthors) ? response.data.favoriteAuthors : []);
            setFavoriteBooks(Array.isArray(response.data.favoriteBooks) ? response.data.favoriteBooks : []);
            setFavoriteCategories(Array.isArray(response.data.favoriteCategories) ? response.data.favoriteCategories : []);

            const targetId = userId || response.data._id || currentUserId;
            if (targetId && typeof targetId === 'string' && targetId.length === 24) {
                try {
                    const [reviewsResponse, followersResponse] = await Promise.all([
                        api.get(`/valoraciones/received/${targetId}`),
                        api.get(`/usuarios/${targetId}/followers`)
                    ]);
                    setReviews(Array.isArray(reviewsResponse.data.valoraciones) ? reviewsResponse.data.valoraciones : []);
                    setStats(reviewsResponse.data.stats || { averageRating: 0, totalReviews: 0 });
                    setFollowers(Array.isArray(followersResponse.data) ? followersResponse.data : []);
                } catch (revError) {
                    console.error("Error fetching extra profile data:", revError);
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
            const payload = { 
                name, 
                email, 
                description,
                favoriteAuthors,
                favoriteBooks,
                favoriteCategories
            };

            const response = await api.put(`/usuarios/${user._id}`, payload);
            if (response.status === 200) {
                setUser(response.data);
                setIsEditing(false);
                if (isMyProfile) {
                    await AsyncStorage.setItem('user', JSON.stringify(response.data));
                }
                Alert.alert(t('success'), t('profile_success_update'));
            }
        } catch (error: any) {
            console.error("Error updating profile:", error.response?.data || error.message);
            Alert.alert(t('error'), JSON.stringify(error.response?.data || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const executeSoftDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/usuarios/${user._id}`);
            Alert.alert(t('success'), t('delete_success'));
            logout();
        } catch (error: any) {
            console.error("Error deleting profile (soft):", error);
            const msg = error.response?.data?.message || error.message || t('error');
            Alert.alert(t('error'), msg);
        } finally {
            setDeleting(false);
            setDeleteModalVisible(false);
            setDeleteStep('menu');
        }
    };

    const executePermanentDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/usuarios/permanent/${user._id}`);
            Alert.alert(t('success'), t('delete_success'));
            logout();
        } catch (error: any) {
            console.error("Error deleting profile (permanent):", error);
            const msg = error.response?.data?.message || error.message || t('error');
            Alert.alert(t('error'), msg);
        } finally {
            setDeleting(false);
            setDeleteModalVisible(false);
            setDeleteStep('menu');
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

                <View style={styles.ratingRow}>
                    <Text variant="bodyMedium" style={{ color: '#666', marginTop: 5 }}>
                        <Text style={{ fontWeight: 'bold' }}>{followers.length}</Text> {t('followers', { defaultValue: 'Seguidores' })}
                    </Text>
                </View>
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

                            <Text variant="titleMedium" style={{ marginTop: 15, marginBottom: 5, color: '#D183BA', fontWeight: 'bold' }}>Favoritos</Text>
                            
                            <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>{t('fav_authors')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    value={newAuthor}
                                    onChangeText={setNewAuthor}
                                    mode="outlined"
                                    placeholder="Añadir autor..."
                                    style={[globalStyles.input, { flex: 1, marginBottom: 0, height: 40 }]}
                                />
                                <Button 
                                    mode="contained" 
                                    onPress={() => {
                                        if (newAuthor.trim() && favoriteAuthors.length < 5) {
                                            setFavoriteAuthors([...favoriteAuthors, newAuthor.trim()]);
                                            setNewAuthor("");
                                        }
                                    }}
                                    disabled={favoriteAuthors.length >= 5 || !newAuthor.trim()}
                                    style={{ marginLeft: 10 }}
                                    buttonColor="#D183BA"
                                >
                                    +
                                </Button>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginBottom: 10 }}>
                                {favoriteAuthors.map((author, index) => (
                                    <Chip key={index} style={{ margin: 2 }} onClose={() => setFavoriteAuthors(favoriteAuthors.filter((_, i) => i !== index))}>{author}</Chip>
                                ))}
                            </View>
                            
                            <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>{t('fav_books')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    value={newBook}
                                    onChangeText={setNewBook}
                                    mode="outlined"
                                    placeholder="Añadir libro..."
                                    style={[globalStyles.input, { flex: 1, marginBottom: 0, height: 40 }]}
                                />
                                <Button 
                                    mode="contained" 
                                    onPress={() => {
                                        if (newBook.trim() && favoriteBooks.length < 5) {
                                            setFavoriteBooks([...favoriteBooks, newBook.trim()]);
                                            setNewBook("");
                                        }
                                    }}
                                    disabled={favoriteBooks.length >= 5 || !newBook.trim()}
                                    style={{ marginLeft: 10 }}
                                    buttonColor="#D183BA"
                                >
                                    +
                                </Button>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginBottom: 10 }}>
                                {favoriteBooks.map((book, index) => (
                                    <Chip key={index} style={{ margin: 2 }} onClose={() => setFavoriteBooks(favoriteBooks.filter((_, i) => i !== index))}>{book}</Chip>
                                ))}
                            </View>

                            <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>{t('fav_categories')}</Text>
                            <Menu
                                visible={categoryMenuVisible}
                                onDismiss={() => setCategoryMenuVisible(false)}
                                anchor={
                                    <Button mode="outlined" onPress={() => setCategoryMenuVisible(true)} style={{ marginTop: 5, borderColor: '#ccc' }} textColor="#333">
                                        {t('select_categories')}
                                    </Button>
                                }
                            >
                                {ALL_CATEGORIES.map((cat) => (
                                    <Menu.Item
                                        key={cat}
                                        title={cat}
                                        trailingIcon={favoriteCategories.includes(cat) ? "check" : undefined}
                                        onPress={() => {
                                            if (favoriteCategories.includes(cat)) {
                                                setFavoriteCategories(favoriteCategories.filter(c => c !== cat));
                                            } else {
                                                setFavoriteCategories([...favoriteCategories, cat]);
                                            }
                                        }}
                                    />
                                ))}
                            </Menu>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                                {favoriteCategories.map(cat => (
                                    <Chip key={cat} style={{ margin: 2 }} onClose={() => setFavoriteCategories(favoriteCategories.filter(c => c !== cat))}>{cat}</Chip>
                                ))}
                            </View>

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
                                        setFavoriteAuthors(user.favoriteAuthors || []);
                                        setFavoriteBooks(user.favoriteBooks || []);
                                        setFavoriteCategories(user.favoriteCategories || []);
                                        setNewAuthor("");
                                        setNewBook("");
                                    }}
                                    textColor="#64748b"
                                    style={{ flex: 1, marginLeft: 5 }}
                                >
                                    {t('cancel')}
                                </Button>
                            </View>

                            {isMyProfile && (
                                <Button 
                                    mode="outlined" 
                                    onPress={() => {
                                        setDeleteStep('menu');
                                        setDeleteModalVisible(true);
                                    }}
                                    textColor="#e53935"
                                    style={{ marginTop: 20, borderColor: '#e53935' }}
                                >
                                    {t('delete_profile_btn')}
                                </Button>
                            )}
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

                            {((Array.isArray(user.favoriteAuthors) && user.favoriteAuthors.length > 0) || (Array.isArray(user.favoriteBooks) && user.favoriteBooks.length > 0) || (Array.isArray(user.favoriteCategories) && user.favoriteCategories.length > 0)) && (
                                <View style={{ marginTop: 20 }}>
                                    <Text variant="titleMedium" style={{ color: '#D183BA', fontWeight: 'bold', marginBottom: 10 }}>Favoritos</Text>
                                    
                                    {Array.isArray(user.favoriteAuthors) && user.favoriteAuthors.length > 0 && (
                                        <View style={{ marginBottom: 10 }}>
                                            <Text variant="labelLarge" style={styles.label}>{t('fav_authors')}</Text>
                                            <Text variant="bodyMedium">{user.favoriteAuthors.join(', ')}</Text>
                                        </View>
                                    )}

                                    {Array.isArray(user.favoriteBooks) && user.favoriteBooks.length > 0 && (
                                        <View style={{ marginBottom: 10 }}>
                                            <Text variant="labelLarge" style={styles.label}>{t('fav_books')}</Text>
                                            <Text variant="bodyMedium">{user.favoriteBooks.join(', ')}</Text>
                                        </View>
                                    )}

                                    {Array.isArray(user.favoriteCategories) && user.favoriteCategories.length > 0 && (
                                        <View style={{ marginBottom: 10 }}>
                                            <Text variant="labelLarge" style={styles.label}>{t('fav_categories')}</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
                                                {user.favoriteCategories.map((cat: string) => (
                                                    <Chip key={cat} style={{ margin: 2 }}>{cat}</Chip>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

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
                                    {rev.libro?.title || ''}{rev.tipoOperacion ? ` (${rev.tipoOperacion.toLowerCase()})` : ''}
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

            <Portal>
                <Modal
                    visible={deleteModalVisible}
                    onDismiss={() => {
                        if (!deleting) {
                            setDeleteModalVisible(false);
                            setDeleteStep('menu');
                        }
                    }}
                    contentContainerStyle={styles.modalContent}
                >
                    {deleteStep === 'menu' && (
                        <>
                            <Text variant="headlineSmall" style={styles.modalTitle}>{t('delete_profile_title')}</Text>
                            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20 }}>
                                {t('delete_profile_msg')}
                            </Text>

                            <Button 
                                mode="contained" 
                                onPress={() => setDeleteStep('confirm_soft')} 
                                buttonColor="#f59e0b"
                                style={{ marginBottom: 10 }}
                            >
                                {t('delete_temp')}
                            </Button>
                            
                            <Button 
                                mode="contained" 
                                onPress={() => setDeleteStep('confirm_perm')} 
                                buttonColor="#e53935"
                                style={{ marginBottom: 10 }}
                            >
                                {t('delete_perm')}
                            </Button>

                            <Button 
                                mode="outlined" 
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setDeleteStep('menu');
                                }}
                                textColor="#64748b"
                                style={{ borderColor: '#64748b' }}
                            >
                                {t('cancel')}
                            </Button>
                        </>
                    )}

                    {deleteStep === 'confirm_soft' && (
                        <>
                            <Text variant="headlineSmall" style={styles.modalTitle}>{t('delete_profile_title')}</Text>
                            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20 }}>
                                {t('delete_temp_confirm')}
                            </Text>
                            <Button mode="contained" onPress={executeSoftDelete} loading={deleting} disabled={deleting} buttonColor="#f59e0b" style={{ marginBottom: 10 }}>
                                {t('delete_temp')}
                            </Button>
                            <Button mode="outlined" onPress={() => setDeleteStep('menu')} disabled={deleting} textColor="#64748b" style={{ borderColor: '#64748b' }}>
                                {t('cancel')}
                            </Button>
                        </>
                    )}

                    {deleteStep === 'confirm_perm' && (
                        <>
                            <Text variant="headlineSmall" style={styles.modalTitle}>{t('delete_profile_title')}</Text>
                            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20 }}>
                                {t('delete_perm_confirm')}
                            </Text>
                            <Button mode="contained" onPress={executePermanentDelete} loading={deleting} disabled={deleting} buttonColor="#e53935" style={{ marginBottom: 10 }}>
                                {t('delete_perm')}
                            </Button>
                            <Button mode="outlined" onPress={() => setDeleteStep('menu')} disabled={deleting} textColor="#64748b" style={{ borderColor: '#64748b' }}>
                                {t('cancel')}
                            </Button>
                        </>
                    )}
                </Modal>
            </Portal>
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
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 16,
    },
    modalTitle: {
        marginBottom: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    }
});