import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Text, Searchbar, Card, Button, Avatar, Divider, IconButton, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
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

  // Filters State
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterAutor, setFilterAutor] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
    if (route?.params?.openFilters) {
      setIsFilterModalVisible(true);
    }
  }, [initialQuery, route?.params?.openFilters]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Parallel search for books and users
      const [booksResponse, usersResponse] = await Promise.allSettled([
        api.get(`/libros/search?term=${query}`),
        api.get(`/usuarios/search?term=${query}`)
      ]);

      if (booksResponse.status === 'fulfilled') {
        setBookResults(booksResponse.value.data);
      } else {
        setBookResults([]);
      }

      if (usersResponse.status === 'fulfilled') {
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

  const renderBookItem = ({ item: book }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.titleText}>{book.title}</Text>
            <Text variant="bodySmall" style={styles.typeTag}>{book.type}</Text>
          </View>
          <Text variant="titleMedium" style={styles.priceText}>{book.precio}€</Text>
        </View>
        {book.autor ? <Text variant="bodySmall">{t('author_label')}: {book.autor}</Text> : null}
        <Text variant="bodySmall">{t('isbn_label')}: {book.isbn}</Text>
        <Text variant="bodySmall">{t('state_label')}: {book.estado}</Text>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => {
            if (book.type === 'VENTA') {
              navigation.navigate('BooksForSale');
            } else {
              navigation.navigate('BooksForRent');
            }
          }}
          compact
          buttonColor="#D183BA"
        >
          {t('view_section') || 'Ver sección'}
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderUserItem = ({ item: user }: { item: any }) => (
    <Card style={styles.userCard} onPress={() => navigation.navigate('UserProfile', { userId: user._id })}>
      <Card.Title
        title={user.name}
        subtitle={user.email}
        left={(props) => <Avatar.Text {...props} label={user.name.substring(0, 2).toUpperCase()} backgroundColor="#D183BA" />}
        right={(props) => <Button icon="chevron-right" onPress={() => navigation.navigate('UserProfile', { userId: user._id })}>{""}</Button>}
      />
    </Card>
  );

  const filteredBooks = bookResults.filter((book) => {
    if (filterType && book.type !== filterType) return false;
    if (filterAutor && (!book.autor || !book.autor.toLowerCase().includes(filterAutor.toLowerCase()))) return false;
    if (filterMaxPrice && !isNaN(parseFloat(filterMaxPrice)) && book.precio > parseFloat(filterMaxPrice)) return false;
    return true;
  });

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
            onPress={() => setIsFilterModalVisible(true)}
          />
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#D183BA" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Libros</Text>
              {filteredBooks.map(book => (
                <View key={book._id}>
                  {renderBookItem({ item: book })}
                </View>
              ))}
            </View>
          )}

          {searchQuery && filteredBooks.length === 0 && userResults.length === 0 && (
            <Text style={styles.emptyText}>{t('search_no_results', { query: searchQuery })}</Text>
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Filtros</Text>
          
          <TextInput
            label="Autor"
            value={filterAutor}
            onChangeText={setFilterAutor}
            mode="outlined"
            style={styles.modalInput}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

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
            onPress={() => setIsFilterModalVisible(false)}
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#D6AED2',
    marginLeft: 4,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
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
});
