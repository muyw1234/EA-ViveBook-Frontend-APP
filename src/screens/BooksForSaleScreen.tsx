import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, FlatList, Dimensions, Text as RNText, Platform } from 'react-native';
import { Card, Button, Menu, Divider, IconButton, Chip, useTheme } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function BooksForSaleScreen() {
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

  useFocusEffect(
    useCallback(() => {
      const fetchBooksAndReservations = async () => {
        try {
          const response = await api.get('/libros/type/VENTA');
          setBooks(response.data.data);
          
          try {
            const resResponse = await api.get('/reservas/solicitadas');
            const resList = resResponse.data?.data || resResponse.data || [];
            const pendingBookIds = Array.isArray(resList)
              ? resList
                  .filter((r: any) => r.estado?.toUpperCase() === 'PENDIENTE' || r.estado?.toUpperCase() === 'ACEPTADA')
                  .map((r: any) => typeof r.libro === 'string' ? r.libro : r.libro?._id)
                  .filter(Boolean)
              : [];
            setRequestedBookIds(pendingBookIds);
          } catch (resErr) {
            console.error('Error fetching reservations:', resErr);
          }
          
          setPage(1);
        } catch (error) {
          console.error('Error fetching books:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchBooksAndReservations();
    }, [])
  );

  const openMenu = (id: string) => setMenuVisible(id);
  const closeMenu = () => setMenuVisible(null);

  const handleTalkToSeller = (book: any) => {
    closeMenu();
    showAlert(t('talk_to_seller'), `${t('chat_header')} ${book.title}`);
  };

  const handleBuyDirectly = async (book: any) => {
    closeMenu();
    try {
      await api.post(`/libros/buy/${book._id}`);
      showAlert(t('success'), `${t('buy_action')}: ${book.title}`);
      // Refresh the list
      const response = await api.get('/libros/type/VENTA');
      setBooks(response.data.data);
    } catch (error) {
      console.error('Error buying book:', error);
      showAlert(t('error'), t('buy_err') || 'No se pudo completar la compra');
    }
  };

  const handleReserveBook = async (book: any) => {
    try {
      await api.post('/reservas', { libroId: book._id });
      setRequestedBookIds(prev => [...prev, book._id]);
      showAlert('Solicitud enviada', 'Se ha solicitado la reserva correctamente.');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        (typeof error.response?.data?.error === 'string' ? error.response.data.error : null) ||
        error.message ||
        'No se pudo realizar la reserva';
      showAlert('Error', String(msg));
    }
  };

  const renderBookItem = ({ item: book }: { item: any }) => (
    <Card style={isGridView ? styles.gridCard : styles.listCard}>
      <Card.Content style={isGridView ? styles.gridCardContent : undefined}>
        <Text variant={isGridView ? "titleMedium" : "titleLarge"} numberOfLines={2} style={styles.bookTitle}>
          {book.title}
        </Text>
        {book.isReserved && (
          <Chip style={styles.reservedBadge} textStyle={styles.reservedBadgeText}>
            {t('reserved', 'Reservado')}
          </Chip>
        )}
        {!isGridView && (
          <>
            <Text variant="bodyMedium" style={{ marginTop: book.isReserved ? 6 : 0 }}>{t('isbn_label')}: {book.isbn}</Text>
            {book.autor ? <Text variant="bodyMedium">{t('author_label')}: {book.autor}</Text> : null}
            {book.categoria ? <Text variant="bodyMedium">Categoría: {book.categoria}</Text> : null}
            <Text variant="bodyMedium">{t('state_label')}: {book.estado}</Text>
          </>
        )}
        
        {/* Attribution Section */}
        <View style={styles.uploaderSection}>
          <Text variant="bodySmall" style={styles.uploaderLabel}>
            {t('uploaded_by')}
          </Text>
          <RNText 
            style={styles.uploaderName}
            onPress={() => navigation.navigate('UserProfile', { userId: book.owner?._id })}
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
              buttonColor={book.isReserved ? "#f59e0b" : "#D183BA"} 
              onPress={() => openMenu(book._id)}
              style={styles.actionButton}
              compact
              labelStyle={{ fontSize: isGridView ? 10 : 12 }}
            >
              {book.isReserved ? t('reserved', 'Reservado') : t('buy_action')}
            </Button>
          }
          contentStyle={{ backgroundColor: 'white' }}
        >
          <Menu.Item 
            onPress={() => handleTalkToSeller(book)} 
            title={t('talk_to_seller')} 
            leadingIcon={() => <RNText style={{ fontSize: 18 }}>💬</RNText>}
          />
          {!book.isReserved && (
            <>
              <Divider />
              <Menu.Item 
                onPress={() => handleBuyDirectly(book)} 
                title={t('buy_directly')} 
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
              !requestedBookIds.includes(book._id) && { borderColor: theme.colors.primary }
            ]}
            compact
            labelStyle={{ fontSize: isGridView ? 10 : 12 }}
            disabled={requestedBookIds.includes(book._id)}
          >
            {requestedBookIds.includes(book._id) ? 'Reserva solicitada' : t('request_reserve', 'Solicitar reserva')}
          </Button>
        )}
      </View>
    </Card>
  );

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE);
  const paginatedBooks = books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderFooter = () => {
    if (books.length <= ITEMS_PER_PAGE) return null;
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
        <Text variant="headlineMedium" style={styles.header}>{t('sale_header')}</Text>
        <IconButton
          icon={isGridView ? "view-list" : "view-grid"}
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
        ListEmptyComponent={<Text style={styles.emptyText}>{t('no_books')}</Text>}
        ListFooterComponent={renderFooter}
      />
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
  },
  gridCard: {
    width: (width - 40) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  gridCardContent: {
    padding: 12,
    height: 100,
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
  gridButton: {
    width: '100%',
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
  },
  uploaderName: {
    color: '#D183BA',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 12,
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
  }
});