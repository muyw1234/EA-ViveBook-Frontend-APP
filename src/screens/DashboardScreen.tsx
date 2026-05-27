import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Searchbar, IconButton } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [followingItems, setFollowingItems] = React.useState<any[]>([]);
  const [followingPage, setFollowingPage] = React.useState(1);
  const itemsPerPage = 5;

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      const user = profileRes.data;

      const eventsRes = await api.get('/eventos?limit=10');
      
      let items: any[] = [];
      
      if (user) {
        if (user.followingUsers) {
          items = items.concat(user.followingUsers.map((u: any) => ({ type: 'user', id: u._id || u, name: u.name || "Usuario", data: u })));
        }
        if (user.favoriteAuthors) {
          items = items.concat(user.favoriteAuthors.map((a: string) => ({ type: 'author', id: a, name: a })));
        }
        if (user.favoriteCategories) {
          items = items.concat(user.favoriteCategories.map((c: string) => ({ type: 'category', id: c, name: c })));
        }
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      if (eventsRes.data && eventsRes.data.data && eventsRes.data.data.data) {
        const backendEvents = eventsRes.data.data.data;
        items = items.concat(backendEvents.map((e: any) => ({
          type: 'event',
          id: e._id,
          name: e.title,
          direccion: e.direccionExacta
        })));
      }

      setFollowingItems(items);
    } catch (error) {
      console.error("Error fetching dashboard feed:", error);
    }
  };

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
        right={(props) => (
          <IconButton
            {...props}
            icon="tune"
            iconColor="#D183BA"
            size={24}
            onPress={() => navigation.navigate("Search", { openFilters: true })}
          />
        )}
      />

      {/* Tarjetas de Accesos Rápidos */}
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

      {/* Sección accesos directos de Eventos Literarios */}
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#7c3aed' }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ color: '#7c3aed', fontWeight: 'bold' }}>
             🎉 {t('dash_events_title', { defaultValue: 'Clubes y Eventos' })}
          </Text>
          <Text variant="bodyMedium">
            {t('dash_events_desc', { defaultValue: 'Encuentra lecturas conjuntas y reuniones cerca de tu ubicación.' })}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#7c3aed" onPress={() => navigation.navigate("Discover" as never)}>
            {t('dash_events_btn', { defaultValue: 'Explorar Eventos' })}
          </Button>
        </Card.Actions>
      </Card>

      {/* Feed dinámico inferior */}
      <Text variant="titleLarge" style={[styles.header, { marginTop: 10 }]}>{t('following_title')}</Text>
      <Card style={[styles.card, { padding: 10 }]}>
        {followingItems.length === 0 ? (
          <Text style={{ fontStyle: 'italic', color: '#888', padding: 10 }}>{t('following_empty')}</Text>
        ) : (
          <View>
            {followingItems.slice((followingPage - 1) * itemsPerPage, followingPage * itemsPerPage).map((item, index) => (
              <View key={`${item.type}-${item.id}-${index}`} style={styles.followingItem}>
                <Text style={{ fontSize: 20 }}>
                  {item.type === 'user' ? '👤 ' : item.type === 'author' ? '✍️ ' : item.type === 'event' ? '📅 ' : '🏷️ '}
                </Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text variant="bodyLarge" style={{ fontWeight: item.type === 'event' ? 'bold' : 'normal' }}>{item.name}</Text>
                  {item.type === 'event' && (
                    <Text variant="bodySmall" numberOfLines={1} style={{ color: '#666' }}>{item.direccion}</Text>
                  )}
                </View>
                
                {/* Botón dinámico de navegación por fila */}
                {item.type === 'user' && (
                  <Button mode="text" compact onPress={() => navigation.navigate("Profile", { userId: item.id })}>
                    {t('view')}
                  </Button>
                )}
                {item.type === 'event' && (
                  <Button mode="text" textColor="#7c3aed" compact onPress={() => navigation.navigate("EventDetail", { eventoId: item.id })}>
                    {t('view')}
                  </Button>
                )}
              </View>
            ))}
            
            {followingItems.length > itemsPerPage && (
              <View style={styles.pagination}>
                <Button 
                  mode="outlined" 
                  disabled={followingPage === 1}
                  onPress={() => setFollowingPage(prev => prev - 1)}
                  style={styles.pageBtn}
                >
                  {"<"}
                </Button>
                <Text style={{ alignSelf: 'center', marginHorizontal: 15 }}>
                  {followingPage} / {Math.ceil(followingItems.length / itemsPerPage)}
                </Text>
                <Button 
                  mode="outlined" 
                  disabled={followingPage >= Math.ceil(followingItems.length / itemsPerPage)}
                  onPress={() => setFollowingPage(prev => prev + 1)}
                  style={styles.pageBtn}
                >
                  {">"}
                </Button>
              </View>
            )}
          </View>
        )}
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
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  pageBtn: {
    borderColor: '#D183BA',
  }
});