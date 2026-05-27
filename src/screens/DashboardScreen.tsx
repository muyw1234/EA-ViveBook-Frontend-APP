import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Card, Searchbar, IconButton } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import * as Location from 'expo-location'; // Requerido para pedir la ubicación real
import { MultiEventMap } from './EventMap';

interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

// Función matemática auxiliar para calcular distancias en km (Fórmula de Haversine)
function getKilometersDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [followingItems, setFollowingItems] = React.useState<any[]>([]);
  const [followingPage, setFollowingPage] = React.useState(1);
  const itemsPerPage = 5;

  const [eventMarkers, setEventMarkers] = React.useState<MapMarkerData[]>([]);
  
  // Estados nuevos para controlar la ubicación real por GPS/Navegador
  const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = React.useState(true);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  // Radio en kilómetros para decidir qué es cercano
  const RADIO_MAXIMO_KM = 15;

  useFocusEffect(
    React.useCallback(() => {
      async function requestAndFetchLocation() {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.log("Permiso de ubicación denegado.");
            setLocationError('Permiso de ubicación denegado. Activa los permisos de ubicación y reinicia la app.');
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            setLoadingLocation(false);
            return;
          }

          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            console.log("Servicios de ubicación deshabilitados.");
            setLocationError('Los servicios de ubicación están deshabilitados. Activa GPS/Ubicación en el dispositivo.');
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            setLoadingLocation(false);
            return;
          }

          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });

          setLocationError(null);
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (err) {
          console.error("Error obteniendo la ubicación real:", err);
          setLocationError('No se pudo obtener la ubicación real. Buscando la última ubicación conocida.');
          try {
            let lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
              setUserLocation({
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              });
            } else {
              setLocationError('No hay ubicación conocida. Usando ubicación por defecto de Barcelona.');
              setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            }
          } catch (err2) {
            console.error("Error obteniendo la última ubicación conocida:", err2);
            setLocationError('No se pudo obtener ubicación. Usa una prueba en un dispositivo con GPS habilitado.');
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
          }
        } finally {
          setLoadingLocation(false);
        }
      }

      requestAndFetchLocation();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (userLocation) {
        fetchDashboardData();
      }
    }, [userLocation])
  );

  const fetchDashboardData = async () => {
    if (!userLocation) return;

    try {
      const profileRes = await api.get('/auth/profile');
      const user = profileRes.data;

      const eventsRes = await api.get('/eventos?limit=20');
      
      let items: any[] = [];
      let markers: MapMarkerData[] = [];
      
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
        
        backendEvents.forEach((e: any) => {
          const hasCoordinates = e.location && 
                                 e.location.coordinates && 
                                 e.location.coordinates.length === 2;

          if (hasCoordinates) {
            const eventLng = e.location.coordinates[0];
            const eventLat = e.location.coordinates[1];

            // CALCULAMOS SI ESTÁ CERCA EN LA VIDA REAL
            const distanciaKM = getKilometersDistance(
              userLocation.latitude,
              userLocation.longitude,
              eventLat,
              eventLng
            );

            if (distanciaKM <= RADIO_MAXIMO_KM) {
              // Añadimos al mapa
              markers.push({
                id: e._id,
                longitude: eventLng,
                latitude: eventLat,
                title: e.title || "Evento"
              });

              items.push({
                type: 'event',
                id: e._id,
                name: e.title,
                direccion: e.direccionExacta
              });
            }
          }
        });
      }

      setFollowingItems(items);
      setEventMarkers(markers);
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

  if (loadingLocation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5EBF4' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#7c3aed', fontWeight: '600' }}>
          Consultando tu ubicación exacta...
        </Text>
      </View>
    );
  }

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

      {locationError ? (
        <Card style={[styles.card, { borderColor: '#f87171', borderWidth: 1 }]}> 
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: '#b91c1c' }}>
              {locationError}
            </Text>
            {userLocation && (
              <Text variant="bodySmall" style={{ marginTop: 6, color: '#6b7280' }}>
                Coordenadas actuales: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </Text>
            )}
          </Card.Content>
        </Card>
      ) : userLocation ? (
        <Card style={[styles.card, { borderColor: '#22c55e', borderWidth: 1 }]}> 
          <Card.Content>
            <Text variant="bodyMedium">Ubicación detectada correctamente:</Text>
            <Text variant="bodySmall" style={{ marginTop: 6, color: '#6b7280' }}>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

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

      {/* Sección de Eventos Literarios con Geocercanía en tiempo real */}
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#7c3aed' }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ color: '#7c3aed', fontWeight: 'bold' }}>
             {t('dash_events_title', { defaultValue: 'Eventos Cercanos a ti' })}
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 10 }}>
            Mostrando reuniones literarias a menos de {RADIO_MAXIMO_KM} km de tu ubicación real.
          </Text>

          {/* Pasamos los marcadores limpios y filtrados junto con la ubicación real */}
          {eventMarkers.length > 0 && userLocation ? (
            <View style={styles.mapWrapper}>
              <MultiEventMap 
                markers={eventMarkers}
                userLatitude={userLocation.latitude}
                userLongitude={userLocation.longitude}
              />
            </View>
          ) : (
            <Text style={{ fontStyle: 'italic', color: '#888', marginVertical: 10, textAlign: 'center' }}>
              ℹ️ No se han encontrado eventos en un rango de {RADIO_MAXIMO_KM} km a la redonda.
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" buttonColor="#7c3aed" onPress={() => navigation.navigate("Discover" as never)}>
            {t('dash_events_btn', { defaultValue: 'Explorar Todos' })}
          </Button>
        </Card.Actions>
      </Card>

      {/* Feed dinámico inferior filtrado */}
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
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb',
  }
});