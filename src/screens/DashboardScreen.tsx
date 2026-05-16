import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, Searchbar } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate("Home" as never);
  };

  const onSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("Search", { query: searchQuery });
      setSearchQuery('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>{t('dash_header')}</Text>

      <Searchbar
        placeholder={t('search_placeholder')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={onSearch}
        style={styles.searchBar}
        icon={() => <Text style={{ fontSize: 20 }}>🔍</Text>}
      />

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
    backgroundColor: '#F5EBF4',
  },
  header: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#D6AED2',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 30,
  }
});