import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, FlatList, Dimensions, Text as RNText } from 'react-native';
import { Text, Card, Button, Menu, Divider, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function BooksForRentScreen() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchBooks = async () => {
        try {
          const response = await api.get('/libros/type/ALQUILER');
          setBooks(response.data);
        } catch (error) {
          console.error('Error fetching books:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchBooks();
    }, [])
  );

  const openMenu = (id: string) => setMenuVisible(id);
  const closeMenu = () => setMenuVisible(null);

  const handleTalkToSeller = (book: any) => {
    closeMenu();
    Alert.alert(t('talk_to_seller'), `${t('chat_header')} ${book.title}`);
  };

  const handleRentDirectly = (book: any) => {
    closeMenu();
    Alert.alert(t('rent_directly'), `${t('rent_action')}: ${book.title}`);
  };

  const renderBookItem = ({ item: book }: { item: any }) => (
    <Card style={isGridView ? styles.gridCard : styles.listCard}>
      <Card.Content style={isGridView ? styles.gridCardContent : undefined}>
        <Text variant={isGridView ? "titleMedium" : "titleLarge"} numberOfLines={2} style={styles.bookTitle}>
          {book.title}
        </Text>
        {!isGridView && (
          <>
            <Text variant="bodyMedium">{t('isbn_label')}: {book.isbn}</Text>
            <Text variant="bodyMedium">{t('state_label')}: {book.estado}</Text>
          </>
        )}
        <Text variant="titleMedium" style={styles.price}>
          {book.precio}€
        </Text>
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
              {t('rent_action')}
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
            onPress={() => handleRentDirectly(book)} 
            title={t('rent_directly')} 
            leadingIcon={() => <RNText style={{ fontSize: 18 }}>💰</RNText>}
          />
        </Menu>
      </Card.Actions>
    </Card>
  );

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
        <Text variant="headlineMedium" style={styles.header}>{t('rent_header')}</Text>
        <IconButton
          icon={isGridView ? "view-list" : "view-grid"}
          iconColor="#D183BA"
          size={28}
          onPress={() => setIsGridView(!isGridView)}
        />
      </View>

      <FlatList
        key={isGridView ? 'grid' : 'list'}
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        numColumns={isGridView ? 2 : 1}
        columnWrapperStyle={isGridView ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('no_books')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  gridCardActions: {
    justifyContent: 'center',
    paddingHorizontal: 8,
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
  }
});