import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, Text as RNText, Platform, TouchableOpacity } from 'react-native';
import { Card, Button, Avatar, SegmentedButtons, Portal, Modal, TextInput, ProgressBar, IconButton, Menu, Searchbar, TouchableRipple } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyBooksScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<any[]>([]);
  const [rentedBooks, setRentedBooks] = useState<any[]>([]);
  const [reservedReservations, setReservedReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('uploaded');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // New Chat/Requests states
  const [userId, setUserId] = useState<string | null>(null);
  const [msgRequests, setMsgRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<any>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Filters Modal Draft States
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterCategoryType, setFilterCategoryType] = useState('uploaded'); // uploaded, bought, rented
  const [filterBookCategory, setFilterBookCategory] = useState('all'); // all, Terror, Misterio, etc.
  const [modalCategoryMenuVisible, setModalCategoryMenuVisible] = useState(false);

  const handleApplyFilters = () => {
    setCategory(filterCategoryType);
    setSelectedCategory(filterBookCategory);
    setIsFilterModalVisible(false);
  };

  React.useEffect(() => {
    setPage(1);
  }, [category, searchQuery, selectedCategory]);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAutor, setEditAutor] = useState('');
  const [editIsbn, setEditIsbn] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editState, setEditState] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Rating Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [targetBook, setTargetBook] = useState<any>(null);
  const [targetReservationId, setTargetReservationId] = useState<string | null>(null);
  const [targetOwnerId, setTargetOwnerId] = useState<string | null>(null);
  const [targetOwnerName, setTargetOwnerName] = useState<string | null>(null);
  const [sentRatings, setSentRatings] = useState<any[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchMyBooks = async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data?.data || response.data;
      if (userData) {
        setUploadedBooks(userData.libros || []);
        setBoughtBooks(userData.boughtLibros || []);
        setRentedBooks(userData.rentedLibros || []);
      }

      const reservationsResponse = await api.get('/reservas/solicitadas');
      const resData = reservationsResponse.data?.data || reservationsResponse.data;
      const accepted = Array.isArray(resData) 
        ? resData.filter((r: any) => r.estado === 'ACEPTADA') 
        : [];
      setReservedReservations(accepted);

      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setUserId(u._id);
          
          const reqResponse = await api.get('/message-requests/sent');
          setMsgRequests(reqResponse.data?.data || reqResponse.data || []);

          const chatsResponse = await api.get('/chats');
          setActiveChats(chatsResponse.data?.data || chatsResponse.data || []);

          const ratingsResponse = await api.get('/valoraciones/sent');
          setSentRatings(ratingsResponse.data?.data || ratingsResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching chats/requests/ratings in MyBooksScreen:', err);
      }
    } catch (error) {
      console.error('Error fetching my books:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTalkToSeller = async (book: any) => {
    if (!book) return;
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

    const pending = msgRequests.find((r: any) => (r.book === book._id || r.book?._id === book._id) && r.status === 'pending');
    if (pending) {
      showAlert('Solicitud enviada', 'Ya tienes una solicitud de mensaje pendiente para este libro.');
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
        initialMessage: initialMessage.trim()
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

  useFocusEffect(
    useCallback(() => {
      fetchMyBooks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBooks();
  };

  const handleEditPress = (book: any) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAutor(book.autor || '');
    setEditIsbn(book.isbn);
    setEditPrice(book.precio.toString());
    setEditState(book.estado);
    setEditModalVisible(true);
  };

  const performDelete = async () => {
    setUpdating(true);
    try {
      await api.delete(`/libros/${editingBook._id}`);
      setEditModalVisible(false);
      fetchMyBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      showAlert(t('error'), t('profile_err_update') || 'No se pudo eliminar el libro.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBook = () => {
    const isWeb = Platform.OS === 'web';
    const message = t('delete_book_confirm') || '¿Seguro que quieres eliminar este libro? Esta acción no se puede deshacer.';

    if (isWeb) {
      if (window.confirm(message)) {
        performDelete();
      }
    } else {
      Alert.alert(
        t('delete_book') || 'Eliminar libro',
        message,
        [
          { text: t('cancel') || 'Cancelar', style: 'cancel' },
          {
            text: t('delete') || 'Eliminar',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const handleUpdateBook = async () => {
    if (!editTitle || !editIsbn || !editPrice || !editState) {
      showAlert(t('error'), t('err_missing_fields'));
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/libros/${editingBook._id}`, {
        title: editTitle,
        autor: editAutor,
        isbn: editIsbn,
        precio: parseFloat(editPrice),
        estado: editState,
        type: editingBook.type // Keep original type
      });
      showAlert(t('success'), t('profile_success_update'));
      setEditModalVisible(false);
      fetchMyBooks();
    } catch (error) {
      console.error('Error updating book:', error);
      showAlert(t('error'), t('profile_err_update'));
    } finally {
      setUpdating(false);
    }
  };

  const renderRentalStatus = (book: any) => {
    if (!book.rentalStartDate || !book.rentalEndDate) return null;

    const start = new Date(book.rentalStartDate).getTime();
    const end = new Date(book.rentalEndDate).getTime();
    const now = new Date().getTime();

    let progress = 0;
    let statusText = "";

    if (now < start) {
      progress = 0;
      const notStartedTrans = t('rental_not_started');
      statusText = notStartedTrans && notStartedTrans !== 'rental_not_started' ? notStartedTrans : "El alquiler todavía no ha empezado";
    } else if (now > end) {
      progress = 1;
      const finishedTrans = t('rental_finished');
      statusText = finishedTrans && finishedTrans !== 'rental_finished' ? finishedTrans : "Alquiler finalizado";
    } else {
      const total = end - start;
      const elapsed = now - start;
      progress = elapsed / total;
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      const remainingTrans = t('rental_days_remaining');
      statusText = (remainingTrans && remainingTrans !== 'rental_days_remaining' ? remainingTrans : "Quedan X días de alquiler").replace('X', daysRemaining.toString());
    }

    return (
      <View style={styles.rentalStatusContainer}>
        <Text variant="bodySmall" style={styles.rentalDates}>
          {new Date(book.rentalStartDate).toLocaleDateString()} - {new Date(book.rentalEndDate).toLocaleDateString()}
        </Text>
        <ProgressBar progress={progress} color="#D183BA" style={styles.progressBar} />
        <Text variant="labelMedium" style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  const handleRateSeller = (book: any) => {
    setTargetBook(book);
    setTargetReservationId(null);
    setTargetOwnerId(book.owner?._id || book.owner || null);
    setTargetOwnerName(book.owner?.name || null);
    setRatingValue(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const handleRateReservation = (reserva: any) => {
    setTargetBook(reserva.libro);
    setTargetReservationId(reserva._id);
    setTargetOwnerId(reserva.propietario?._id || reserva.propietario || null);
    setTargetOwnerName(reserva.propietario?.name || null);
    setRatingValue(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const alreadyRated = (bookId: string, type: string, reservationId?: string) => {
    if (reservationId) {
      return sentRatings.some((r: any) => {
        const rResId = r.reservationId && typeof r.reservationId === 'object' ? r.reservationId._id : r.reservationId;
        return rResId && rResId.toString() === reservationId.toString();
      });
    }
    return sentRatings.some((r: any) => {
      const rLibroId = r.libro && typeof r.libro === 'object' ? r.libro._id : r.libro;
      return rLibroId && rLibroId.toString() === bookId.toString();
    });
  };

  const submitRating = async () => {
    if (!targetBook) {
      showAlert(t('error'), 'No se pudo identificar el libro');
      return;
    }

    if (ratingValue < 1 || ratingValue > 5) {
      showAlert(t('error'), t('rating_error'));
      return;
    }

    setSubmittingRating(true);
    try {
      const ownerId = targetOwnerId;

      if (!ownerId) {
        showAlert(t('error'), 'Este libro no tiene un vendedor registrado para valorar.');
        setSubmittingRating(false);
        return;
      }
      
      const payload: any = {
        usuarioValorado: ownerId,
        libro: targetBook._id,
        tipoOperacion: targetReservationId ? 'RESERVA' : targetBook.type, // Should be VENTA, ALQUILER or RESERVA
        puntuacion: ratingValue,
        comentario: ratingComment
      };

      if (targetReservationId) {
        payload.reservationId = targetReservationId;
      }

      console.log('Sending rating payload:', payload);
      
      const response = await api.post('/valoraciones', payload);
      console.log('Rating response:', response.data);
      
      showAlert(t('success'), t('rating_success'));
      setRatingModalVisible(false);

      // Refresh sent ratings list immediately
      const ratingsResponse = await api.get('/valoraciones/sent');
      setSentRatings(ratingsResponse.data?.data || ratingsResponse.data || []);

      // Refresh my books to sync any state
      fetchMyBooks();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      
      // Robust error message extraction (extracts Joi validation errors and custom messages)
      let msg = t('rating_error');
      if (error.response?.data) {
        const resData = error.response.data;
        if (resData.message) {
          msg = resData.message;
        } else if (resData.error?.message) {
          msg = resData.error.message;
        } else if (resData.error?.details && Array.isArray(resData.error.details)) {
          msg = resData.error.details.map((d: any) => d.message).join(', ');
        }
      } else if (error.message) {
        msg = error.message;
      }
      
      // Handle MongoDB Duplicate Key Error (11000) or generic backend string errors that indicate duplicates
      if (msg.includes('11000') || msg.toLowerCase().includes('duplicate') || error.response?.data?.error?.code === 11000) {
        msg = 'Ya has valorado a este usuario por este libro.';
      }
      
      showAlert(t('error'), msg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const getFilteredBooks = () => {
    let baseBooks: any[] = [];
    if (category === 'uploaded') baseBooks = uploadedBooks;
    else if (category === 'bought') baseBooks = boughtBooks;
    else if (category === 'rented') baseBooks = rentedBooks;
    else if (category === 'reserved') baseBooks = reservedReservations;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      baseBooks = baseBooks.filter((item) => {
        const book = category === 'reserved' ? item.libro : item;
        if (!book) return false;
        const titleMatch = book.title?.toLowerCase().includes(query);
        const autorMatch = book.autor?.toLowerCase().includes(query);
        const isbnMatch = book.isbn?.toLowerCase().includes(query);
        return titleMatch || autorMatch || isbnMatch;
      });
    }

    // Filter by category dropdown
    if (selectedCategory && selectedCategory !== 'all') {
      baseBooks = baseBooks.filter((item) => {
        const book = category === 'reserved' ? item.libro : item;
        if (!book) return false;
        return book.categoria?.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    return baseBooks;
  };

  const renderContent = () => {
    const currentBooks = getFilteredBooks();

    if (currentBooks.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>{t('no_books')}</Text>
          </Card.Content>
        </Card>
      );
    }

    const paginatedBooks = currentBooks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (category === 'reserved') {
      return paginatedBooks.map((res: any) => (
        <Card key={res._id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={styles.bookTitle}>{res.libro?.title}</Text>
                {res.libro?.autor ? <Text variant="bodyMedium" style={styles.bookDetails}>{t('author_label')}: {res.libro.autor}</Text> : null}
                <Text variant="bodyMedium" style={styles.bookDetails}>{t('isbn_label')}: {res.libro?.isbn}</Text>
                <Text variant="bodyMedium" style={styles.bookDetails}>
                  Vendedor: {res.propietario?.name || 'Desconocido'}
                </Text>
                <Text variant="bodyMedium" style={[styles.bookDetails, { fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }]}>
                  Fecha Límite: {res.fechaLimite ? new Date(res.fechaLimite).toLocaleDateString() : 'Sin fecha'}
                </Text>
                <Text variant="bodyMedium" style={styles.bookDetails}>
                  Estado de Reserva: {res.estado}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.typeText, { color: '#d97706' }]}>RESERVADO</Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
              icon={() => <RNText style={{ fontSize: 16 }}>💬</RNText>}
              mode="contained" 
              onPress={() => handleTalkToSeller(res.libro)}
              style={{ backgroundColor: '#D183BA' }}
            >
              {t('talk_to_seller')}
            </Button>
            {!alreadyRated('', '', res._id) && (
              <Button 
                icon={() => <RNText style={{ fontSize: 16 }}>⭐</RNText>}
                mode="contained" 
                onPress={() => handleRateReservation(res)}
                style={{ backgroundColor: '#f59e0b', marginLeft: 8 }}
              >
                {t('rating_title')}
              </Button>
            )}
          </Card.Actions>
        </Card>
      ));
    }

    return paginatedBooks.map((book: any) => (
      <Card key={book._id} style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" style={styles.bookTitle}>{book.title}</Text>
              {book.autor ? <Text variant="bodyMedium" style={styles.bookDetails}>{t('author_label')}: {book.autor}</Text> : null}
              <Text variant="bodyMedium" style={styles.bookDetails}>{t('isbn_label')}: {book.isbn}</Text>
              <Text variant="bodyMedium" style={styles.bookDetails}>{t('state_label')}: {book.estado}</Text>
              {(category === 'bought' || category === 'rented') && book.owner && (
                <Text variant="bodySmall" style={{ color: '#888', marginTop: 4 }}>
                  {t('uploaded_by')} {book.owner.name}
                </Text>
              )}
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{book.type}</Text>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.price}>{t('price_label')}: {book.precio}€</Text>
          
          {category === 'rented' && renderRentalStatus(book)}
        </Card.Content>
        <Card.Actions>
          {category === 'uploaded' ? (
            <Button 
              icon={() => <RNText style={{ fontSize: 16 }}>✏️</RNText>}
              mode="outlined" 
              onPress={() => handleEditPress(book)}
              style={styles.editButton}
              textColor="#D183BA"
            >
              {t('edit')}
            </Button>
          ) : (
            !alreadyRated(book._id, book.type) && (
              <Button 
                icon={() => <RNText style={{ fontSize: 16 }}>⭐</RNText>}
                mode="contained" 
                onPress={() => handleRateSeller(book)}
                style={{ backgroundColor: '#f59e0b' }}
              >
                {t('rating_title')}
              </Button>
            )
          )}
        </Card.Actions>
      </Card>
    ));
  };

  const renderFooter = () => {
    const currentBooks = getFilteredBooks();
    if (currentBooks.length <= ITEMS_PER_PAGE) return null;
    
    const totalPages = Math.ceil(currentBooks.length / ITEMS_PER_PAGE);

    return (
      <View style={styles.paginationContainer}>
        <Button 
          disabled={page === 1} 
          onPress={() => setPage(page - 1)}
        >
          Anterior
        </Button>
        <RNText style={styles.pageText}>Página {page} de {totalPages}</RNText>
        <Button 
          disabled={page === totalPages} 
          onPress={() => setPage(page + 1)}
        >
          Siguiente
        </Button>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5EBF4' }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D183BA"]} />
        }
      >
        <View style={styles.headerContainer}>
          <RNText style={{ fontSize: 32 }}>📚</RNText>
          <Text variant="headlineMedium" style={styles.header}>{t('my_books')}</Text>
        </View>

        <Searchbar
          placeholder={t('search_placeholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon={() => <RNText style={{ fontSize: 20 }}>🔍</RNText>}
          right={(props) => (
            <IconButton
              {...props}
              icon="tune"
              iconColor="#D183BA"
              size={24}
              onPress={() => {
                setFilterCategoryType(category);
                setFilterBookCategory(selectedCategory);
                setIsFilterModalVisible(true);
              }}
            />
          )}
        />

        <SegmentedButtons
          value={category}
          onValueChange={(val) => {
            setCategory(val);
            setPage(1);
          }}
          buttons={[
            { value: 'uploaded', label: t('uploaded', 'Subidos'), checkedColor: '#fff', uncheckedColor: '#555' },
            { value: 'bought', label: t('bought', 'Comprados'), checkedColor: '#fff', uncheckedColor: '#555' },
            { value: 'rented', label: t('rented', 'Alquilados'), checkedColor: '#fff', uncheckedColor: '#555' },
            { value: 'reserved', label: t('reserved', 'Reservados'), checkedColor: '#fff', uncheckedColor: '#555' },
          ]}
          style={styles.segmented}
          theme={{ colors: { secondaryContainer: '#D183BA', onSecondaryContainer: '#ffffff' } }}
        />

        {renderContent()}
        {renderFooter()}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
        {/* Filter Modal */}
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Filtros</Text>
          
          <Text style={styles.labelModal}>Ver libros:</Text>
          <SegmentedButtons
            value={filterCategoryType}
            onValueChange={setFilterCategoryType}
            buttons={[
              { value: 'uploaded', label: t('uploaded') },
              { value: 'bought', label: t('bought') },
              { value: 'rented', label: t('rented') },
              { value: 'reserved', label: t('reserved') },
            ]}
            style={styles.segmented}
            theme={{ colors: { secondaryContainer: '#ffffff', onSecondaryContainer: '#D6AED2' } }}
          />

          <Text style={styles.labelModal}>Categoría:</Text>
          <Menu
            visible={modalCategoryMenuVisible}
            onDismiss={() => setModalCategoryMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setModalCategoryMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Categoría"
                    value={filterBookCategory === 'all' ? 'Todas' : filterBookCategory}
                    style={styles.modalInput}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                    outlineColor="#D183BA"
                    activeOutlineColor="#D183BA"
                  />
                </View>
              </TouchableRipple>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilterBookCategory('all');
                setModalCategoryMenuVisible(false);
              }}
              title="Todas"
            />
            {['Terror', 'Misterio', 'Aventura', 'Juvenil', 'Policíaco', 'Infantil', 'Autoayuda', 'Novela', 'Biografías', 'Cómics', 'Otros'].map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setFilterBookCategory(cat);
                  setModalCategoryMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

          <Button 
            mode="contained" 
            onPress={handleApplyFilters}
            buttonColor="#D183BA"
            style={{ marginTop: 24 }}
          >
            Aplicar Filtros
          </Button>
        </Modal>

        <Modal
          visible={editModalVisible}
          onDismiss={() => !updating && setEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>{t('edit_book_title')}</Text>
          
          <TextInput
            label={t('title_label')}
            value={editTitle}
            onChangeText={setEditTitle}
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <TextInput
            label={t('author_label')}
            value={editAutor}
            onChangeText={setEditAutor}
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />
          
          <TextInput
            label={t('isbn_label')}
            value={editIsbn}
            onChangeText={setEditIsbn}
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <TextInput
            label={t('price_label')}
            value={editPrice}
            onChangeText={setEditPrice}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <TextInput
            label={t('state_label')}
            value={editState}
            onChangeText={setEditState}
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <View style={styles.modalActions}>
            <Button 
              onPress={() => setEditModalVisible(false)} 
              disabled={updating}
              textColor="#666"
            >
              {t('cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDeleteBook}
              disabled={updating}
              buttonColor="#e53935"
            >
              Eliminar
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUpdateBook} 
              loading={updating}
              disabled={updating}
              buttonColor="#D183BA"
            >
              {t('save_changes')}
            </Button>
          </View>
        </Modal>
        
        {/* Rating Modal */}
        <Modal
          visible={ratingModalVisible}
          onDismiss={() => !submittingRating && setRatingModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>{t('rating_title')}</Text>
          {targetBook && (
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 15 }}>
              {targetBook.title} {targetOwnerName ? `- ${targetOwnerName}` : (targetBook.owner?.name ? `- ${targetBook.owner.name}` : '')}
            </Text>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRatingValue(star)}
                style={{ padding: 5 }}
              >
                <RNText style={{ fontSize: 32, color: star <= ratingValue ? '#f59e0b' : '#cbd5e1' }}>
                  {star <= ratingValue ? '★' : '☆'}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label={t('rating_comment_placeholder')}
            value={ratingComment}
            onChangeText={setRatingComment}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.modalInput, { height: 100 }]}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <View style={styles.modalActions}>
            <Button 
              onPress={() => setRatingModalVisible(false)} 
              disabled={submittingRating}
              textColor="#666"
            >
              {t('cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={submitRating} 
              loading={submittingRating}
              disabled={submittingRating}
              buttonColor="#D183BA"
            >
              {t('btn_publish')}
            </Button>
          </View>
        </Modal>

        {/* Message Request Modal */}
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
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
            Hablar con el vendedor
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
            Escribe un mensaje de presentación para el libro "{selectedBookForRequest?.title}":
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
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  header: {
    marginLeft: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  segmented: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  bookDetails: {
    color: '#666',
    marginTop: 2,
  },
  price: {
    marginTop: 10,
    color: '#D183BA',
    fontWeight: 'bold',
  },
  typeBadge: {
    backgroundColor: '#F5E4F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 28,
  },
  typeText: {
    fontSize: 12,
    color: '#D183BA',
    fontWeight: 'bold',
  },
  editButton: {
    borderColor: '#D183BA',
    marginTop: -8,
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
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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
  rentalStatusContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  rentalDates: {
    color: '#666',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  statusText: {
    color: '#333',
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    borderRadius: 30,
  },
  labelModal: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
  }
});
