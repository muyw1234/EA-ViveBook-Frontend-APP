import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate("Home" as never);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>Inicio</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Libros en venta</Text>
          <Text variant="bodyMedium">Explora el catálogo de libros a la venta.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("BooksForSale" as never)}>Ver libros a la venta</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Libros disponibles para alquilar</Text>
          <Text variant="bodyMedium">Encuentra libros para alquilar por tiempo limitado.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("BooksForRent" as never)}>Ver libros para alquilar</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Subir libro</Text>
          <Text variant="bodyMedium">Añade un libro para vender o alquilar.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("AddBook" as never)}>Subir ahora</Button>
        </Card.Actions>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout} 
        style={{ marginTop: 20, marginBottom: 40, borderColor: '#ef4444' }}
        textColor="#ef4444"
      >
        Cerrar Sesión
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
