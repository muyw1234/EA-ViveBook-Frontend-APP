import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, Text as RNText, Platform } from 'react-native';
import { Text, Card, Button, Avatar, SegmentedButtons, Portal, Modal, TextInput, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function MyBooksScreen() {
  const { t } = useTranslation();
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<any[]>([]);
  const [rentedBooks, setRentedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('uploaded');
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIsbn, setEditIsbn] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editState, setEditState] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchMyBooks = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data) {
        setUploadedBooks(response.data.libros || []);
        setBoughtBooks(response.data.boughtLibros || []);
        setRentedBooks(response.data.rentedLibros || []);
      }
    } catch (error) {
      console.error('Error fetching my books:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      statusText = t('rental_not_started') || "El alquiler todavía no ha empezado";
    } else if (now > end) {
      progress = 1;
      statusText = t('rental_finished') || "Alquiler finalizado";
    } else {
      const total = end - start;
      const elapsed = now - start;
      progress = elapsed / total;
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      statusText = (t('rental_days_remaining') || "Quedan X días de alquiler").replace('X', daysRemaining.toString());
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

  const renderContent = () => {
    let currentBooks = [];
    if (category === 'uploaded') currentBooks = uploadedBooks;
    else if (category === 'bought') currentBooks = boughtBooks;
    else if (category === 'rented') currentBooks = rentedBooks;

    if (currentBooks.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>{t('no_books')}</Text>
          </Card.Content>
        </Card>
      );
    }

    return currentBooks.map((book: any) => (
      <Card key={book._id} style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" style={styles.bookTitle}>{book.title}</Text>
              <Text variant="bodyMedium" style={styles.bookDetails}>{t('isbn_label')}: {book.isbn}</Text>
              <Text variant="bodyMedium" style={styles.bookDetails}>{t('state_label')}: {book.estado}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{book.type}</Text>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.price}>{t('price_label')}: {book.precio}€</Text>
          
          {category === 'rented' && renderRentalStatus(book)}
        </Card.Content>
        {category === 'uploaded' && (
          <Card.Actions>
            <Button 
              icon={() => <RNText style={{ fontSize: 16 }}>✏️</RNText>}
              mode="outlined" 
              onPress={() => handleEditPress(book)}
              style={styles.editButton}
              textColor="#D183BA"
            >
              {t('edit')}
            </Button>
          </Card.Actions>
        )}
      </Card>
    ));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D183BA"]} />
        }
      >
        <View style={styles.headerContainer}>
          <Avatar.Icon size={48} icon="book-multiple" style={{ backgroundColor: '#D183BA' }} />
          <Text variant="headlineMedium" style={styles.header}>{t('my_books')}</Text>
        </View>

        <SegmentedButtons
          value={category}
          onValueChange={setCategory}
          buttons={[
            { value: 'uploaded', label: t('uploaded') },
            { value: 'bought', label: t('bought') },
            { value: 'rented', label: t('rented') },
          ]}
          style={styles.segmented}
          theme={{ colors: { secondaryContainer: '#F5E4F0', onSecondaryContainer: '#D183BA' } }}
        />

        {renderContent()}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
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
  }
});
