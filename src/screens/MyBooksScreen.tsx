import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, Text as RNText, Platform, TouchableOpacity } from 'react-native';
import { Card, Button, Avatar, SegmentedButtons, Portal, Modal, TextInput, ProgressBar, IconButton, Menu, Searchbar, TouchableRipple } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function MyBooksScreen() {
  const { t } = useTranslation();
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<any[]>([]);
  const [rentedBooks, setRentedBooks] = useState<any[]>([]);
  const [reservedReservations, setReservedReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('uploaded');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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
  const [submittingRating, setSubmittingRating] = useState(false);

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
    } catch (error) {
      console.error('Error fetching my books:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTalkToSeller = (book: any) => {
    Alert.alert(t('talk_to_seller'), `${t('chat_header')} ${book?.title}`);
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
      Alert.alert(t('error'), t('profile_err_update') || 'No se pudo eliminar el libro.');
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
      Alert.alert(t('error'), t('err_missing_fields'));
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
      Alert.alert(t('success'), t('profile_success_update'));
      setEditModalVisible(false);
      fetchMyBooks();
    } catch (error) {
      console.error('Error updating book:', error);
      Alert.alert(t('error'), t('profile_err_update'));
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
    setRatingValue(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!targetBook) {
      Alert.alert(t('error'), 'No se pudo identificar el libro');
      return;
    }

    if (ratingValue < 1 || ratingValue > 5) {
      Alert.alert(t('error'), t('rating_error'));
      return;
    }

    setSubmittingRating(true);
    try {
      // Safely extract the ownerId checking null/undefined first to prevent TypeError
      const ownerId = targetBook.owner 
        ? (typeof targetBook.owner === 'object' ? targetBook.owner._id : targetBook.owner)
        : null;

      if (!ownerId) {
        Alert.alert(t('error'), 'Este libro no tiene un vendedor registrado para valorar.');
        setSubmittingRating(false);
        return;
      }
      
      const payload = {
        usuarioValorado: ownerId,
        libro: targetBook._id,
        tipoOperacion: targetBook.type, // Should be VENTA or ALQUILER
        puntuacion: ratingValue,
        comentario: ratingComment
      };

      console.log('Sending rating payload:', payload);
      
      const response = await api.post('/valoraciones', payload);
      console.log('Rating response:', response.data);
      
      Alert.alert(t('success'), t('rating_success'));
      setRatingModalVisible(false);
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
      
      Alert.alert(t('error'), msg);
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
            <Button 
              icon={() => <RNText style={{ fontSize: 16 }}>⭐</RNText>}
              mode="contained" 
              onPress={() => handleRateSeller(book)}
              style={{ backgroundColor: '#f59e0b' }}
            >
              {t('rating_title')}
            </Button>
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
              {targetBook.title} - {targetBook.owner?.name}
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
