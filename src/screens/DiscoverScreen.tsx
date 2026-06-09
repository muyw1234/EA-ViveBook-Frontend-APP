import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Avatar, Chip, ActivityIndicator, Divider, TextInput } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { styles as globalStyles } from '../../styles/default';

const ALL_CATEGORIES = ['Terror', 'Misterio', 'Aventura', 'Juvenil', 'Policíaco', 'Infantil', 'Autoayuda', 'Novela', 'Biografías', 'Cómics', 'Otros'];
const PREDEFINED_AUTHORS = ['Gabriel García Márquez', 'Jane Austen', 'J.R.R Tolkien', 'George Orwell', 'Alice Kellen', 'Stephen King', 'Colleen Hoover'];

export default function DiscoverScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [authors, setAuthors] = useState<any[]>(PREDEFINED_AUTHORS);
    const [newAuthor, setNewAuthor] = useState("");

    const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
    const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
    const [followingUsers, setFollowingUsers] = useState<string[]>([]); // Storing just IDs locally

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const parsedUser = JSON.parse(userStr);
                setCurrentUser(parsedUser);
                setFavoriteAuthors(parsedUser.favoriteAuthors || []);
                setFavoriteCategories(parsedUser.favoriteCategories || []);
                setFollowingUsers((parsedUser.followingUsers || []).map((u: any) => u._id || u));
            }

            const [usersRes, authorsRes] = await Promise.all([
                api.get('/usuarios'),
                api.get('/autores/all?limit=20') 
            ]);

            // Filter out current user from users list
            if (usersRes.data) {
                const resData = usersRes.data.data || usersRes.data;
                const usersList = Array.isArray(resData) 
                    ? resData 
                    : (Array.isArray(resData?.data) ? resData.data : []);
                const currentId = userStr ? JSON.parse(userStr)._id : null;
                setUsers(usersList.filter((u: any) => u._id !== currentId));
            }

            if (authorsRes.data) {
                const resAuthorsData = authorsRes.data.data || authorsRes.data;
                const backendAuthors = Array.isArray(resAuthorsData) 
                    ? resAuthorsData 
                    : (Array.isArray(resAuthorsData?.data) ? resAuthorsData.data : []);
                const combined = [...PREDEFINED_AUTHORS];
                backendAuthors.forEach((ba: any) => {
                    const name = ba.fullName || ba.name;
                    if (name && !combined.includes(name)) {
                        combined.push(ba);
                    }
                });
                setAuthors(combined);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndContinue = async () => {
        if (!currentUser) {
            navigation.replace('Main');
            return;
        }

        try {
            const payload = {
                favoriteAuthors,
                favoriteCategories,
                followingUsers
            };
            const response = await api.put(`/usuarios/${currentUser._id}`, payload);
            if (response.status === 200) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error("Error saving discover preferences:", error);
        }
        navigation.replace('Main');
    };

    const toggleCategory = (cat: string) => {
        if (favoriteCategories.includes(cat)) {
            setFavoriteCategories(prev => prev.filter(c => c !== cat));
        } else {
            setFavoriteCategories(prev => [...prev, cat]);
        }
    };

    const toggleAuthor = (authorName: string) => {
        if (favoriteAuthors.includes(authorName)) {
            setFavoriteAuthors(prev => prev.filter(a => a !== authorName));
        } else {
            if (favoriteAuthors.length >= 5) {
                Alert.alert(t('limit_reached'), t('limit_authors_msg'));
                return;
            }
            setFavoriteAuthors(prev => [...prev, authorName]);
        }
    };

    const toggleUser = (userId: string) => {
        if (followingUsers.includes(userId)) {
            setFollowingUsers(prev => prev.filter(id => id !== userId));
        } else {
            setFollowingUsers(prev => [...prev, userId]);
        }
    };

    const renderUserItem = (u: any) => {
        const isFollowing = followingUsers.includes(u._id);
        return (
            <View key={u._id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Avatar.Text size={40} label={(u.name || "U").substring(0, 2).toUpperCase()} style={{ backgroundColor: '#D183BA' }} />
                    <Text variant="titleMedium" style={{ marginLeft: 10 }}>{u.name}</Text>
                </View>
                <View style={styles.itemRight}>
                    <Button 
                        mode={isFollowing ? "outlined" : "contained"} 
                        buttonColor={isFollowing ? undefined : "#D183BA"}
                        textColor={isFollowing ? "#D183BA" : "#fff"}
                        onPress={() => toggleUser(u._id)}
                        style={{ marginRight: 5 }}
                        compact
                    >
                        {isFollowing ? t('unfollow') : t('follow')}
                    </Button>
                    <Button 
                        mode="text" 
                        textColor="#64748b"
                        onPress={() => navigation.navigate("UserProfile", { userId: u._id })}
                        compact
                    >
                        {t('view')}
                    </Button>
                </View>
            </View>
        );
    };

    const renderAuthorItem = (a: any) => {
        const authorName = typeof a === 'string' ? a : (a.fullName || a.name);
        const isFollowing = favoriteAuthors.includes(authorName);
        return (
            <View key={typeof a === 'string' ? a : (a._id || authorName)} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Avatar.Text size={40} label={(authorName || "A").substring(0, 2).toUpperCase()} style={{ backgroundColor: '#D183BA' }} />
                    <Text variant="titleMedium" style={{ marginLeft: 10 }}>{authorName}</Text>
                </View>
                <View style={styles.itemRight}>
                    <Button 
                        mode={isFollowing ? "outlined" : "contained"} 
                        buttonColor={isFollowing ? undefined : "#D183BA"}
                        textColor={isFollowing ? "#D183BA" : "#fff"}
                        onPress={() => toggleAuthor(authorName)}
                        compact
                    >
                        {isFollowing ? t('unfollow') : t('follow')}
                    </Button>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#D183BA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text variant="headlineMedium" style={styles.title}>{t('discover_title')}</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>{t('discover_subtitle')}</Text>

                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>{t('categories')}</Text>
                    <View style={styles.chipsContainer}>
                        {ALL_CATEGORIES.map(cat => {
                            const isSelected = favoriteCategories.includes(cat);
                            return (
                                <Chip 
                                    key={cat} 
                                    selected={isSelected}
                                    onPress={() => toggleCategory(cat)}
                                    style={[styles.chip, isSelected && { backgroundColor: '#D183BA' }]}
                                    textStyle={isSelected ? { color: '#fff' } : undefined}
                                >
                                    {cat}
                                </Chip>
                            );
                        })}
                    </View>
                </View>

                <Divider style={{ marginVertical: 20 }} />

                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>{t('authors')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                        <TextInput
                            mode="outlined"
                            label="Añadir autor manualmente"
                            value={newAuthor}
                            onChangeText={setNewAuthor}
                            style={{ flex: 1, backgroundColor: '#fff', height: 40 }}
                            dense
                        />
                        <Button 
                            mode="contained" 
                            buttonColor="#D183BA"
                            onPress={() => {
                                if (newAuthor.trim()) {
                                    toggleAuthor(newAuthor.trim());
                                    setNewAuthor("");
                                }
                            }}
                            style={{ marginLeft: 10 }}
                        >
                            +
                        </Button>
                    </View>
                    {authors.length > 0 ? authors.map(renderAuthorItem) : <Text style={styles.emptyText}>No hay autores disponibles.</Text>}
                </View>

                <Divider style={{ marginVertical: 20 }} />

                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>{t('users')}</Text>
                    {users.length > 0 ? users.map(renderUserItem) : <Text style={styles.emptyText}>No hay usuarios disponibles.</Text>}
                </View>

            </ScrollView>
            <View style={styles.footer}>
                <Button 
                    mode="contained" 
                    buttonColor="#D183BA" 
                    onPress={handleSaveAndContinue}
                    style={{ width: '100%' }}
                >
                    {t('finish')}
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center'
    },
    subtitle: {
        color: '#666',
        marginBottom: 30,
        textAlign: 'center'
    },
    section: {
        marginBottom: 10
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 15
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    chip: {
        margin: 4
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic'
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    }
});
