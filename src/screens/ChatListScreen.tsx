import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { List, Avatar, Text, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function ChatListScreen() {
    const { t } = useTranslation();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            
            // Suponiendo que hay un endpoint para obtener los chats del usuario
            const response = await api.get(`/chats/usuario/${user._id}`);
            setChats(response.data);
        } catch (error) {
            console.error(t('chat_error_fetch'), error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <List.Item
            title={item.libro ? `Libro: ${item.libro.titulo}` : t('chat_header')}
            description={t('chat_open_message')}
            left={props => <Avatar.Icon {...props} icon="chat" />}
            onPress={() => navigation.navigate('ChatRoom', { chatId: item._id })}
        />
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={chats}
                keyExtractor={(item: any) => item._id}
                renderItem={renderItem}
                onRefresh={fetchChats}
                refreshing={loading}
                ListEmptyComponent={<Text style={styles.empty}>{t('chat_empty')}</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EBF4',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
    },
});
