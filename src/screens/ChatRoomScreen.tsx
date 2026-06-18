import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { TextInput, IconButton, Surface } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useRoute } from '@react-navigation/native';
import socket from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function ChatRoomScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const { chatId, isEventChat } = route.params as { chatId: string; isEventChat: boolean };
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const markAsRead = async (idObtenido: string) => {
    if (!idObtenido || idObtenido === 'reservas' || idObtenido === 'eventos') return;
    try {
      await api.patch(`/chats/${idObtenido}/read`);
      DeviceEventEmitter.emit('unread_change');
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  useEffect(() => {
    const setup = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user._id);

        if (!socket.connected) socket.connect();

        socket.emit('register_user', user._id);
        socket.emit('join_chat', chatId);

        try {
          const response = await api.get(`/chats/${chatId}/messages`);
          const mensajesArray = response.data?.data || response.data || [];
          setMessages(Array.isArray(mensajesArray) ? mensajesArray : []);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        } catch (error) {
          console.error(t('chat_error_load'), error);
        }
        markAsRead(chatId);
      }
    };

    setup();

    const handleReceiveMessage = (message: any) => {
      if (message.chat === chatId || message.chat?._id === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        markAsRead(chatId);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [chatId]);

  const sendMessage = () => {
    if (newMessage.trim() && userId) {
      socket.emit('send_message', {
        chatId,
        senderId: userId,
        content: newMessage.trim(),
        isEventChat: isEventChat,
      });
      setNewMessage('');
    }
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender?._id === userId || item.sender === userId;
    const senderName = item.sender?.name || 'Usuario';

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        {!isMine && <Text style={styles.senderName}>{senderName}</Text>}
        <Surface style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={isMine ? styles.myText : styles.theirText}>{item.content}</Text>
        </Surface>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E4F0',
  },
  listContent: {
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
});
