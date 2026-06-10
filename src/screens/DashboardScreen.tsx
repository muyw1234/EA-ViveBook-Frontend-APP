import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Card, Searchbar, IconButton } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import * as Location from 'expo-location';
import { MultiEventMap } from './EventMap';

interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

function getKilometersDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
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

  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = React.useState(true);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const RADIO_MAXIMO_KM = 15;

  // 1. Efecto para escuchar y actualizar la posición GPS en tiempo real
  useFocusEffect(
    React.useCallback(() => {
      let locationSubscriber: Location.LocationSubscription | null = null;

      async function requestAndFetchLocation() {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocationError('Permiso de ubicación denegado.');
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            setLoadingLocation(false);
            return;
          }

          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            setLocationError('Los servicios de ubicación están deshabilitados.');
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            setLoadingLocation(false);
            return;
          }

          locationSubscriber = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 20,
            },
            (location: Location.LocationObject) => {
              setLocationError(null);
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              setLoadingLocation(false);
            },
          );
        } catch (err) {
          console.error('Error en geolocalización:', err);

          try {
            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
              setUserLocation({
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              });
            } else {
              setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
            }
          } catch (err2) {
            setUserLocation({ latitude: 41.3851, longitude: 2.1734 });
          }
          setLoadingLocation(false);
        }
      }

      requestAndFetchLocation();
      return () => {
        if (locationSubscriber) {
          try {
            if (typeof locationSubscriber.remove === 'function') {
              locationSubscriber.remove();
            }
          } catch (e) {
            console.warn('Expo Location descuelgue controlado:', e);
          }
        }
      };
    }, []),
  );

  // 2. Efecto para volver a pedir los eventos del backend si el usuario se mueve
  React.useEffect(() => {
    if (userLocation) {
      fetchDashboardData(userLocation);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  // 3. Petición al Servidor y filtrado de eventos vigentes y cercanos
  const fetchDashboardData = async (currentLocation: { latitude: number; longitude: number }) => {
    try {
      const profileRes = await api.get('/auth/profile');
      const user = profileRes.data;

      const eventsRes = await api.get('/eventos?limit=50'); // Aumentado el límite para tener más margen de filtrado

      let items: any[] = [];
      const markers: MapMarkerData[] = [];

      if (user) {
        if (user.followingUsers) {
          items = items.concat(
            user.followingUsers.map((u: any) => ({
              type: 'user',
              id: u._id || u,
              name: u.name || 'Usuario',
              data: u,
            })),
          );
        }
        if (user.favoriteAuthors) {
          items = items.concat(
            user.favoriteAuthors.map((a: string) => ({ type: 'author', id: a, name: a })),
          );
        }
        if (user.favoriteCategories) {
          items = items.concat(
            user.favoriteCategories.map((c: string) => ({ type: 'category', id: c, name: c })),
          );
        }
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      if (eventsRes.data && eventsRes.data.data && eventsRes.data.data.data) {
        const backendEvents = eventsRes.data.data.data;
        const ahora = new Date();

        backendEvents.forEach((e: any) => {
          const fechaString = e.eventDate || e.date;
          if (!fechaString) return;

          const fechaEvento = new Date(fechaString);
          if (fechaEvento < ahora) {
            return;
          }

          // ─── FILTRO DE DISTANCIA GEOGRÁFICA ───
          const hasCoordinates =
            e.location && e.location.coordinates && e.location.coordinates.length === 2;

          if (hasCoordinates) {
            const eventLng = e.location.coordinates[0];
            const eventLat = e.location.coordinates[1];

            const distanciaKM = getKilometersDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              eventLat,
              eventLng,
            );

            if (distanciaKM <= RADIO_MAXIMO_KM) {
              markers.push({
                id: e._id,
                longitude: eventLng,
                latitude: eventLat,
                title: e.title || 'Evento',
              });

              items.push({
                type: 'event',
                id: e._id,
                name: e.title,
                direccion: e.direccionExacta,
              });
            }
          }
        });
      }

      setFollowingItems(items);
      setEventMarkers(markers);
    } catch (error) {
      console.error('Error fetching dashboard feed:', error);
    }
  };

  const onSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
      setSearchQuery('');
    }
  };

  if (loadingLocation) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5EBF4',
        }}
      >
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#7c3aed', fontWeight: '600' }}>
          Consultando tu ubicación exacta...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>
        {t('dash_header')}
      </Text>
      {/* La barra de busqueda por titulo*/}
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
            onPress={() => navigation.navigate('Search', { openFilters: true })}
          />
        )}
      />

      {/* Alerta de Error de GPS (Solo aparece si falla la ubicación) */}
      {locationError && (
        <Card style={[styles.card, { borderColor: '#ef4444', borderWidth: 1 }]}>
          <Card.Content>
            <Text style={{ color: '#ef4444' }}>⚠️ {locationError}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Tarjetas de Accesos Rápidos */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{t('dash_sales_title')}</Text>
          <Text variant="bodyMedium">{t('dash_sales_desc')}</Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            buttonColor="#D183BA"
            onPress={() => navigation.navigate('BooksForSale' as never)}
          >
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
          <Button
            mode="contained"
            buttonColor="#D183BA"
            onPress={() => navigation.navigate('BooksForRent' as never)}
          >
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
          <Button
            mode="contained"
            buttonColor="#D183BA"
            onPress={() => navigation.navigate('AddBook' as never)}
          >
            {t('dash_add_btn')}
          </Button>
        </Card.Actions>
      </Card>

      {/* Sección de Eventos Literarios */}
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#7c3aed' }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ color: '#7c3aed', fontWeight: 'bold' }}>
            {t('dash_events_title', { defaultValue: 'Eventos Cercanos a ti' })}
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 10 }}>
            Mostrando reuniones literarias vigentes a menos de {RADIO_MAXIMO_KM} km de tu ubicación
            real.
          </Text>

          {/* El mapa se muestra incondicionalmente siempre que tengamos las coordenadas base */}
          {userLocation ? (
            <View style={styles.mapWrapper}>
              <MultiEventMap
                markers={eventMarkers}
                userLatitude={userLocation.latitude}
                userLongitude={userLocation.longitude}
              />
            </View>
          ) : null}

          {eventMarkers.length === 0 && (
            <Text
              style={{ fontStyle: 'italic', color: '#888', marginTop: 12, textAlign: 'center' }}
            >
              ℹ️ No se han encontrado eventos próximos en un rango de {RADIO_MAXIMO_KM} km a la
              redonda. Puedes ver tu posición en el mapa.
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            buttonColor="#7c3aed"
            onPress={() => navigation.navigate('Discover' as never)}
          >
            {t('dash_events_btn', { defaultValue: 'Explorar Todos' })}
          </Button>
        </Card.Actions>
        <IconButton
          icon="plus"
          size={30}
          mode="contained"
          containerColor="#7c3aed"
          iconColor="#ffffff"
          onPress={() => navigation.navigate('CreateEventScreen')}
        />
      </Card>

      {/* Feed dinámico inferior */}
      <Text variant="titleLarge" style={[styles.header, { marginTop: 10 }]}>
        {t('following_title')}
      </Text>
      <Card style={[styles.card, { padding: 10 }]}>
        {followingItems.length === 0 ? (
          <Text style={{ fontStyle: 'italic', color: '#888', padding: 10 }}>
            {t('following_empty')}
          </Text>
        ) : (
          <View>
            {followingItems
              .slice((followingPage - 1) * itemsPerPage, followingPage * itemsPerPage)
              .map((item, index) => (
                <View key={`${item.type}-${item.id}-${index}`} style={styles.followingItem}>
                  <Text style={{ fontSize: 20 }}>
                    {item.type === 'user'
                      ? '👤 '
                      : item.type === 'author'
                        ? '✍️ '
                        : item.type === 'event'
                          ? '📅 '
                          : '🏷️ '}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      variant="bodyLarge"
                      style={{ fontWeight: item.type === 'event' ? 'bold' : 'normal' }}
                    >
                      {item.name}
                    </Text>
                    {item.type === 'event' && (
                      <Text variant="bodySmall" numberOfLines={1} style={{ color: '#666' }}>
                        {item.direccion}
                      </Text>
                    )}
                  </View>

                  {item.type === 'user' && (
                    <Button
                      mode="text"
                      compact
                      onPress={() => navigation.navigate('Profile', { userId: item.id })}
                    >
                      {t('view')}
                    </Button>
                  )}
                  {item.type === 'event' && (
                    <Button
                      mode="text"
                      textColor="#7c3aed"
                      compact
                      onPress={() => navigation.navigate('EventDetail', { eventoId: item.id })}
                    >
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
                  onPress={() => setFollowingPage((prev) => prev - 1)}
                  style={styles.pageBtn}
                >
                  {'<'}
                </Button>
                <Text style={{ alignSelf: 'center', marginHorizontal: 15 }}>
                  {followingPage} / {Math.ceil(followingItems.length / itemsPerPage)}
                </Text>
                <Button
                  mode="outlined"
                  disabled={followingPage >= Math.ceil(followingItems.length / itemsPerPage)}
                  onPress={() => setFollowingPage((prev) => prev + 1)}
                  style={styles.pageBtn}
                >
                  {'>'}
                </Button>
              </View>
            )}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5EBF4' },
  header: { marginBottom: 20, fontWeight: 'bold', color: '#D6AED2' },
  card: { marginBottom: 16, backgroundColor: '#ffffff' },
  searchBar: { marginBottom: 20, elevation: 4, backgroundColor: '#fff', borderRadius: 30 },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  pageBtn: { borderColor: '#D183BA' },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb',
  },
});
