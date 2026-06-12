import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Platform, Alert } from 'react-native';
import { Card, Button, Searchbar } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import EventoService, { IEvento } from '../services/evento';

export default function ExploreEventsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [events, setEvents] = useState<IEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await EventoService.getAllEventos(
        page,
        ITEMS_PER_PAGE,
        true,
        searchQuery,
        'eventDate',
      );
      setEvents(result.data);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (Platform.OS === 'web') {
        alert('No se pudieron cargar los eventos');
      } else {
        Alert.alert(t('error'), 'No se pudieron cargar los eventos');
      }
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, t]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  const renderFooter = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <Button disabled={page === 1} onPress={() => setPage(page - 1)}>
          Anterior
        </Button>
        <Text style={styles.pageText}>
          Página {page} de {totalPages}
        </Text>
        <Button disabled={page === totalPages} onPress={() => setPage(page + 1)}>
          Siguiente
        </Button>
      </View>
    );
  };

  const renderEventItem = ({ item: event }: { item: IEvento }) => {
    const creatorName =
      event.creator && typeof event.creator !== 'string' ? event.creator.name : 'Organizador';

    return (
      <Card style={styles.listCard} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <Text variant="bodyMedium" style={styles.dateText}>
            📅 {new Date(event.eventDate).toLocaleDateString()} -{' '}
            {new Date(event.eventDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <Text variant="bodySmall" style={styles.creatorText}>
            Organizado por: <Text style={styles.creatorName}>{creatorName}</Text>
          </Text>

          <Text variant="bodyMedium" style={styles.descriptionText} numberOfLines={3}>
            {event.description}
          </Text>

          <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
            📍 {event.direccionExacta}
          </Text>
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            buttonColor="#D183BA"
            textColor="#fff"
            onPress={() => navigation.navigate('EventDetail', { eventoId: event._id })}
            style={styles.detailButton}
          >
            Ver Detalles
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar eventos por título o dirección..."
        onChangeText={(text) => {
          setSearchQuery(text);
          setPage(1);
        }}
        value={searchQuery}
        style={styles.searchBar}
        icon={() => <Text style={{ fontSize: 20 }}>🔍</Text>}
      />

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se han encontrado eventos literarios activos.</Text>
        }
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5EBF4',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    borderRadius: 30,
  },
  listContent: {
    paddingBottom: 24,
  },
  listCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  eventTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  dateText: {
    color: '#D183BA',
    fontWeight: '700',
    marginBottom: 6,
  },
  creatorText: {
    color: '#666666',
    marginBottom: 10,
  },
  creatorName: {
    fontWeight: 'bold',
    color: '#D183BA',
  },
  descriptionText: {
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  locationText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  detailButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  pageText: {
    marginHorizontal: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontStyle: 'italic',
  },
});
