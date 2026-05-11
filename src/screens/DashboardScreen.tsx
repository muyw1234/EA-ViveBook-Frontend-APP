import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate("Home" as never);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>{t('dash_header')}</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{t('dash_sales_title')}</Text>
          <Text variant="bodyMedium">{t('dash_sales_desc')}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("BooksForSale" as never)}>
            {t('dash_sales_btn')}
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{t('dash_rent_title')}</Text>
          <Text variant="bodyMedium">{t('dash_rent_desc')}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("BooksForRent" as never)}>
            {t('dash_rent_btn')}
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{t('dash_add_title')}</Text>
          <Text variant="bodyMedium">{t('dash_add_desc')}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#D183BA" onPress={() => navigation.navigate("AddBook" as never)}>
            {t('dash_add_btn')}
          </Button>
        </Card.Actions>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout} 
        style={{ marginTop: 20, marginBottom: 40, borderColor: '#ef4444' }}
        textColor="#ef4444"
      >
        {t('logout')}
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