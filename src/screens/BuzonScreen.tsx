import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  PanResponder,
  Animated,
  DeviceEventEmitter,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Surface,
  SegmentedButtons,
  Card,
  Button,
  Portal,
  Modal,
  Chip,
  Avatar,
  List,
  Divider,
} from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../services/socket';
import api from '../services/api';

function SwipeableRow({
  children,
  onDelete,
  style,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  style?: any;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteButtonWidth = 80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10
        );
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
    }),
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
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: deleteButtonWidth,
          backgroundColor: '#ef4444',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          onPress={handleDeletePress}
        >
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
      Alert.alert(title, message, [
        { text: t('cancel', 'Cancelar'), style: 'cancel' },
        { text: 'Aceptar', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  // States
  const [userId, setUserId] = useState<string | null>(null);

  // Private Chats and Message Requests states
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [receivedMsgRequests, setReceivedMsgRequests] = useState<any[]>([]);
  const [sentMsgRequests, setSentMsgRequests] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [refreshingChats, setRefreshingChats] = useState(false);

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

        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('register_user', user._id);
      }
    };
    setupUser();
  }, []);

  // Chat socket effect
  useEffect(() => {
    if (!userId) return;

    const handleReceiveMessage = (message: any) => {
      if (message.category === 'reservation') {
        fetchReservations();
        fetchReservationMessages();
        if (mode === 'reservas') {
          api
            .patch('/reservas/read')
            .then(() => DeviceEventEmitter.emit('unread_change'))
            .catch(() => {});
        } else {
          DeviceEventEmitter.emit('unread_change');
        }
      } else {
        fetchMessageRequestsAndChats();
        DeviceEventEmitter.emit('unread_change');
      }
    };

    const handleNewMessageRequest = () => {
      fetchMessageRequestsAndChats();
      DeviceEventEmitter.emit('unread_change');
    };

    const handleNewChatNotification = () => {
      fetchMessageRequestsAndChats();
      DeviceEventEmitter.emit('unread_change');
    };

    const handleMessageRequestUpdate = () => {
      fetchMessageRequestsAndChats();
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newMessageRequest', handleNewMessageRequest);
    socket.on('newChatNotification', handleNewChatNotification);
    socket.on('newMessageRequestUpdate', handleMessageRequestUpdate);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newMessageRequest', handleNewMessageRequest);
      socket.off('newChatNotification', handleNewChatNotification);
      socket.off('newMessageRequestUpdate', handleMessageRequestUpdate);
    };
  }, [mode, userId]);

  // Fetch Chats and requests
  const fetchMessageRequestsAndChats = async () => {
    if (!userId) return;
    try {
      const chatsRes = await api.get('/chats');
      setPrivateChats(chatsRes.data?.data || chatsRes.data || []);

      const receivedRes = await api.get('/message-requests/received');
      setReceivedMsgRequests(receivedRes.data?.data || receivedRes.data || []);

      const sentRes = await api.get('/message-requests/sent');
      setSentMsgRequests(sentRes.data?.data || sentRes.data || []);
    } catch (error) {
      console.error('Error fetching message requests and chats:', error);
    } finally {
      setLoadingChats(false);
      setRefreshingChats(false);
    }
  };

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
    await fetchMessageRequestsAndChats();
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      if (mode === 'reservas') {
        fetchAllData();
        api
          .patch('/reservas/read')
          .then(() => DeviceEventEmitter.emit('unread_change'))
          .catch(() => {});
      } else if (mode === 'chat') {
        fetchMessageRequestsAndChats();
      }
    }, [mode, userId]),
  );

  const onRefreshReservas = () => {
    setRefreshingReservas(true);
    fetchAllData();
  };

  const onRefreshChats = () => {
    setRefreshingChats(true);
    fetchMessageRequestsAndChats();
  };

  // Message Request Actions
  const handleAcceptMsgRequest = async (requestId: string) => {
    try {
      const response = await api.patch(`/message-requests/${requestId}/accept`);
      showAlert(t('success', 'Éxito'), 'Solicitud aceptada correctamente.');
      await fetchMessageRequestsAndChats();
      DeviceEventEmitter.emit('unread_change');

      // Navigate directly to the newly created chat
      const chat = response.data?.data || response.data;
      if (chat && chat._id) {
        navigation.navigate('ChatRoom', { chatId: chat._id });
      }
    } catch (error) {
      console.error('Error accepting message request:', error);
      showAlert(t('error', 'Error'), 'No se pudo aceptar la solicitud de mensaje.');
    }
  };

  const handleDenyMsgRequest = async (requestId: string) => {
    showConfirm(
      'Rechazar solicitud',
      '¿Seguro que quieres rechazar esta solicitud de conversación?',
      async () => {
        try {
          await api.patch(`/message-requests/${requestId}/deny`);
          showAlert(t('success', 'Éxito'), 'Solicitud rechazada.');
          fetchMessageRequestsAndChats();
        } catch (error) {
          console.error('Error denying message request:', error);
          showAlert(t('error', 'Error'), 'No se pudo rechazar la solicitud.');
        }
      },
    );
  };

  const handleDismissMsgRequest = async (requestId: string) => {
    try {
      await api.patch(`/message-requests/${requestId}/dismiss`);
      fetchMessageRequestsAndChats();
    } catch (error) {
      console.error('Error dismissing message request:', error);
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
        dias: parseInt(reservaDias) || 7,
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
      },
    );
  };

  // Swipe deletions
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/mensajes/${messageId}`);
      setReservationMessages((prev) => prev.filter((m) => m._id !== messageId));
      DeviceEventEmitter.emit('unread_change');
    } catch (error) {
      console.error('Error deleting message:', error);
      showAlert('Error', 'No se pudo eliminar el mensaje');
    }
  };

  const handleDeleteReservation = async (reservaId: string) => {
    try {
      await api.delete(`/reservas/${reservaId}`);
      setReceivedRequests((prev) => prev.filter((r) => r._id !== reservaId));
      setSentRequests((prev) => prev.filter((r) => r._id !== reservaId));
      DeviceEventEmitter.emit('unread_change');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showAlert('Error', 'No se pudo eliminar la reserva');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACEPTADA':
      case 'accepted':
        return { bg: '#def7ec', text: '#03543f' };
      case 'RECHAZADA':
      case 'denied':
        return { bg: '#fde8e8', text: '#9b1c1c' };
      default:
        return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  const renderChatSection = () => {
    // Find notices (sent requests that are accepted or denied)
    const notices = sentMsgRequests.filter((req) => req.status !== 'pending');

    return (
      <ScrollView
        style={styles.flexContainer}
        contentContainerStyle={styles.chatsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshingChats}
            onRefresh={onRefreshChats}
            colors={['#D183BA']}
          />
        }
      >
        {/* Global Chat Access */}
        <Card
          style={styles.globalChatCard}
          onPress={() => navigation.navigate('ChatRoom', { chatId: '000000000000000000000001' })}
        >
          <Card.Content style={styles.globalChatContent}>
            <Avatar.Icon
              size={44}
              icon="earth"
              style={{ backgroundColor: '#D183BA' }}
              color="white"
            />
            <View style={styles.globalChatTextContainer}>
              <Text variant="titleMedium" style={styles.globalChatTitle}>
                Chat Global
              </Text>
              <Text variant="bodySmall" style={styles.globalChatSub}>
                Comunidad de ViveBook en tiempo real
              </Text>
            </View>
            <IconButton icon="chevron-right" iconColor="#D183BA" size={24} />
          </Card.Content>
        </Card>

        {/* Avisos de solicitudes de chat */}
        {notices.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Avisos y Actualizaciones
            </Text>
            {notices.map((notice: any) => {
              const isAccepted = notice.status === 'accepted';
              return (
                <Card
                  key={notice._id}
                  style={[
                    styles.noticeCard,
                    {
                      backgroundColor: isAccepted ? '#ecfdf5' : '#fef2f2',
                      borderColor: isAccepted ? '#10b981' : '#f87171',
                    },
                  ]}
                >
                  <Card.Content style={styles.noticeCardContent}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        variant="titleSmall"
                        style={{ fontWeight: 'bold', color: isAccepted ? '#065f46' : '#991b1b' }}
                      >
                        {isAccepted ? 'Solicitud Aceptada 🎉' : 'Solicitud Rechazada ❌'}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{ marginTop: 2, color: isAccepted ? '#047857' : '#b91c1c' }}
                      >
                        {isAccepted
                          ? `${notice.seller?.name || 'El vendedor'} ha aceptado tu solicitud para hablar sobre el libro "${notice.book?.title}". ¡Ya podéis chatear!`
                          : `${notice.seller?.name || 'El vendedor'} ha rechazado tu solicitud de mensaje para el libro "${notice.book?.title}".`}
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      iconColor={isAccepted ? '#047857' : '#b91c1c'}
                      onPress={() => handleDismissMsgRequest(notice._id)}
                    />
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        {/* Solicitudes de mensaje recibidas */}
        {receivedMsgRequests.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Solicitudes de Mensajes
            </Text>
            {receivedMsgRequests.map((req: any) => (
              <Card key={req._id} style={styles.requestCard}>
                <Card.Content>
                  <View style={styles.requestHeader}>
                    <Avatar.Text
                      size={36}
                      label={req.requester?.name?.substring(0, 2).toUpperCase() || 'U'}
                      style={{ backgroundColor: '#D6AED2' }}
                    />
                    <View style={styles.requestHeaderText}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                        {req.requester?.name || 'Usuario'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#666' }}>
                        Libro: <Text style={{ fontWeight: 'bold' }}>{req.book?.title}</Text>
                      </Text>
                    </View>
                  </View>
                  {req.initialMessage ? (
                    <View style={styles.initialMessageBox}>
                      <Text variant="bodyMedium" style={{ fontStyle: 'italic', color: '#555' }}>
                        "{req.initialMessage}"
                      </Text>
                    </View>
                  ) : null}
                  <Text variant="bodySmall" style={styles.requestDate}>
                    Fecha: {new Date(req.createdAt).toLocaleDateString()}
                  </Text>
                </Card.Content>
                <Card.Actions style={styles.requestActions}>
                  <Button
                    mode="outlined"
                    textColor="#ef4444"
                    style={{ borderColor: '#ef4444', flex: 1 }}
                    onPress={() => handleDenyMsgRequest(req._id)}
                  >
                    Rechazar
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor="#D183BA"
                    style={{ flex: 1 }}
                    onPress={() => handleAcceptMsgRequest(req._id)}
                  >
                    Aceptar
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </View>
        )}

        {/* Chats privados activos */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Mensajes Privados
        </Text>
        {privateChats.length === 0 ? (
          <Card style={styles.emptyChatsCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No tienes conversaciones privadas activas.</Text>
              <Text style={styles.emptyTextSub}>
                Solicita hablar con un vendedor desde los detalles de su libro.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          privateChats.map((chat: any) => {
            const otherParticipant = chat.participants?.find((p: any) => p._id !== userId) || {};
            const otherName = otherParticipant.name || 'Usuario';
            const firstLetters = otherName.substring(0, 2).toUpperCase() || 'U';

            return (
              <TouchableOpacity
                key={chat._id}
                onPress={() => navigation.navigate('ChatRoom', { chatId: chat._id })}
                activeOpacity={0.7}
              >
                <Card style={styles.chatCard}>
                  <Card.Content style={styles.chatCardContent}>
                    <Avatar.Text
                      size={44}
                      label={firstLetters}
                      style={{ backgroundColor: '#D183BA' }}
                      color="white"
                    />
                    <View style={styles.chatTextContainer}>
                      <Text variant="titleMedium" style={styles.chatPartnerName}>
                        {otherName}
                      </Text>
                      <Text variant="bodySmall" numberOfLines={1} style={styles.chatBookTitle}>
                        Libro: {chat.libro?.title || 'General'}
                      </Text>
                    </View>
                    <IconButton icon="chat-outline" iconColor="#D183BA" size={24} />
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderReservasSection = () => (
    <ScrollView
      style={styles.flexContainer}
      contentContainerStyle={styles.reservasContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshingReservas}
          onRefresh={onRefreshReservas}
          colors={['#D183BA']}
        />
      }
    >
      {/* Solicitude Recibidas */}
      <Text variant="titleMedium" style={styles.sectionHeader}>
        {t('received_requests', 'Solicitudes Recibidas')}
      </Text>
      {receivedRequests.length === 0 ? (
        <Text style={styles.emptyText}>No tienes solicitudes de reserva pendientes.</Text>
      ) : (
        receivedRequests.map((res: any) => {
          const statusColor = getStatusColor(res.estado);
          return (
            <SwipeableRow
              key={res._id}
              style={{ marginBottom: 12 }}
              onDelete={() => handleDeleteReservation(res._id)}
            >
              <Card style={[styles.reservaCard, { marginBottom: 0 }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {res.libro?.title}
                  </Text>
                  <Text variant="bodyMedium">
                    Solicitante: {res.usuarioSolicitante?.name || 'Usuario'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                    Fecha solicitud: {new Date(res.fechaSolicitud).toLocaleDateString()}
                  </Text>
                  {res.estado === 'ACEPTADA' && res.fechaLimite && (
                    <Text
                      variant="bodyMedium"
                      style={{ fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }}
                    >
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
      <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 24 }]}>
        {t('sent_requests', 'Solicitudes Enviadas')}
      </Text>
      {sentRequests.length === 0 ? (
        <Text style={styles.emptyText}>No has solicitado ninguna reserva.</Text>
      ) : (
        sentRequests.map((res: any) => {
          const statusColor = getStatusColor(res.estado);
          return (
            <SwipeableRow
              key={res._id}
              style={{ marginBottom: 12 }}
              onDelete={() => handleDeleteReservation(res._id)}
            >
              <Card style={[styles.reservaCard, { marginBottom: 0 }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {res.libro?.title}
                  </Text>
                  <Text variant="bodyMedium">
                    Propietario: {res.propietario?.name || 'Vendedor'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                    Fecha solicitud: {new Date(res.fechaSolicitud).toLocaleDateString()}
                  </Text>
                  {res.estado === 'ACEPTADA' && res.fechaLimite && (
                    <Text
                      variant="bodyMedium"
                      style={{ fontWeight: 'bold', color: '#f59e0b', marginTop: 4 }}
                    >
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
      <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 24 }]}>
        Mensajes y Avisos
      </Text>
      {reservationMessages.length === 0 ? (
        <Text style={styles.emptyText}>No tienes mensajes de reservas.</Text>
      ) : (
        reservationMessages.map((msg: any) => {
          const isMine = msg.sender?._id === userId || msg.sender === userId;
          const senderName = msg.sender?.name || 'Sistema';
          return (
            <SwipeableRow
              key={msg._id}
              style={{ marginBottom: 12 }}
              onDelete={() => handleDeleteMessage(msg._id)}
            >
              <Card
                style={[
                  styles.reservaCard,
                  { backgroundColor: isMine ? '#fce7f3' : '#fff', marginBottom: 0 },
                ]}
              >
                <Card.Content style={{ paddingVertical: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#D183BA' }}>
                      {senderName}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#888' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ marginTop: 4 }}>
                    {msg.content}
                  </Text>
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
            { value: 'chat', label: 'Chats', checkedColor: '#fff', uncheckedColor: '#555' },
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
          <Text variant="titleLarge" style={styles.dialogTitle}>
            {t('accept_reservation', 'Aceptar Reserva')}
          </Text>
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
  chatsContainer: {
    padding: 16,
  },
  globalChatCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  globalChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  globalChatTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  globalChatTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  globalChatSub: {
    color: '#666',
    marginTop: 2,
  },
  noticeCard: {
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
  },
  noticeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  requestCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  initialMessageBox: {
    marginTop: 10,
    backgroundColor: '#f5eff4',
    padding: 10,
    borderRadius: 8,
  },
  requestDate: {
    marginTop: 8,
    color: '#777',
    fontSize: 11,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  chatCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  chatTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chatPartnerName: {
    fontWeight: 'bold',
    color: '#333',
  },
  chatBookTitle: {
    color: '#666',
    marginTop: 2,
  },
  emptyChatsCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  emptyTextSub: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 6,
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
    textAlign: 'center',
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
  },
});
