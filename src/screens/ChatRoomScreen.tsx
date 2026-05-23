import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
    const { chatId } = route.params as { chatId: string };
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const setup = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserId(user._id);

                if (!socket.connected) {
                    socket.connect();
                }

                socket.emit('join_chat', chatId);

                try {
                    const response = await api.get(`/mensajes/chat/${chatId}`);
                    setMessages(response.data);
                } catch (error) {
                    console.error(t('chat_error_load'));
                }
            }
        };

        setup();

        socket.on('receive_message', (message: any) => {
            setMessages(prev => [...prev, message]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        });

        return () => {
            socket.off('receive_message');
        };
    }, [chatId]);

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
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
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
