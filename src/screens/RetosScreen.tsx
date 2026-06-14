import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { styles as globalStyles } from '../../styles/default';
import { getPaginatedData } from '../utils/apiResponse';

interface Reto {
  _id: string;
  title: string;
  description: string;
  type: string;
  objetivo: number;
  progresoActual: number;
  porcentaje: number;
  completado: boolean;
  fechaCompletado?: string;
}

export default function RetosScreen() {
  const { t } = {
    t: useTranslation().t as (key: string, defaultValue?: string) => string,
  };
  const [retos, setRetos] = useState<Reto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  const fetchRetos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/retos/mis-retos');
      setRetos(getPaginatedData<Reto>(response.data).data);
    } catch (error) {
      console.error('Error fetching retos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRetos();
    }, []),
  );

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'COMPRAR_LIBROS':
        return '🛒';
      case 'ALQUILAR_LIBROS':
        return '📖';
      case 'SEGUIR_USUARIOS':
        return '👥';
      case 'RECIBIR_VALORACIONES':
        return '⭐';
      case 'ASISTIR_EVENTOS':
        return '🎫';
      case 'SUBIR_LIBROS':
        return '📤';
      default:
        return '🏆';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'COMPRAR_LIBROS':
        return '#FFE2E2';
      case 'ALQUILAR_LIBROS':
        return '#E2F0FF';
      case 'SEGUIR_USUARIOS':
        return '#EAFEEA';
      case 'RECIBIR_VALORACIONES':
        return '#FFF7E2';
      case 'ASISTIR_EVENTOS':
        return '#F0E2FF';
      case 'SUBIR_LIBROS':
        return '#E2FFE2';
      default:
        return '#F3F4F6';
    }
  };

  const completedCount = retos.filter((r) => r.completado).length;
  const totalCount = retos.length;
  const overallPercentage = totalCount > 0 ? completedCount / totalCount : 0;

  const filteredRetos = retos.filter((r) => {
    if (filter === 'completed') return r.completado;
    if (filter === 'pending') return !r.completado;
    return true;
  });

  // Group retos by type
  const groupedRetos: { [key: string]: Reto[] } = {};
  filteredRetos.forEach((reto) => {
    if (!groupedRetos[reto.type]) {
      groupedRetos[reto.type] = [];
    }
    groupedRetos[reto.type].push(reto);
  });

  const groupTypes = Object.keys(groupedRetos);

  if (loading && retos.length === 0) {
    return (
      <View style={[globalStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D183BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header card with global progress */}
        <LinearGradient
          colors={['#E6AED2', '#D183BA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View style={styles.trophyContainer}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                {t('retos_title', 'Mis Retos')}
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                {t('retos_subtitle', 'Completa objetivos y gana insignias en la comunidad')}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLabel}>
                {t('retos_total_completed', 'Retos completados')}
              </Text>
              <Text style={styles.progressCountText}>
                {completedCount} / {totalCount}
              </Text>
            </View>
            <ProgressBar
              progress={overallPercentage}
              color="#FFF"
              style={styles.headerProgressBar}
            />
          </View>
        </LinearGradient>

        {completedCount === totalCount && totalCount > 0 && (
          <Card style={styles.allCompletedCard}>
            <Card.Content style={styles.allCompletedContent}>
              <Text style={styles.allCompletedEmoji}>🎉🏆🎉</Text>
              <Text variant="titleMedium" style={styles.allCompletedTitle}>
                ¡Retos Completados!
              </Text>
              <Text variant="bodyMedium" style={styles.allCompletedText}>
                Ya has completado todos los retos, próximamente habrá más!
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Filter buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('retos_all', 'Todos')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              {t('retos_pending', 'Pendientes')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
              {t('retos_completed', 'Completados')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accordion Grouped List */}
        {groupTypes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {completedCount === totalCount && totalCount > 0 ? '🎉' : '🔍'}
            </Text>
            <Text style={styles.emptyText}>
              {completedCount === totalCount && totalCount > 0
                ? 'Ya has completado todos los retos, próximamente habrá más!'
                : filter === 'completed' && completedCount === 0
                  ? 'Todavía no has completado ningún reto.'
                  : t('retos_empty', 'No hay retos disponibles en este momento.')}
            </Text>
          </View>
        ) : (
          groupTypes.map((type) => {
            const items = groupedRetos[type];
            const isExpanded = expandedGroups[type] || false;
            const completedInGroup = items.filter((r) => r.completado).length;
            const totalInGroup = items.length;

            return (
              <Card key={type} style={styles.groupCard}>
                <TouchableOpacity
                  onPress={() => toggleGroup(type)}
                  activeOpacity={0.8}
                  style={styles.groupHeader}
                >
                  <View style={[styles.groupIconBadge, { backgroundColor: getBadgeColor(type) }]}>
                    <Text style={styles.groupIconEmoji}>{getIcon(type)}</Text>
                  </View>

                  <View style={styles.groupTitleContainer}>
                    <Text variant="titleMedium" style={styles.groupTitle}>
                      {t(`type_${type}`, type)}
                    </Text>
                    <Text variant="bodySmall" style={styles.groupSubtitle}>
                      {completedInGroup} / {totalInGroup}{' '}
                      {t('retos_completed_badge', 'Completado').toLowerCase()}
                    </Text>
                  </View>

                  <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.groupContent}>
                    {items.map((reto, idx) => (
                      <View
                        key={reto._id}
                        style={[
                          styles.retoItem,
                          reto.completado && styles.retoItemCompleted,
                          idx < items.length - 1 && styles.retoItemDivider,
                        ]}
                      >
                        <View style={styles.retoItemTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={styles.retoItemTitle}>
                              {reto.title}
                            </Text>
                            <Text variant="bodySmall" style={styles.retoItemDescription}>
                              {reto.description}
                            </Text>
                          </View>

                          {reto.completado && (
                            <View style={styles.completedBadge}>
                              <Text style={styles.completedBadgeText}>
                                {t('retos_completed_badge', 'Completado')}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.progressSection}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressLabel}>
                              {t('retos_progress_label', 'Progreso')}
                            </Text>
                            <Text style={styles.progressCount}>
                              {reto.progresoActual} / {reto.objetivo}
                            </Text>
                          </View>
                          <ProgressBar
                            progress={reto.progresoActual / reto.objetivo}
                            color={reto.completado ? '#10B981' : '#D183BA'}
                            style={styles.progressBar}
                          />
                          {reto.completado && reto.fechaCompletado && (
                            <Text style={styles.completionDateText}>
                              🎉 {new Date(reto.fechaCompletado).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 32,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTextLabel: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  progressCountText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressPercentageText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: '#D183BA',
  },
  filterText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFF',
  },
  groupCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  groupIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconEmoji: {
    fontSize: 22,
  },
  groupTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  groupTitle: {
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  groupSubtitle: {
    color: '#64748B',
    marginTop: 2,
  },
  expandChevron: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  groupContent: {
    backgroundColor: '#FAF7FB',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
  },
  retoItem: {
    paddingVertical: 16,
  },
  retoItemCompleted: {
    backgroundColor: 'transparent',
  },
  retoItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  retoItemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  retoItemTitle: {
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  retoItemDescription: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 13,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  completionDateText: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 6,
    textAlign: 'right',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  allCompletedCard: {
    backgroundColor: '#FFF7E2',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    marginVertical: 12,
    elevation: 2,
  },
  allCompletedContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  allCompletedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  allCompletedTitle: {
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 4,
  },
  allCompletedText: {
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
});
