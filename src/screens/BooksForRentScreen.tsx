import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import api from '../services/api';

export default function BooksForRentScreen() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>Libros en Alquiler</Text>
      {books.length === 0 ? (
        <Text>No hay libros disponibles en este momento.</Text>
      ) : (
        books.map((book: any) => (
          <Card key={book._id} style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{book.title}</Text>
              <Text variant="bodyMedium">ISBN: {book.isbn}</Text>
              <Text variant="bodyMedium">Estado: {book.estado}</Text>
              <Text variant="titleMedium" style={{ marginTop: 5, color: '#D183BA' }}>Precio: {book.precio}€</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" buttonColor="#D183BA">Alquilar</Button>
            </Card.Actions>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    marginBottom: 16,
  }
});
