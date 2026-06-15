import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Text as RNText,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  Menu,
  Divider,
  IconButton,
  Chip,
  useTheme,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getSentReservations } from '../services/reserva';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };
  const theme = useTheme();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(false);
  const [page, setPage] = useState(1);
  const [requestedBookIds, setRequestedBookIds] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 5;

  // New Chat/Requests states
  const [userId, setUserId] = useState<string | null>(null);
  const [msgRequests, setMsgRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<any>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/usuarios/favoritos');
      // response.data.data is the array of populated books
      const favList = response.data?.data || response.data || [];
      setBooks(favList);

      try {
        const reservations = await getSentReservations();
        const pendingBookIds = reservations
          .filter((reservation) => ['PENDIENTE', 'ACEPTADA'].includes(reservation.estado))
          .map((reservation) =>
            typeof reservation.libro === 'string'
              ? reservation.libro
              : String(reservation.libro._id || ''),
          )
          .filter(Boolean);
        setRequestedBookIds(pendingBookIds);
      } catch (resErr) {
        console.error('Error fetching reservations:', resErr);
      }

      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setUserId(u._id);

          const reqResponse = await api.get('/message-requests/sent');
          setMsgRequests(reqResponse.data?.data || reqResponse.data || []);

          const chatsResponse = await api.get('/chats');
          setActiveChats(chatsResponse.data?.data || chatsResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching user info/chats/requests:', err);
      }
    } catch (error) {
      console.error('Error fetching favorite books:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  const openMenu = (id: string) => setMenuVisible(id);
  const closeMenu = () => setMenuVisible(null);

  const handleTalkToSeller = (book: any) => {
    closeMenu();

    const ownerId = book.owner?._id || book.owner;
    if (userId && userId === ownerId) {
      showAlert(t('error'), 'No puedes hablar contigo mismo.');
      return;
    }

    const chat = activeChats.find((c: any) => c.libro === book._id || c.libro?._id === book._id);
    if (chat) {
      navigation.navigate('ChatRoom', { chatId: chat._id });
      return;
    }

    const pending = msgRequests.find(
      (r: any) => (r.book === book._id || r.book?._id === book._id) && r.status === 'pending',
    );
    if (pending) {
      showAlert(
        'Solicitud enviada',
        'Ya tienes una solicitud de mensaje pendiente para este libro.',
      );
      return;
    }

    setSelectedBookForRequest(book);
    setInitialMessage('');
    setRequestModalVisible(true);
  };

  const handleSendRequest = async () => {
    if (!selectedBookForRequest) return;
    setSendingRequest(true);
    try {
      await api.post('/message-requests', {
        bookId: selectedBookForRequest._id,
        initialMessage: initialMessage.trim(),
      });
      showAlert('Solicitud enviada', 'Tu solicitud de mensaje ha sido enviada al vendedor.');
      setRequestModalVisible(false);

      const reqResponse = await api.get('/message-requests/sent');
      setMsgRequests(reqResponse.data?.data || reqResponse.data || []);
    } catch (error: any) {
      console.error('Error sending message request:', error);
      const msg = error.response?.data?.message || 'No se pudo enviar la solicitud de mensaje.';
      showAlert('Error', msg);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBuyOrRentDirectly = async (book: any) => {
    closeMenu();
    try {
      const endpoint =
        book.type === 'VENTA' ? `/libros/buy/${book._id}` : `/libros/rent/${book._id}`;
      await api.post(endpoint);
      showAlert(
        t('success'),
        `${book.type === 'VENTA' ? t('buy_action') : t('rent_action')}: ${book.title}`,
      );
      fetchFavorites();
    } catch (error) {
      console.error('Error in direct purchase/rental:', error);
      showAlert(t('error'), 'No se pudo completar la operación');
    }
  };

  const handleReserveBook = async (book: any) => {
    try {
      await api.post('/reservas', { libroId: book._id });
      setRequestedBookIds((prev) => [...prev, book._id]);
      showAlert('Solicitud enviada', 'Se ha solicitado la reserva correctamente.');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'No se pudo realizar la reserva';
      showAlert('Error', String(msg));
    }
  };

  const handleToggleFavorite = async (bookId: string) => {
    try {
      // Optimistic update
      setBooks((prev) => prev.filter((b) => b._id !== bookId));

      await api.put(`/usuarios/favoritos/${bookId}`);

      // Update local storage user data as well
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.favoritos) {
          user.favoritos = user.favoritos.filter((id: string) => id !== bookId);
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      showAlert(t('error'), 'No se pudo quitar de favoritos.');
      fetchFavorites();
    }
  };

  const renderBookItem = ({ item: book }: { item: any }) => {
    const hasPending = msgRequests.some(
      (r: any) => (r.book === book._id || r.book?._id === book._id) && r.status === 'pending',
    );

    return (
      <Card style={isGridView ? styles.gridCard : styles.listCard}>
        <Card.Content style={isGridView ? styles.gridCardContent : undefined}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text
              variant={isGridView ? 'titleMedium' : 'titleLarge'}
              numberOfLines={2}
              style={[styles.bookTitle, { flex: 1 }]}
            >
              {book.title}
            </Text>
            <IconButton
              icon="heart"
              iconColor="#ef4444"
              size={24}
              onPress={() => handleToggleFavorite(book._id)}
              style={{ margin: 0 }}
            />
          </View>

          {book.isReserved && (
            <Chip style={styles.reservedBadge} textStyle={styles.reservedBadgeText}>
              {t('reserved', 'Reservado')}
            </Chip>
          )}
          {!isGridView && (
            <>
              <Text variant="bodyMedium" style={{ marginTop: book.isReserved ? 6 : 0 }}>
                {t('isbn_label')}: {book.isbn}
              </Text>
              {book.autor ? (
                <Text variant="bodyMedium">
                  {t('author_label')}: {book.autor}
                </Text>
              ) : null}
              {book.categoria ? (
                <Text variant="bodyMedium">Categoría: {book.categoria}</Text>
              ) : null}
              <Text variant="bodyMedium">
                {t('state_label')}: {book.estado}
              </Text>
              <Text variant="bodySmall" style={styles.typeTag}>
                {book.type}
              </Text>
            </>
          )}

          {/* Attribution Section */}
          <View style={styles.uploaderSection}>
            <Text variant="bodySmall" style={styles.uploaderLabel}>
              {t('uploaded_by')}
            </Text>
            <RNText
              style={styles.uploaderName}
              onPress={() =>
                navigation.navigate('UserProfile', { userId: book.owner?._id || book.owner })
              }
            >
              {book.owner?.name || t('unknown')}
            </RNText>
          </View>

          <Text variant="titleMedium" style={styles.price}>
            {book.precio}€
          </Text>
        </Card.Content>
        <View style={styles.cardButtons}>
          <Menu
            visible={menuVisible === book._id}
            onDismiss={closeMenu}
            anchor={
              <Button
                mode="contained"
                buttonColor={book.isReserved ? '#f59e0b' : '#D183BA'}
                onPress={() => openMenu(book._id)}
                style={styles.actionButton}
                compact
                labelStyle={{ fontSize: isGridView ? 10 : 12 }}
              >
                {book.isReserved
                  ? t('reserved', 'Reservado')
                  : book.type === 'VENTA'
                    ? t('buy_action')
                    : t('rent_action')}
              </Button>
            }
            contentStyle={{ backgroundColor: 'white' }}
          >
            <Menu.Item
              onPress={() => handleTalkToSeller(book)}
              title={hasPending ? 'Solicitud enviada' : t('talk_to_seller')}
              disabled={hasPending}
              leadingIcon={() => <RNText style={{ fontSize: 18 }}>💬</RNText>}
            />
            {!book.isReserved && (
              <>
                <Divider />
                <Menu.Item
                  onPress={() => handleBuyOrRentDirectly(book)}
                  title={book.type === 'VENTA' ? t('buy_directly') : t('rent_directly')}
                  leadingIcon={() => <RNText style={{ fontSize: 18 }}>💰</RNText>}
                />
              </>
            )}
          </Menu>
          {!book.isReserved && (
            <Button
              mode="outlined"
              onPress={() => handleReserveBook(book)}
              textColor={theme.colors.primary}
              style={[
                styles.actionButton,
                !requestedBookIds.includes(book._id) && { borderColor: theme.colors.primary },
              ]}
              compact
              labelStyle={{ fontSize: isGridView ? 10 : 12 }}
              disabled={requestedBookIds.includes(book._id)}
            >
              {requestedBookIds.includes(book._id)
                ? 'Reserva solicitada'
                : t('request_reserve', 'Solicitar reserva')}
            </Button>
          )}
        </View>
      </Card>
    );
  };

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE);
  const paginatedBooks = books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderFooter = () => {
    if (books.length <= ITEMS_PER_PAGE) return null;
    return (
      <View style={styles.paginationContainer}>
        <Button disabled={page === 1} onPress={() => setPage(page - 1)}>
          Anterior
        </Button>
        <RNText style={styles.pageText}>
          Página {page} de {totalPages}
        </RNText>
        <Button disabled={page === totalPages} onPress={() => setPage(page + 1)}>
          Siguiente
        </Button>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="headlineMedium" style={styles.header}>
          {t('favorites_title', 'Mis Favoritos')}
        </Text>
        <IconButton
          icon={isGridView ? 'view-list' : 'view-grid'}
          iconColor="#D183BA"
          size={28}
          onPress={() => setIsGridView(!isGridView)}
        />
      </View>

      <FlatList
        key={isGridView ? 'grid' : 'list'}
        data={paginatedBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        numColumns={isGridView ? 2 : 1}
        columnWrapperStyle={isGridView ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t('no_favorites', 'No tienes ningún libro en tus favoritos todavía.')}
          </Text>
        }
        ListFooterComponent={renderFooter}
      />

      <Portal>
        <Modal
          visible={requestModalVisible}
          onDismiss={() => !sendingRequest && setRequestModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 24,
            margin: 20,
            borderRadius: 16,
          }}
        >
          <Text
            variant="headlineSmall"
            style={{ fontWeight: 'bold', marginBottom: 12, color: '#333' }}
          >
            Hablar con el vendedor
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
            {`Escribe un mensaje de presentación para el libro "${selectedBookForRequest?.title}":`}
          </Text>
          <TextInput
            label="Mensaje inicial"
            placeholder="Hola, me interesa tu libro..."
            value={initialMessage}
            onChangeText={setInitialMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={{ marginBottom: 20, height: 100 }}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onPress={() => setRequestModalVisible(false)}
              disabled={sendingRequest}
              textColor="#666"
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSendRequest}
              loading={sendingRequest}
              disabled={sendingRequest}
              buttonColor="#D183BA"
            >
              Enviar Solicitud
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 12,
  },
  listCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#white',
  },
  gridCard: {
    width: (width - 40) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#white',
  },
  gridCardContent: {
    padding: 12,
    height: 120,
  },
  cardButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    width: 150,
  },
  bookTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    marginTop: 5,
    color: '#D183BA',
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  uploaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  uploaderLabel: {
    color: '#777',
    fontSize: 12,
  },
  uploaderName: {
    color: '#D183BA',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 12,
    marginLeft: 3,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  pageText: {
    marginHorizontal: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  reservedBadge: {
    backgroundColor: '#f59e0b',
    alignSelf: 'flex-start',
    marginTop: 8,
    height: 28,
  },
  reservedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeTag: {
    color: '#D183BA',
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
