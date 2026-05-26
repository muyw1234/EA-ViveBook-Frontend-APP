import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView, Dimensions, Text as RNText } from 'react-native';
import { Searchbar, Card, Button, Avatar, Divider, IconButton, Portal, Modal, TextInput, SegmentedButtons, Menu, TouchableRipple } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function SearchScreen({ route }: any) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const initialQuery = route?.params?.query || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const [isGridView, setIsGridView] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Draft Filters State (for modal)
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterType, setFilterType] = useState('');

  // Applied Filters State
  const [appliedCategoria, setAppliedCategoria] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [appliedType, setAppliedType] = useState('');

  const ALL_CATEGORIES = ['Todas', 'Terror', 'Misterio', 'Aventura', 'Juvenil', 'Policíaco', 'Infantil', 'Autoayuda', 'Novela', 'Biografías', 'Cómics', 'Otros'];

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      fetchAllBooks();
    }
    if (route?.params?.openFilters) {
      setIsFilterModalVisible(true);
    }
  }, [initialQuery, route?.params?.openFilters]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [appliedCategoria, appliedMaxPrice, appliedType, searchQuery]);

  const fetchAllBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/libros');
      setBookResults(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching all books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Parallel search for books and users
      // const [booksResponse, usersResponse] = await Promise.allSettled([
      //   api.get(`/libros/search?term=${query}`),
      //   api.get(`/usuarios/search?term=${query}`)
      // ]);

      console.log(`Searching for book and user: ${query}`);
      const booksResponse = (await api.get(`/libros/search?term=${query}&page=1&limit=10`)).data;
      const usersResponse = (await  api.get(`/usuarios/search?term=${query}&page=1&limit=10`)).data;

      if (booksResponse.status === 200) {
        setBookResults(booksResponse.value.data);
      } else {
        setBookResults([]);
      }

      if (usersResponse.status === 200) {
        setUserResults(usersResponse.value.data);
      } else {
        setUserResults([]);
      }

    } catch (error: any) {
      console.error('Error searching:', error);
      Alert.alert(t('error'), 'Hubo un problema al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const openMenu = (id: string) => setMenuVisible(id);
  const closeMenu = () => setMenuVisible(null);

  const handleTalkToSeller = (book: any) => {
    closeMenu();
    Alert.alert(t('talk_to_seller'), `${t('chat_header')} ${book.title}`);
  };

  const handleTransaction = async (book: any) => {
    closeMenu();
    try {
      const endpoint = book.type === 'VENTA' ? `/libros/buy/${book._id}` : `/libros/rent/${book._id}`;
      await api.post(endpoint);
      Alert.alert(t('success'), `${book.type === 'VENTA' ? t('buy_action') : t('rent_action')}: ${book.title}`);
      if (searchQuery) handleSearch(searchQuery);
      else fetchAllBooks();
    } catch (error) {
      console.error(`Error processing transaction:`, error);
      Alert.alert(t('error'), 'No se pudo completar la operación');
    }
  };

  const renderBookItem = ({ item: book }: { item: any }) => (
    <Card style={isGridView ? styles.gridCard : styles.listCard}>
      <Card.Content style={isGridView ? styles.gridCardContent : undefined}>
        <View style={isGridView ? undefined : styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant={isGridView ? "titleMedium" : "titleMedium"} numberOfLines={2} style={styles.titleText}>{book.title}</Text>
            <Text variant="bodySmall" style={styles.typeTag}>{book.type}</Text>
          </View>
          <Text variant="titleMedium" style={styles.priceText}>{book.precio}€</Text>
        </View>
        {!isGridView && (
          <>
            {book.autor ? <Text variant="bodySmall">{t('author_label')}: {book.autor}</Text> : null}
            {book.categoria ? <Text variant="bodySmall">Categoría: {book.categoria}</Text> : null}
            <Text variant="bodySmall">{t('isbn_label')}: {book.isbn}</Text>
            <Text variant="bodySmall">{t('state_label')}: {book.estado}</Text>
          </>
        )}
      </Card.Content>
      <Card.Actions style={isGridView ? styles.gridCardActions : undefined}>
        <Menu
          visible={menuVisible === book._id}
          onDismiss={closeMenu}
          anchor={
            <Button 
              mode="contained" 
              buttonColor="#D183BA" 
              onPress={() => openMenu(book._id)}
              compact={isGridView}
              style={isGridView ? styles.gridButton : undefined}
              labelStyle={isGridView ? { fontSize: 10 } : undefined}
            >
              {book.type === 'VENTA' ? t('buy_action') : t('rent_action')}
            </Button>
          }
          contentStyle={{ backgroundColor: 'white' }}
        >
          <Menu.Item 
            onPress={() => handleTalkToSeller(book)} 
            title={t('talk_to_seller')} 
            leadingIcon={() => <RNText style={{ fontSize: 18 }}>💬</RNText>}
          />
          <Divider />
          <Menu.Item 
            onPress={() => handleTransaction(book)} 
            title={book.type === 'VENTA' ? t('buy_directly') : t('rent_directly')} 
            leadingIcon={() => <RNText style={{ fontSize: 18 }}>{book.type === 'VENTA' ? '💰' : '📅'}</RNText>}
          />
        </Menu>
      </Card.Actions>
    </Card>
  );

  const renderUserItem = ({ item: user }: { item: any }) => (
    <Card style={styles.userCard} onPress={() => navigation.navigate('UserProfile', { userId: user._id })}>
      <Card.Title
        title={user.name}
        subtitle={user.email}
        left={(props) => <Avatar.Text {...props} label={user.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: '#D183BA' }} />}
        right={(props) => <Button icon="chevron-right" onPress={() => navigation.navigate('UserProfile', { userId: user._id })}>{""}</Button>}
      />
    </Card>
  );

  const filteredBooks = bookResults.filter((book) => {
    if (appliedType && book.type !== appliedType) return false;
    if (appliedCategoria && appliedCategoria !== 'Todas' && book.categoria !== appliedCategoria) return false;
    if (appliedMaxPrice && !isNaN(parseFloat(appliedMaxPrice)) && book.precio > parseFloat(appliedMaxPrice)) return false;
    return true;
  });

  const handleApplyFilters = () => {
    setAppliedCategoria(filterCategoria);
    setAppliedMaxPrice(filterMaxPrice);
    setAppliedType(filterType);
    setIsFilterModalVisible(false);
  };

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderFooter = () => {
    if (filteredBooks.length <= ITEMS_PER_PAGE) return null;
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

  const ListHeader = () => (
    <>
      {userResults.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Usuarios</Text>
          {userResults.map(user => (
            <View key={user._id}>
              {renderUserItem({ item: user })}
            </View>
          ))}
          <Divider style={styles.divider} />
        </View>
      )}

      {filteredBooks.length > 0 && (
        <View style={styles.headerRowSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Libros</Text>
          <IconButton
            icon={isGridView ? "view-list" : "view-grid"}
            iconColor="#D183BA"
            size={28}
            onPress={() => setIsGridView(!isGridView)}
            style={{ margin: 0 }}
          />
        </View>
      )}
    </>
  );

  const renderEmptyState = () => {
    const hasFilters = appliedCategoria || appliedMaxPrice || appliedType;

    if (hasFilters && filteredBooks.length === 0) {
      return <Text style={styles.emptyText}>¡No hay ningún libro disponible con esos requisitos por el momento!</Text>;
    }

    if (searchQuery && filteredBooks.length === 0) {
      return <Text style={styles.emptyText}>{t('search_no_results', { query: searchQuery })}</Text>;
    }

    if (filteredBooks.length === 0) {
      return <Text style={styles.emptyText}>¡No hay ningún libro disponible con esos requisitos por el momento!</Text>;
    }
    
    return null;
  };

  const handleOpenFilters = () => {
    setFilterCategoria(appliedCategoria);
    setFilterMaxPrice(appliedMaxPrice);
    setFilterType(appliedType);
    setIsFilterModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('search_placeholder')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={() => handleSearch(searchQuery)}
        style={styles.searchBar}
        icon={() => <Text style={{ fontSize: 20 }}>🔍</Text>}
        right={(props) => (
          <IconButton
            {...props}
            icon="tune"
            iconColor="#D183BA"
            size={24}
            onPress={handleOpenFilters}
          />
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#D183BA" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          ListHeaderComponent={ListHeader}
          data={paginatedBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id}
          numColumns={isGridView ? 2 : 1}
          columnWrapperStyle={isGridView ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={renderEmptyState()}
          ListFooterComponent={renderFooter}
        />
      )}

      <Portal>
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Filtros</Text>
          
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setCategoryMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Categoría"
                    value={filterCategoria === '' ? 'Todas' : filterCategoria}
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
            {ALL_CATEGORIES.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setFilterCategoria(cat === 'Todas' ? '' : cat);
                  setCategoryMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

          <TextInput
            label="Precio Máximo (€)"
            value={filterMaxPrice}
            onChangeText={setFilterMaxPrice}
            keyboardType="numeric"
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <Text style={styles.labelModal}>Tipo:</Text>
          <SegmentedButtons
            value={filterType}
            onValueChange={setFilterType}
            buttons={[
              { value: '', label: 'Todos' },
              { value: 'VENTA', label: 'Venta' },
              { value: 'ALQUILER', label: 'Alquiler' },
            ]}
            style={styles.segmented}
          />

          <Button 
            mode="contained" 
            onPress={handleApplyFilters}
            buttonColor="#D183BA"
            style={{ marginTop: 16 }}
          >
            Aplicar Filtros
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
  },
  searchBar: {
    margin: 16,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  headerRowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#D6AED2',
    marginLeft: 4,
  },
  listCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  gridCard: {
    width: (width - 40) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  gridCardContent: {
    padding: 12,
    height: 100,
  },
  gridCardActions: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gridButton: {
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  userCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleText: {
    fontWeight: 'bold',
    color: '#333',
  },
  typeTag: {
    color: '#D183BA',
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceText: {
    color: '#D183BA',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#ddd',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
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
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  labelModal: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  segmented: {
    marginBottom: 16,
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
  }
});
