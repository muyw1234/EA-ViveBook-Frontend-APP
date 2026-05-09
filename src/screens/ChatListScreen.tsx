import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { List, Avatar, Text, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatListScreen() {
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
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <List.Item
            title={item.libro ? `Libro: ${item.libro.titulo}` : 'Chat Directo'}
            description="Toca para abrir el chat"
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
                ListEmptyComponent={<Text style={styles.empty}>No tienes chats activos</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
    },
});
