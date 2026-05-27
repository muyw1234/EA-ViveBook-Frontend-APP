import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Avatar, ActivityIndicator, Divider, Card } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventoService, { IEvento } from '../services/evento';
import { styles as globalStyles } from '../../styles/default';
import EventMap from './EventMap'; // Tu componente unificado móvil/web

export default function EventDetailScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    
    const { eventoId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [event, setEvent] = useState<IEvento | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (eventoId) {
            initScreen();
        } else {
            Alert.alert(t('error'), t('event_id_missing'));
            navigation.goBack();
        }
    }, [eventoId]);

    const initScreen = async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const parsedUser = JSON.parse(userStr);
                setCurrentUserId(parsedUser._id);
            }

            const eventData = await EventoService.getEvento(eventoId);
            setEvent(eventData);
        } catch (error) {
            console.error("Error inicializando pantalla de detalle:", error);
            Alert.alert(t('error'), t('error_fetch_event'));
        } finally {
            setLoading(false);
        }
    };

    const isAlreadyParticipating = event?.participant?.some(
        (p) => (typeof p === 'string' ? p : p._id) === currentUserId
    ) || false;

    const handleParticipate = async () => {
        if (!event || !currentUserId) return;
        try {
            setActionLoading(true);
            const updatedEvent = await EventoService.participateEvento(event._id, currentUserId);
            setEvent(updatedEvent);
            Alert.alert(t('success'), t('joined_event_success'));
        } catch (error) {
            console.error(error);
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
                        participant: prev.participant.filter((p) => (typeof p === 'string' ? p !== currentUserId : p._id !== currentUserId))
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

    // Extraemos las coordenadas de GeoJSON [longitud, latitud]
    const hasCoordinates = event.location && 
                           event.location.coordinates && 
                           event.location.coordinates.length === 2;

    const longitude = hasCoordinates ? event.location.coordinates[0] : 0;
    const latitude = hasCoordinates ? event.location.coordinates[1] : 0;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Cabecera del Evento */}
                <Card style={styles.card} mode="elevated">
                    <Card.Content>
                        <Text variant="headlineMedium" style={styles.title}>{event.title}</Text>
                        <Text variant="bodyMedium" style={styles.date}>
                            📅 {new Date(event.eventDate).toLocaleDateString()} - {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text variant="bodyLarge" style={styles.description}>{event.description}</Text>
                        <Text variant="bodyMedium" style={styles.location}>
                            📍 {event.direccionExacta}
                        </Text>
                        
                        {/* Renderizado del Mapa */}
                        {hasCoordinates ? (
                            <EventMap 
                                latitude={latitude}
                                longitude={longitude}
                                title={event.title}
                                description={event.direccionExacta}
                            />
                        ) : (
                            <Text style={styles.noMapText}>
                                ⚠️ {t('no_coordinates_available', { defaultValue: 'Ubicación en mapa no disponible' })}
                            </Text>
                        )}
                    </Card.Content>
                </Card>

                <Divider style={{ marginVertical: 20 }} />

                {/* Sección de Participantes */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                        {t('participants')} ({event.participant?.length || 0})
                    </Text>
                    
                    {event.participant && event.participant.length > 0 ? (
                        event.participant.map((usuario) => {
                            const userId = typeof usuario === 'string' ? usuario : usuario._id;
                            const userName = typeof usuario === 'string' ? t('user') : usuario.name || t('user');
                            return (
                                <TouchableOpacity 
                                    key={userId} 
                                    style={styles.itemRow}
                                    onPress={() => navigation.navigate("UserProfile", { userId })}
                                >
                                    <View style={styles.itemLeft}>
                                        <Avatar.Text 
                                            size={40} 
                                            label={(userName || "U").substring(0, 2).toUpperCase()} 
                                            style={{ backgroundColor: '#D183BA' }} 
                                        />
                                        <Text variant="titleMedium" style={{ marginLeft: 14 }}>{userName}</Text>
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
            </ScrollView>

            {/* Zona del Botón de Acción Fijo Inferior */}
            <View style={styles.footer}>
                {isAlreadyParticipating ? (
                    <Button 
                        mode="outlined" 
                        onPress={handleLeave}
                        loading={actionLoading}
                        disabled={actionLoading}
                        textColor="#b91c1c"
                        style={[styles.actionButton, { borderColor: '#b91c1c' }]}
                    >
                        {t('leave_event')}
                    </Button>
                ) : (
                    <Button 
                        mode="contained" 
                        buttonColor="#D183BA" 
                        onPress={handleParticipate}
                        loading={actionLoading}
                        disabled={actionLoading}
                        style={styles.actionButton}
                    >
                        {t('join_event')}
                    </Button>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fcf8fa',
        borderRadius: 12,
    },
    title: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    date: {
        color: '#7c3aed',
        fontWeight: '600',
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
    },
    section: {
        marginBottom: 10
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 15
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    emptyText: {
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 5,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    actionButton: {
        width: '100%',
        paddingVertical: 4,
    }
});