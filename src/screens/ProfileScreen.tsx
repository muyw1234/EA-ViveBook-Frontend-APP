import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import {
  TextInput,
  Button,
  Avatar,
  Card,
  ActivityIndicator,
  Menu,
  TouchableRipple,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { styles as globalStyles } from '../../styles/default';
import ImageService from '../services/ImageService';

export default function ProfileScreen({ route }: any) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isMyProfile, setIsMyProfile] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [followers, setFollowers] = useState<any[]>([]);
  const [myFollowingUsers, setMyFollowingUsers] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [debugText, setDebugText] = useState<string>('Depuración: Inicia pulsando el lápiz.');

  // Favorites state
  const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const [newAuthor, setNewAuthor] = useState('');
  const [newBook, setNewBook] = useState('');

  // Deletion Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'menu' | 'confirm_soft' | 'confirm_perm'>('menu');
  const [deleting, setDeleting] = useState(false);

  const ALL_CATEGORIES = [
    'Terror',
    'Misterio',
    'Aventura',
    'Juvenil',
    'Policíaco',
    'Infantil',
    'Autoayuda',
    'Novela',
    'Biografías',
    'Cómics',
    'Otros',
  ];

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
        const parsedStorage = JSON.parse(storedUserStr);
        currentUserId = parsedStorage._id || parsedStorage.data?._id;
      }

      // Always fetch current logged-in user's details to know who they are following
      let followingIds: string[] = [];
      try {
        const loggedInRes = await api.get('/auth/profile');
        const loggedInUser = loggedInRes.data?.data || loggedInRes.data;
        if (loggedInUser) {
          followingIds = (loggedInUser.followingUsers || []).map((u: any) => u._id || u);
          setMyFollowingUsers(followingIds);
        }
      } catch (err) {
        console.error('Error fetching logged-in user details:', err);
      }

      if (userId) {
        response = await api.get(`/usuarios/${userId}`);
        const isMe = currentUserId === userId;
        setIsMyProfile(isMe);

        // Check notifications status if not my profile and following
        if (!isMe && followingIds.includes(userId)) {
          try {
            const statusRes = await api.get(`/usuarios/${userId}/notifications/status`);
            const statusData = statusRes.data?.data || statusRes.data;
            setNotificationsEnabled(!!statusData.enabled);
          } catch (err) {
            console.error('Error fetching notifications status:', err);
          }
        } else {
          setNotificationsEnabled(false);
        }
      } else {
        response = await api.get('/auth/profile');
        setIsMyProfile(true);
        setNotificationsEnabled(false);
      }

      const userData = response.data?.data || response.data;

      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setDescription(userData.description || '');

      // Set favorites
      setFavoriteAuthors(Array.isArray(userData.favoriteAuthors) ? userData.favoriteAuthors : []);
      setFavoriteBooks(Array.isArray(userData.favoriteBooks) ? userData.favoriteBooks : []);
      setFavoriteCategories(
        Array.isArray(userData.favoriteCategories) ? userData.favoriteCategories : [],
      );

      const targetId = userId || userData._id || currentUserId;
      if (targetId && typeof targetId === 'string' && targetId.length === 24) {
        try {
          const [reviewsResponse, followersResponse] = await Promise.all([
            api.get(`/valoraciones/received/${targetId}`),
            api.get(`/usuarios/${targetId}/followers`),
          ]);
          setReviews(
            Array.isArray(reviewsResponse.data.valoraciones)
              ? reviewsResponse.data.valoraciones
              : [],
          );
          setStats(reviewsResponse.data.stats || { averageRating: 0, totalReviews: 0 });
          setFollowers(Array.isArray(followersResponse.data) ? followersResponse.data : []);
        } catch (revError) {
          console.error('Error fetching extra profile data:', revError);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      const errorMsg = error.response?.data?.message || t('profile_err_loading');
      Alert.alert(t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!userId) return;
    setUpdating(true);
    try {
      const storedUserStr = await AsyncStorage.getItem('user');
      if (!storedUserStr) return;

      const parsedStorage = JSON.parse(storedUserStr);
      const currentUserId = parsedStorage._id || parsedStorage.data?._id;

      if (!currentUserId) {
        Alert.alert(t('error'), 'No se pudo identificar tu sesión de usuario.');
        return;
      }

      let updatedFollowing: string[];
      const isFollowing = myFollowingUsers.includes(userId);
      if (isFollowing) {
        updatedFollowing = myFollowingUsers.filter((id) => id !== userId);
      } else {
        updatedFollowing = [...myFollowingUsers, userId];
      }

      const response = await api.put(`/usuarios/${currentUserId}`, {
        followingUsers: updatedFollowing,
      });

      if (response.status === 200) {
        setMyFollowingUsers(updatedFollowing);
        if (!updatedFollowing.includes(userId)) {
          setNotificationsEnabled(false);
        }

        // Refresh the followers count of the viewed profile
        const followersResponse = await api.get(`/usuarios/${userId}/followers`);
        setFollowers(Array.isArray(followersResponse.data) ? followersResponse.data : []);

        // Update the logged-in user in AsyncStorage
        const updatedUser = {
          ...parsedStorage,
          // Si estaba envuelto en .data, actualiza la propiedad interna, de lo contrario la raíz
          ...(parsedStorage.data
            ? { data: { ...parsedStorage.data, followingUsers: updatedFollowing } }
            : { followingUsers: updatedFollowing }),
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(t('error'), 'No se pudo actualizar el estado de seguimiento.');
    } finally {
      setUpdating(false);
    }
  };

  const toggleNotifications = async () => {
    if (!userId) return;
    setLoadingNotifications(true);
    try {
      if (notificationsEnabled) {
        await api.delete(`/usuarios/${userId}/notifications/disable`);
        setNotificationsEnabled(false);
      } else {
        await api.post(`/usuarios/${userId}/notifications/enable`);
        setNotificationsEnabled(true);
      }
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      const errMsg =
        error.response?.data?.message || 'No se pudo cambiar el estado de las notificaciones.';
      Alert.alert(t('error'), errMsg);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      setUploadingAvatar(true);
      setDebugText('Iniciando selección de imagen...');
      const url = await ImageService.uploadOnAndroid((status: string) => {
        setDebugText(status);
      });
      if (url) {
        setDebugText('Imagen subida a Cloudinary. Guardando en backend...');
        const payload = {
          name,
          email,
          description,
          favoriteAuthors,
          favoriteBooks,
          favoriteCategories,
          avatar: url,
        };

        const response = await api.put(`/usuarios/${user._id}`, payload);
        if (response.status === 200) {
          const updatedUserData = response.data?.data || response.data;
          setUser(updatedUserData);
          if (isMyProfile) {
            await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
          }
          setDebugText('¡Foto actualizada con éxito en base de datos!');
          Alert.alert(t('success'), 'Foto de perfil actualizada con éxito.');
        } else {
          setDebugText(`Error del backend: Código ${response.status}`);
        }
      } else {
        setDebugText((prev) => {
          if (prev.includes('Error') || prev.includes('Excepción') || prev.includes('denegado')) {
            return prev;
          }
          return 'La subida a Cloudinary no devolvió una URL.';
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setDebugText(`Excepción: ${error.message || JSON.stringify(error)}`);
      Alert.alert(t('error'), 'No se pudo subir la foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert(t('error'), t('profile_err_fields'));
      return;
    }

    if (!user?._id) {
      Alert.alert(t('error'), 'ID de usuario inválido o ausente.');
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
        favoriteCategories,
        avatar: user.avatar,
      };

      const response = await api.put(`/usuarios/${user._id}`, payload);
      if (response.status === 200) {
        const updatedUserData = response.data?.data || response.data;

        setUser(updatedUserData);
        setIsEditing(false);
        if (isMyProfile) {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        }
        Alert.alert(t('success'), t('profile_success_update'));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error.response?.data || error.message);
      Alert.alert(t('error'), error.response?.data?.message || t('profile_err_fields'));
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
      console.error('Error deleting profile (soft):', error);
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
      console.error('Error deleting profile (permanent):', error);
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
        <Text variant="bodyLarge" style={{ color: '#666' }}>
          {t('profile_err_loading')}
        </Text>
        <Button mode="contained" onPress={fetchProfile} style={{ marginTop: 20 }}>
          {t('retry')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.header}>
        <View style={{ position: 'relative' }}>
          {user.avatar ? (
            <Avatar.Image size={80} source={{ uri: user.avatar }} />
          ) : (
            <Avatar.Text
              size={80}
              label={(name || 'U').substring(0, 2).toUpperCase()}
              style={{ backgroundColor: '#D183BA' }}
            />
          )}
          {uploadingAvatar && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color="#D183BA" />
            </View>
          )}
          {isMyProfile && !uploadingAvatar && (
            <TouchableOpacity
              onPress={handleUploadAvatar}
              style={{
                position: 'absolute',
                bottom: 0,
                right: -10,
                backgroundColor: '#fff',
                borderRadius: 15,
                width: 30,
                height: 30,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#ccc',
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,
              }}
            >
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text variant="headlineMedium" style={[globalStyles.title, { marginTop: 10 }]}>
          {isEditing ? t('profile_title') : name || t('loading')}
        </Text>
        {stats.totalReviews > 0 && (
          <View style={styles.ratingRow}>
            <Text variant="titleMedium" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
              {'★'.repeat(Math.max(0, Math.round(stats.averageRating || 0)))}
              {'☆'.repeat(Math.max(0, 5 - Math.round(stats.averageRating || 0)))}{' '}
              {stats.averageRating || 0}
            </Text>
            <Text variant="bodySmall" style={{ marginLeft: 5, color: '#666' }}>
              ({stats.totalReviews} {t('reviews_header').toLowerCase()})
            </Text>
          </View>
        )}

        <View style={styles.ratingRow}>
          <Text variant="bodyMedium" style={{ color: '#666', marginTop: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>{followers.length}</Text>{' '}
            {t('followers', { defaultValue: 'Seguidores' })}
          </Text>
        </View>

        <Text
          style={{
            color: '#7c3aed',
            fontWeight: 'bold',
            margin: 10,
            textAlign: 'center',
            fontSize: 13,
          }}
        >
          {debugText}
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

              <Text
                variant="titleMedium"
                style={{ marginTop: 15, marginBottom: 5, color: '#D183BA', fontWeight: 'bold' }}
              >
                Favoritos
              </Text>

              <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>
                {t('fav_authors')}
              </Text>
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
                      setNewAuthor('');
                    }
                  }}
                  disabled={favoriteAuthors.length >= 5 || !newAuthor.trim()}
                  style={{ marginLeft: 10 }}
                  buttonColor="#D183BA"
                >
                  +
                </Button>
              </View>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginBottom: 10 }}
              >
                {favoriteAuthors.map((author, index) => (
                  <Chip
                    key={index}
                    style={{ margin: 2 }}
                    onClose={() =>
                      setFavoriteAuthors(favoriteAuthors.filter((_, i) => i !== index))
                    }
                  >
                    {author}
                  </Chip>
                ))}
              </View>

              <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>
                {t('fav_books')}
              </Text>
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
                      setNewBook('');
                    }
                  }}
                  disabled={favoriteBooks.length >= 5 || !newBook.trim()}
                  style={{ marginLeft: 10 }}
                  buttonColor="#D183BA"
                >
                  +
                </Button>
              </View>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginBottom: 10 }}
              >
                {favoriteBooks.map((book, index) => (
                  <Chip
                    key={index}
                    style={{ margin: 2 }}
                    onClose={() => setFavoriteBooks(favoriteBooks.filter((_, i) => i !== index))}
                  >
                    {book}
                  </Chip>
                ))}
              </View>

              <Text variant="labelLarge" style={{ marginTop: 10, color: '#666' }}>
                {t('fav_categories')}
              </Text>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCategoryMenuVisible(true)}
                    style={{ marginTop: 5, borderColor: '#ccc' }}
                    textColor="#333"
                  >
                    {t('select_categories')}
                  </Button>
                }
              >
                {ALL_CATEGORIES.map((cat) => (
                  <Menu.Item
                    key={cat}
                    title={cat}
                    trailingIcon={favoriteCategories.includes(cat) ? 'check' : undefined}
                    onPress={() => {
                      if (favoriteCategories.includes(cat)) {
                        setFavoriteCategories(favoriteCategories.filter((c) => c !== cat));
                      } else {
                        setFavoriteCategories([...favoriteCategories, cat]);
                      }
                    }}
                  />
                ))}
              </Menu>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {favoriteCategories.map((cat) => (
                  <Chip
                    key={cat}
                    style={{ margin: 2 }}
                    onClose={() =>
                      setFavoriteCategories(favoriteCategories.filter((c) => c !== cat))
                    }
                  >
                    {cat}
                  </Chip>
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
                    setDescription(user.description || '');
                    setFavoriteAuthors(user.favoriteAuthors || []);
                    setFavoriteBooks(user.favoriteBooks || []);
                    setFavoriteCategories(user.favoriteCategories || []);
                    setNewAuthor('');
                    setNewBook('');
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
                <Text variant="labelLarge" style={styles.label}>
                  {t('profile_name_label')}
                </Text>
                <Text variant="bodyLarge">{user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge" style={styles.label}>
                  {t('profile_email_label')}
                </Text>
                <Text variant="bodyLarge">{user.email}</Text>
              </View>
              <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text variant="labelLarge" style={[styles.label, { marginBottom: 5 }]}>
                  {t('about_me_label')}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#444' }}>
                  {user.description || 'Sin descripción'}
                </Text>
              </View>

              {((Array.isArray(user.favoriteAuthors) && user.favoriteAuthors.length > 0) ||
                (Array.isArray(user.favoriteBooks) && user.favoriteBooks.length > 0) ||
                (Array.isArray(user.favoriteCategories) && user.favoriteCategories.length > 0)) && (
                <View style={{ marginTop: 20 }}>
                  <Text
                    variant="titleMedium"
                    style={{ color: '#D183BA', fontWeight: 'bold', marginBottom: 10 }}
                  >
                    Favoritos
                  </Text>

                  {Array.isArray(user.favoriteAuthors) && user.favoriteAuthors.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text variant="labelLarge" style={styles.label}>
                        {t('fav_authors')}
                      </Text>
                      <Text variant="bodyMedium">{user.favoriteAuthors.join(', ')}</Text>
                    </View>
                  )}

                  {Array.isArray(user.favoriteBooks) && user.favoriteBooks.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text variant="labelLarge" style={styles.label}>
                        {t('fav_books')}
                      </Text>
                      <Text variant="bodyMedium">{user.favoriteBooks.join(', ')}</Text>
                    </View>
                  )}

                  {Array.isArray(user.favoriteCategories) && user.favoriteCategories.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text variant="labelLarge" style={styles.label}>
                        {t('fav_categories')}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
                        {user.favoriteCategories.map((cat: string) => (
                          <Chip key={cat} style={{ margin: 2 }}>
                            {cat}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {isMyProfile ? (
                <View style={{ marginTop: 20 }}>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Retos' as never)}
                    buttonColor="#D183BA"
                    textColor="#fff"
                    style={{ marginBottom: 10 }}
                    icon={() => <Text style={{ fontSize: 16 }}>🏆</Text>}
                  >
                    {t('retos_title', 'Mis Retos')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('Settings')}
                    textColor="#D183BA"
                    style={{ borderColor: '#D183BA', marginBottom: 10 }}
                    icon={() => <Text style={{ fontSize: 16 }}>⚙️</Text>}
                  >
                    {t('accessibility_settings')}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => setIsEditing(true)}
                    textColor="#D183BA"
                    style={{ borderColor: '#D183BA', marginBottom: 10 }}
                  >
                    {t('profile_edit_btn')}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={logout}
                    textColor="#ef4444"
                    style={{ borderColor: '#ef4444' }}
                    icon={() => <Text style={{ fontSize: 16 }}>🚪</Text>}
                  >
                    {t('logout')}
                  </Button>
                </View>
              ) : (
                <View style={{ marginTop: 20 }}>
                  <Button
                    mode={myFollowingUsers.includes(userId) ? 'outlined' : 'contained'}
                    onPress={toggleFollow}
                    loading={updating}
                    buttonColor={myFollowingUsers.includes(userId) ? undefined : '#D183BA'}
                    textColor={myFollowingUsers.includes(userId) ? '#D183BA' : '#fff'}
                    style={{ borderColor: '#D183BA', marginBottom: 10 }}
                  >
                    {myFollowingUsers.includes(userId)
                      ? t('unfollow', 'Siguiendo')
                      : t('follow', 'Seguir')}
                  </Button>

                  {myFollowingUsers.includes(userId) ? (
                    <Button
                      mode={notificationsEnabled ? 'contained' : 'outlined'}
                      onPress={toggleNotifications}
                      loading={loadingNotifications}
                      buttonColor={notificationsEnabled ? '#D183BA' : undefined}
                      textColor={notificationsEnabled ? '#fff' : '#D183BA'}
                      style={{ borderColor: '#D183BA', marginBottom: 10 }}
                      icon={notificationsEnabled ? 'bell' : 'bell-outline'}
                    >
                      {notificationsEnabled
                        ? 'Desactivar notificaciones'
                        : 'Activar notificaciones'}
                    </Button>
                  ) : (
                    <Button mode="outlined" disabled style={{ marginBottom: 10 }}>
                      Sigue a este usuario para activar notificaciones
                    </Button>
                  )}
                </View>
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
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="labelLarge" style={{ color: '#D183BA' }}>
                    {rev.usuarioAutor?.name}
                  </Text>
                  <Text variant="labelMedium" style={{ color: '#f59e0b' }}>
                    {'★'.repeat(Math.max(0, rev.puntuacion || 0))}
                    {'☆'.repeat(Math.max(0, 5 - (rev.puntuacion || 0)))}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: '#999', marginBottom: 5 }}>
                  {rev.libro?.title || ''}
                  {rev.tipoOperacion ? ` (${rev.tipoOperacion.toLowerCase()})` : ''}
                </Text>
                {rev.comentario ? <Text variant="bodyMedium">{rev.comentario}</Text> : null}
                <Text
                  variant="bodySmall"
                  style={{ alignSelf: 'flex-end', color: '#ccc', marginTop: 5 }}
                >
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
    flex: 1,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    color: '#666',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
