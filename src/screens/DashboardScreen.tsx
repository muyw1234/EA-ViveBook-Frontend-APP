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

  const DEFAULT_LOCATION = { latitude: 41.3851, longitude: 2.1734 };

  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  }>(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = React.useState<'loading' | 'success' | 'error'>(
    'loading',
  );

  const RADIO_MAXIMO_KM = 15;

  // 1. Efecto para escuchar y actualizar la posición GPS en tiempo real
  useFocusEffect(
    React.useCallback(() => {
      // Cargar datos del feed inmediatamente usando las coordenadas actuales
      fetchDashboardData(userLocation);

      let locationSubscriber: Location.LocationSubscription | null = null;
      let isTimedOut = false;
      const timeoutVal = 4000; // 4 segundos de timeout para evitar esperas largas

      const timer = setTimeout(() => {
        isTimedOut = true;
        console.warn('Timeout de ubicación superado. Usando ubicación actual.');
        setLocationStatus('error');
      }, timeoutVal);

      async function requestAndFetchLocation() {
        try {
          // Comprobar si ya se tienen permisos concedidos previamente
          const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Location.requestForegroundPermissionsAsync();
            finalStatus = status;
          }

          if (isTimedOut) return;

          if (finalStatus !== 'granted') {
            clearTimeout(timer);
            setLocationStatus('error');
            return;
          }

          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (isTimedOut) return;

          if (!servicesEnabled) {
            clearTimeout(timer);
            setLocationStatus('error');
            return;
          }

          const currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isTimedOut) return;

          clearTimeout(timer);
          setLocationStatus('success');

          const newCoords = {
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude,
          };
          setUserLocation(newCoords);

          locationSubscriber = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 15000,
              distanceInterval: 50,
            },
            (location: Location.LocationObject) => {
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            },
          );
        } catch (err) {
          if (isTimedOut) return;
          clearTimeout(timer);
          console.error('Error en geolocalización:', err);
          setLocationStatus('error');
        }
      }

      requestAndFetchLocation();
      return () => {
        clearTimeout(timer);
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
    }, [userLocation]),
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

      const items: any[] = [];
      const markers: MapMarkerData[] = [];

      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      const currentUserId = user?._id || user?.data?._id;

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

          // ─── FILTRO DE DISTANCIA GEOGRÁFICA PARA EL MAPA ───
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
            }
          }

          // ─── FILTRO DE EVENTOS APUNTADOS PARA LA LISTA (SIGUIENDO) ───
          const isAttending = (e.participant || [])
            .map((p: any) => (p._id || p).toString())
            .includes(currentUserId?.toString());

          if (isAttending) {
            items.push({
              type: 'event',
              id: e._id,
              name: e.title,
              direccion: e.direccionExacta,
            });
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
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#D183BA' }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ color: '#D183BA', fontWeight: 'bold' }}>
            {t('dash_events_title', { defaultValue: 'Eventos Cercanos a ti' })}
          </Text>

          {locationStatus === 'loading' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <ActivityIndicator size="small" color="#D183BA" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, color: '#D183BA', fontStyle: 'italic' }}>
                Consultando tu ubicación exacta...
              </Text>
            </View>
          )}

          {locationStatus === 'error' && (
            <View
              style={{
                marginBottom: 10,
                padding: 8,
                backgroundColor: '#f3e8ff',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#6b21a8', fontSize: 13 }}>
                ℹ️ Ubicación no disponible, mostrando resultados generales.
              </Text>
            </View>
          )}

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
            buttonColor="#D183BA"
            onPress={() => navigation.navigate('ExploreEvents' as never)}
          >
            {t('dash_events_btn', { defaultValue: 'Explorar Todos' })}
          </Button>
        </Card.Actions>
        <IconButton
          icon="plus"
          size={30}
          mode="contained"
          containerColor="#D183BA"
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
          <Text style={{ fontStyle: 'italic', color: '#888', padding: 10, textAlign: 'center' }}>
            No estás apuntado a ningún evento todavía
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
                      textColor="#D183BA"
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
