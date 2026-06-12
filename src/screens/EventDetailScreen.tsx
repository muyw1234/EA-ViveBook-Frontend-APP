import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Avatar, ActivityIndicator, Divider, Card } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventoService, { IEvento } from '../services/evento';
import { styles as globalStyles } from '../../styles/default';
import EventMap from './EventMap';
import axios from 'axios';

export default function EventDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { eventoId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [event, setEvent] = useState<IEvento | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null); // State to store public creator details if needed

  useEffect(() => {
    if (eventoId) {
      initScreen();
    } else {
      Alert.alert(t('error'), t('event_id_missing'));
      navigation.goBack();
    }
  }, [eventoId]);

  const fetchCreatorProfile = async (creatorId: string, userToken: string) => {
    try {
      const response = await axios.get(`http://localhost:8081/usuarios/${creatorId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.data) {
        console.log('Creator profile loaded:', response.data);
        setCreatorProfile(response.data); // Save to state if you want to use it elsewhere
      }
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const initScreen = async () => {
    try {
      setLoading(true);

      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (userStr) {
        const parsedUser = JSON.parse(userStr);

        const userId = parsedUser._id || parsedUser.data?._id || null;

        console.log('👤 ID de usuario detectado y asignado:', userId);
        setCurrentUserId(userId);
      }

      const eventData = await EventoService.getEvento(eventoId);
      setEvent(eventData);

      if (eventData && eventData.creator && token) {
        const cId =
          typeof eventData.creator === 'string' ? eventData.creator : eventData.creator._id;
        if (cId) {
          await fetchCreatorProfile(cId, token);
        }
      }
    } catch (error) {
      console.error('Error inicializando pantalla de detalle:', error);
      Alert.alert(t('error'), t('error_fetch_event'));
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyParticipating =
    event?.participant?.some((p) => (typeof p === 'string' ? p : p._id) === currentUserId) || false;

  const handleParticipate = async () => {
    if (!event) {
      Alert.alert('Error de estado', 'El objeto del evento no está cargado.');
      return;
    }
    if (!currentUserId) {
      Alert.alert('Error de sesión', 'No se encontró tu ID de usuario en la sesión actual.');
      return;
    }

    try {
      console.log(
        ' Botón pulsado. Intentando unirse al evento:',
        event._id,
        'con el usuario:',
        currentUserId,
      );
      setActionLoading(true);

      const updatedEvent = await EventoService.participateEvento(event._id, currentUserId);
      console.log(' Respuesta del servicio recibida:', updatedEvent);

      setEvent(updatedEvent);
      Alert.alert(t('success'), t('joined_event_success'));
    } catch (error: any) {
      console.error(' Error en handleParticipate:', error);
      Alert.alert(t('error'), t('error_joining_event'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!event || !currentUserId) return;
    try {
      setActionLoading(true);
      const updatedEvent = await EventoService.leaveEvento(event._id, currentUserId);

      if (updatedEvent && updatedEvent._id) {
        setEvent(updatedEvent);
      } else {
        setEvent((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            participant: prev.participant.filter((p) =>
              typeof p === 'string' ? p !== currentUserId : p._id !== currentUserId,
            ),
          };
        });
      }
      Alert.alert(t('info'), t('left_event_success'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('error_leaving_event'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[globalStyles.container, styles.centered]}>
        <Text variant="bodyLarge">{t('event_not_found')}</Text>
      </View>
    );
  }

  const hasCoordinates =
    event.location && event.location.coordinates && event.location.coordinates.length === 2;

  const longitude = hasCoordinates ? event.location.coordinates[0] : 0;
  const latitude = hasCoordinates ? event.location.coordinates[1] : 0;

  const creatorId = event.creator && typeof event.creator !== 'string' ? event.creator._id : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {/* Cabecera del Evento */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              {event.title}
            </Text>

            <Text variant="bodyMedium" style={styles.date}>
              📅 {new Date(event.eventDate).toLocaleDateString()} -{' '}
              {new Date(event.eventDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>

            {/* SECCIÓN DEL CREADOR DEL EVENTO */}
            {event.creator && (
              <TouchableOpacity
                style={styles.creatorContainer}
                disabled={!creatorId}
                onPress={() => navigation.navigate('UserProfile', { userId: creatorId })}
                activeOpacity={0.7}
              >
                <Avatar.Text
                  size={36}
                  label={(typeof event.creator === 'string' ? 'U' : event.creator.name || 'U')
                    .substring(0, 2)
                    .toUpperCase()}
                  style={{ backgroundColor: '#D183BA' }}
                  labelStyle={{ fontSize: 14 }}
                />
                <View style={styles.creatorInfo}>
                  <Text variant="bodySmall" style={styles.creatorLabel}>
                    {t('Organizado por', { defaultValue: 'Organizado por' })}
                  </Text>
                  <Text variant="titleMedium" style={styles.creatorName}>
                    {typeof event.creator === 'string' ? event.creator : event.creator.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <Divider style={{ marginVertical: 12 }} />

            <Text variant="bodyLarge" style={styles.description}>
              {event.description}
            </Text>

            <Text variant="bodyMedium" style={styles.location}>
              📍 {event.direccionExacta}
            </Text>

            {/* Renderizado del Mapa */}
            {hasCoordinates ? (
              <View style={styles.mapWrapper}>
                <EventMap
                  latitude={latitude}
                  longitude={longitude}
                  title={event.title}
                  description={event.direccionExacta}
                />
              </View>
            ) : (
              <Text style={styles.noMapText}>
                ⚠️{' '}
                {t('no_coordinates_available', { defaultValue: 'Ubicación en mapa no disponible' })}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Sección de Participantes */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                {t('participants')} ({event.participant?.length || 0})
              </Text>

              {event.participant && event.participant.length > 0 ? (
                event.participant.map((usuario) => {
                  const userId = typeof usuario === 'string' ? usuario : usuario._id;
                  const userName =
                    typeof usuario === 'string' ? t('user') : usuario.name || t('user');
                  return (
                    <TouchableOpacity
                      key={userId}
                      style={styles.itemRow}
                      onPress={() => navigation.navigate('UserProfile', { userId })}
                    >
                      <View style={styles.itemLeft}>
                        <Avatar.Text
                          size={40}
                          label={(userName || 'U').substring(0, 2).toUpperCase()}
                          style={{ backgroundColor: '#D183BA' }}
                        />
                        <Text variant="titleMedium" style={{ marginLeft: 14 }}>
                          {userName}
                        </Text>
                      </View>
                      <Button mode="text" textColor="#64748b" compact>
                        {t('view')}
                      </Button>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>{t('be_the_first_participant')}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Zona del Botón de Acción Fijo Inferior */}
      <View style={styles.footer}>
        {isAlreadyParticipating ? (
          <Button
            mode="contained"
            buttonColor="#fee2e2"
            onPress={() => {
              console.log('👉 Click detectado en: Cancelar Participación');
              handleLeave();
            }}
            loading={actionLoading}
            disabled={actionLoading}
            style={[styles.actionButton, { borderWidth: 1, borderColor: '#fca5a5' }]}
            labelStyle={{ fontSize: 16, fontWeight: 'bold', color: '#dc2626' }}
            icon={() => <Text style={{ fontSize: 18 }}>➖</Text>}
          >
            {t('leave_event', 'Abandonar evento')}
          </Button>
        ) : (
          <Button
            mode="contained"
            buttonColor="#D183BA"
            onPress={() => {
              console.log('👉 Click detectado en: Unirse al Evento');
              handleParticipate();
            }}
            loading={actionLoading}
            disabled={actionLoading === true}
            style={styles.actionButton}
            labelStyle={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}
            icon={() => <Text style={{ fontSize: 18 }}>➕</Text>}
          >
            {t('join_event', 'Apuntarse al evento')}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  date: {
    color: '#D183BA',
    fontWeight: '700',
    marginBottom: 15,
  },
  description: {
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 15,
  },
  location: {
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  noMapText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5ebf4',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#f5ebf4',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    borderRadius: 26,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5ebf4',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e8d5e5',
  },
  creatorInfo: {
    marginLeft: 12,
  },
  creatorLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  creatorName: {
    fontWeight: 'bold',
    color: '#D183BA',
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb',
  },
});
