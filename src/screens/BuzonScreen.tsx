import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, RefreshControl, Alert, PanResponder, Animated, DeviceEventEmitter } from 'react-native';
import { TextInput, IconButton, Surface, SegmentedButtons, Card, Button, Portal, Modal, Chip } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../services/socket';
import api from '../services/api';

function SwipeableRow({ children, onDelete, style }: { children: React.ReactNode; onDelete: () => void; style?: any }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteButtonWidth = 80;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -deleteButtonWidth));
                } else {
                    translateX.setValue(Math.min(gestureState.dx, 0));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -deleteButtonWidth / 2) {
                    Animated.spring(translateX, {
                        toValue: -deleteButtonWidth,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                }
            },
        })
    ).current;

    const handleClose = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
        }).start();
    };

    const handleDeletePress = () => {
        handleClose();
        onDelete();
    };

    return (
        <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
            <View style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: deleteButtonWidth,
                backgroundColor: '#ef4444',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }} onPress={handleDeletePress}>
                    <IconButton icon="delete" iconColor="white" size={24} />
                </TouchableOpacity>
            </View>
            <Animated.View
                style={{ backgroundColor: 'transparent', transform: [{ translateX }] }}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
}

export default function BuzonScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [mode, setMode] = useState<'chat' | 'reservas'>('chat');

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                onConfirm();
            }
        } else {
            Alert.alert(
                title,
                message,
                [
                    { text: t('cancel', 'Cancelar'), style: 'cancel' },
                    { text: 'Aceptar', style: 'destructive', onPress: onConfirm }
                ]
            );
        }
    };
    
    // Chat States (from ChatRoomScreen)
    const chatId = '000000000000000000000001'; // Global Chat ID
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Reservation States
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [reservationMessages, setReservationMessages] = useState<any[]>([]);
    const [loadingReservas, setLoadingReservas] = useState(false);
    const [refreshingReservas, setRefreshingReservas] = useState(false);
    
    // Dialog State for accepting reservation
    const [acceptDialogVisible, setAcceptDialogVisible] = useState(false);
    const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);
    const [reservaDias, setReservaDias] = useState('7');
    const [accepting, setAccepting] = useState(false);

    // Initial setup and socket connection
    useEffect(() => {
        const setupUser = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserId(user._id);
            }
        };
        setupUser();
    }, []);

    // Chat socket effect
    useEffect(() => {
        if (!userId) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('join_chat', chatId);

        const handleReceiveMessage = (message: any) => {
            if (message.category === 'reservation') {
                fetchReservations();
                fetchReservationMessages();
                if (mode === 'reservas') {
                    api.patch('/reservas/read')
                        .then(() => DeviceEventEmitter.emit('unread_change'))
                        .catch(() => {});
                } else {
                    DeviceEventEmitter.emit('unread_change');
                }
            } else {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                if (mode === 'chat') {
                    api.patch(`/mensajes/chat/${chatId}/read`)
                        .then(() => DeviceEventEmitter.emit('unread_change'))
                        .catch(() => {});
                    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
                } else {
                    DeviceEventEmitter.emit('unread_change');
                }
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [mode, userId]);

    // Reservations / Chat mode mark as read and fetch effect
    useEffect(() => {
        if (!userId) return;
        if (mode === 'reservas') {
            fetchAllData();
            api.patch('/reservas/read')
                .then(() => DeviceEventEmitter.emit('unread_change'))
                .catch(() => {});
        } else if (mode === 'chat') {
            const fetchMessages = async () => {
                try {
                    const response = await api.get(`/mensajes/chat/${chatId}`);
                    setMessages(response.data?.data || response.data || []);
                    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
                } catch (error) {
                    console.error(t('chat_error_load'));
                }
            };
            fetchMessages();
            api.patch(`/mensajes/chat/${chatId}/read`)
                .then(() => DeviceEventEmitter.emit('unread_change'))
                .catch(() => {});
        }
    }, [mode, userId]);

    // Reservations fetch logic
    const fetchReservations = async () => {
        if (!userId) return;
        setLoadingReservas(true);
        try {
            const receivedResponse = await api.get('/reservas/recibidas');
            const received = receivedResponse.data?.data || receivedResponse.data;
            setReceivedRequests(Array.isArray(received) ? received : []);

            const sentResponse = await api.get('/reservas/solicitadas');
            const sent = sentResponse.data?.data || sentResponse.data;
            setSentRequests(Array.isArray(sent) ? sent : []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoadingReservas(false);
            setRefreshingReservas(false);
        }
    };

    const fetchReservationMessages = async () => {
        if (!userId) return;
        try {
            const response = await api.get('/mensajes/reservas');
            setReservationMessages(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching reservation messages:', error);
        }
    };

    const fetchAllData = async () => {
        if (!userId) return;
        await fetchReservations();
        await fetchReservationMessages();
    };

    useFocusEffect(
        useCallback(() => {
            if (!userId) return;
            if (mode === 'reservas') {
                fetchAllData();
                api.patch('/reservas/read')
                    .then(() => DeviceEventEmitter.emit('unread_change'))
                    .catch(() => {});
            } else if (mode === 'chat') {
                api.patch(`/mensajes/chat/${chatId}/read`)
                    .then(() => DeviceEventEmitter.emit('unread_change'))
                    .catch(() => {});
            }
        }, [mode, userId])
    );

    const onRefreshReservas = () => {
        setRefreshingReservas(true);
        fetchAllData();
    };

    // Chat Actions
    const sendMessage = () => {
        if (newMessage.trim() && userId) {
            socket.emit('send_message', {
                chatId,
                senderId: userId,
                content: newMessage.trim()
            });
            setNewMessage('');
        }
    };

    // Reservation Actions
    const handleOpenAcceptDialog = (reservaId: string) => {
        setSelectedReservaId(reservaId);
        setReservaDias('7');
        setAcceptDialogVisible(true);
    };

    const handleConfirmAccept = async () => {
        if (!selectedReservaId) return;
        setAccepting(true);
        try {
            await api.post(`/reservas/aceptar/${selectedReservaId}`, {
                dias: parseInt(reservaDias) || 7
            });
            showAlert(t('success'), t('reservation_accepted', 'Reserva aceptada correctamente'));
            setAcceptDialogVisible(false);
            fetchAllData();
        } catch (error) {
            console.error('Error accepting reservation:', error);
            showAlert(t('error'), t('reserve_err', 'No se pudo aceptar la reserva'));
        } finally {
            setAccepting(false);
        }
    };

    const handleReject = async (reservaId: string) => {
        showConfirm(
            t('reject_reservation', 'Rechazar Reserva'),
            '¿Seguro que quieres rechazar esta solicitud de reserva?',
            async () => {
                try {
                    await api.post(`/reservas/rechazar/${reservaId}`);
                    showAlert(t('success'), t('reservation_rejected', 'Reserva rechazada'));
                    fetchAllData();
                } catch (error) {
                    console.error('Error rejecting reservation:', error);
                    showAlert(t('error'), t('reserve_err'));
                }
            }
        );
    };

    // Swipe deletions
    const handleDeleteMessage = async (messageId: string) => {
        try {
            await api.delete(`/mensajes/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
            setReservationMessages(prev => prev.filter(m => m._id !== messageId));
            DeviceEventEmitter.emit('unread_change');
        } catch (error) {
            console.error('Error deleting message:', error);
            showAlert('Error', 'No se pudo eliminar el mensaje');
        }
    };

    const handleDeleteReservation = async (reservaId: string) => {
        try {
            await api.delete(`/reservas/${reservaId}`);
            setReceivedRequests(prev => prev.filter(r => r._id !== reservaId));
            setSentRequests(prev => prev.filter(r => r._id !== reservaId));
            DeviceEventEmitter.emit('unread_change');
        } catch (error) {
            console.error('Error deleting reservation:', error);
            showAlert('Error', 'No se pudo eliminar la reserva');
        }
    };

    // Rendering Helpers
    const renderMessage = ({ item }: any) => {
        const isMine = item.sender?._id === userId || item.sender === userId;
        const senderName = item.sender?.name || 'Usuario';

        return (
            <SwipeableRow style={{ marginVertical: 5 }} onDelete={() => handleDeleteMessage(item._id)}>
                <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage, { width: '100%', paddingHorizontal: 12, marginVertical: 0 }]}>
                    {!isMine && <Text style={styles.senderName}>{senderName}</Text>}
                    <Surface style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                        <Text style={isMine ? styles.myText : styles.theirText}>{item.content}</Text>
                    </Surface>
                    <Text style={styles.timestamp}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </SwipeableRow>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACEPTADA':
                return { bg: '#def7ec', text: '#03543f' };
            case 'RECHAZADA':
                return { bg: '#fde8e8', text: '#9b1c1c' };
            default:
                return { bg: '#e5e7eb', text: '#374151' };
        }
    };

    const renderChatSection = () => (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.flexContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatListContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder={t('chat_placeholder')}
                    mode="outlined"
                    style={styles.input}
                    dense
                    outlineColor="#D183BA"
                    activeOutlineColor="#D183BA"
                />
                <IconButton
                    icon="send"
                    mode="contained"
                    containerColor="#D183BA"
                    iconColor="white"
                    onPress={sendMessage}
                    disabled={!newMessage.trim()}
                />
            </View>
        </KeyboardAvoidingView>
    );

    const renderReservasSection = () => (
        <ScrollView 
            style={styles.flexContainer}
            contentContainerStyle={styles.reservasContainer}
            refreshControl={
                <RefreshControl refreshing={refreshingReservas} onRefresh={onRefreshReservas} colors={["#D183BA"]} />
            }
        >
            {/* Solicitude Recibidas */}
            <Text variant="titleMedium" style={styles.sectionHeader}>{t('received_requests', 'Solicitudes Recibidas')}</Text>
            {receivedRequests.length === 0 ? (
                <Text style={styles.emptyText}>No tienes solicitudes de reserva pendientes.</Text>
            ) : (
                receivedRequests.map((res: any) => {
                    const statusColor = getStatusColor(res.estado);
                    return (
                        <SwipeableRow key={res._id} style={{ marginBottom: 12 }} onDelete={() => handleDeleteReservation(res._id)}>
                            <Card style={[styles.reservaCard, { marginBottom: 0 }]}>
                                <Card.Content>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{res.libro?.title}</Text>
                                    <Text variant="bodyMedium">Solicitante: {res.usuarioSolicitante?.name || 'Usuario'}</Text>
                                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                                        Fecha solicitud: {new Date(res.fechaSolicitud).toLocaleDateString()}
                                    </Text>
                                    {res.estado === 'ACEPTADA' && res.fechaLimite && (
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }}>
                                            Límite: {new Date(res.fechaLimite).toLocaleDateString()}
                                        </Text>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <Chip 
                                            style={{ backgroundColor: statusColor.bg }} 
                                            textStyle={{ color: statusColor.text, fontWeight: 'bold', fontSize: 11 }}
                                        >
                                            {res.estado}
                                        </Chip>
                                    </View>
                                </Card.Content>
                                {res.estado === 'PENDIENTE' && (
                                    <Card.Actions>
                                        <Button 
                                            mode="outlined" 
                                            textColor="#ef4444"
                                            style={{ borderColor: '#ef4444' }} 
                                            onPress={() => handleReject(res._id)}
                                        >
                                            Rechazar
                                        </Button>
                                        <Button 
                                            mode="contained" 
                                            buttonColor="#D183BA" 
                                            onPress={() => handleOpenAcceptDialog(res._id)}
                                        >
                                            Aceptar
                                        </Button>
                                    </Card.Actions>
                                )}
                            </Card>
                        </SwipeableRow>
                    );
                })
            )}

            {/* Solicitude Enviadas */}
            <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 24 }]}>{t('sent_requests', 'Solicitudes Enviadas')}</Text>
            {sentRequests.length === 0 ? (
                <Text style={styles.emptyText}>No has solicitado ninguna reserva.</Text>
            ) : (
                sentRequests.map((res: any) => {
                    const statusColor = getStatusColor(res.estado);
                    return (
                        <SwipeableRow key={res._id} style={{ marginBottom: 12 }} onDelete={() => handleDeleteReservation(res._id)}>
                            <Card style={[styles.reservaCard, { marginBottom: 0 }]}>
                                <Card.Content>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{res.libro?.title}</Text>
                                    <Text variant="bodyMedium">Propietario: {res.propietario?.name || 'Vendedor'}</Text>
                                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                                        Fecha solicitud: {new Date(res.fechaSolicitud).toLocaleDateString()}
                                    </Text>
                                    {res.estado === 'ACEPTADA' && res.fechaLimite && (
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }}>
                                            Límite: {new Date(res.fechaLimite).toLocaleDateString()}
                                        </Text>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <Chip 
                                            style={{ backgroundColor: statusColor.bg }} 
                                            textStyle={{ color: statusColor.text, fontWeight: 'bold', fontSize: 11 }}
                                        >
                                            {res.estado}
                                        </Chip>
                                    </View>
                                </Card.Content>
                            </Card>
                        </SwipeableRow>
                    );
                })
            )}

            {/* Mensajes y Avisos de Reservas */}
            <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 24 }]}>Mensajes y Avisos</Text>
            {reservationMessages.length === 0 ? (
                <Text style={styles.emptyText}>No tienes mensajes de reservas.</Text>
            ) : (
                reservationMessages.map((msg: any) => {
                    const isMine = msg.sender?._id === userId || msg.sender === userId;
                    const senderName = msg.sender?.name || 'Sistema';
                    return (
                        <SwipeableRow key={msg._id} style={{ marginBottom: 12 }} onDelete={() => handleDeleteMessage(msg._id)}>
                            <Card style={[styles.reservaCard, { backgroundColor: isMine ? '#fce7f3' : '#fff', marginBottom: 0 }]}>
                                <Card.Content style={{ paddingVertical: 10 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#D183BA' }}>
                                            {senderName}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#888' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={{ marginTop: 4 }}>{msg.content}</Text>
                                </Card.Content>
                            </Card>
                        </SwipeableRow>
                    );
                })
            )}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <SegmentedButtons
                    value={mode}
                    onValueChange={(val: any) => setMode(val)}
                    buttons={[
                        { value: 'chat', label: 'Chat Global', checkedColor: '#fff', uncheckedColor: '#555' },
                        { value: 'reservas', label: 'Reservas', checkedColor: '#fff', uncheckedColor: '#555' },
                    ]}
                    style={styles.segmented}
                    theme={{ colors: { secondaryContainer: '#D183BA', onSecondaryContainer: '#ffffff' } }}
                />
            </View>

            {mode === 'chat' ? renderChatSection() : renderReservasSection()}

            <Portal>
                <Modal
                    visible={acceptDialogVisible}
                    onDismiss={() => !accepting && setAcceptDialogVisible(false)}
                    contentContainerStyle={styles.dialogContent}
                >
                    <Text variant="titleLarge" style={styles.dialogTitle}>{t('accept_reservation', 'Aceptar Reserva')}</Text>
                    <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                        {t('enter_duration_days', 'Introduce los días de validez para la reserva:')}
                    </Text>
                    <TextInput
                        label="Días"
                        value={reservaDias}
                        onChangeText={setReservaDias}
                        keyboardType="numeric"
                        mode="outlined"
                        style={{ marginBottom: 20 }}
                        outlineColor="#D183BA"
                        activeOutlineColor="#D183BA"
                    />
                    <View style={styles.dialogActions}>
                        <Button 
                            onPress={() => setAcceptDialogVisible(false)} 
                            disabled={accepting}
                            textColor="#666"
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={handleConfirmAccept}
                            loading={accepting}
                            disabled={accepting}
                            buttonColor="#D183BA"
                        >
                            Aceptar
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EBF4',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    segmented: {
        width: '100%',
    },
    flexContainer: {
        flex: 1,
    },
    chatListContent: {
        padding: 10,
    },
    messageContainer: {
        marginVertical: 5,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    theirMessage: {
        alignSelf: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D183BA',
        marginBottom: 2,
        marginLeft: 4,
    },
    bubble: {
        padding: 10,
        borderRadius: 15,
        elevation: 1,
    },
    myBubble: {
        backgroundColor: '#D183BA',
        borderBottomRightRadius: 2,
    },
    theirBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 2,
    },
    myText: {
        color: 'white',
    },
    theirText: {
        color: 'black',
    },
    timestamp: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
        alignSelf: 'flex-end',
        marginRight: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    input: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    reservasContainer: {
        padding: 16,
    },
    sectionHeader: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    reservaCard: {
        marginBottom: 12,
        backgroundColor: '#fff',
        elevation: 1,
        borderRadius: 8,
    },
    emptyText: {
        color: '#888',
        fontStyle: 'italic',
        paddingVertical: 10,
        paddingLeft: 4,
    },
    dialogContent: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 16,
    },
    dialogTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    }
});
