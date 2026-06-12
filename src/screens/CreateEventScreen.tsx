import React, { useState, useEffect } from 'react'; // 👈 Asegúrate de importar useEffect
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import EventoService from '../services/evento';
import EventMap from './EventMap';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 Importa AsyncStorage

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // 🆔 Estado para almacenar el ID del creador real
  const [creatorId, setCreatorId] = useState<string | null>(null);

  // Estados de tu formulario web funcional
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState<Date>(new Date());
  const [newEventDireccionExacta, setNewEventDireccionExacta] = useState('');
  const [newEventLocation, setNewEventLocation] = useState<[number, number] | null>([
    41.3851, 2.1734,
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRaw = await AsyncStorage.getItem('user');
        console.log('JSON crudo del almacenamiento:', userRaw);

        if (userRaw) {
          const userParsed = JSON.parse(userRaw);

          if (userParsed && userParsed.data && userParsed.data._id) {
            setCreatorId(userParsed.data._id);
            console.log('¡ID del creador detectado con éxito! ID:', userParsed.data._id);
            return;
          } else if (userParsed._id) {
            setCreatorId(userParsed._id);
            return;
          }
        }

        console.warn("No se encontró 'data._id' en el storage. Aplicando ID de respaldo.");
        setCreatorId('69f0a887be8660edb4f8ead5'); // El _id real de tu usuario 'usr1'
      } catch (error) {
        console.error('Error leyendo el usuario del almacenamiento:', error);
        setCreatorId('69f0a887be8660edb4f8ead5'); // ID de respaldo en caso de excepción
      }
    };

    fetchUser();
  }, []);

  const handleMapPress = (e: any) => {
    if (e?.nativeEvent?.coordinate) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setNewEventLocation([latitude, longitude]);
    }
  };

  const onMobileDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewEventDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!creatorId) {
      setErrorMsg('Error de autenticación. No se encuentra el usuario creador.');
      return;
    }

    if (!newEventTitle || !newEventDescription || !newEventDireccionExacta || !newEventLocation) {
      setErrorMsg('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const eventData = {
        title: newEventTitle,
        description: newEventDescription,
        creator: creatorId,
        eventDate: newEventDate.toISOString(),
        createdDate: new Date().toISOString(),
        location: {
          type: 'Point' as const,
          coordinates: [newEventLocation[1], newEventLocation[0]] as [number, number],
        },
        direccionExacta: newEventDireccionExacta,
      };

      await EventoService.createEvento(eventData);

      Alert.alert('¡Éxito!', '¡Evento creado con éxito!', [
        {
          text: 'OK',
          onPress: () => {
            setNewEventTitle('');
            setNewEventDescription('');
            setNewEventDireccionExacta('');
            setNewEventLocation([41.3851, 2.1734]);
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error submitting event:', error);
      const serverMsg = error.response?.data?.message || error.message;
      const displayMsg = serverMsg
        ? `No se pudo crear el evento: ${serverMsg}`
        : 'No se pudo crear el evento.';
      setErrorMsg(displayMsg);
      Alert.alert('Error', displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatLabelDate = (d: Date) => {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text variant="headlineMedium" style={styles.header}>
        Crear Evento Literario
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Título del Evento *"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            mode="outlined"
            style={styles.input}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <TextInput
            label="Descripción o Detalles *"
            value={newEventDescription}
            onChangeText={setNewEventDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          {Platform.OS === 'web' ? (
            <View style={{ marginBottom: 14 }}>
              <Text variant="bodySmall" style={styles.labelWeb}>
                Fecha y Hora del Evento *
              </Text>
              <input
                type="datetime-local"
                value={newEventDate.toISOString().substring(0, 16)}
                onChange={(e) => setNewEventDate(new Date(e.target.value))}
                style={styles.webDateTimePicker}
              />
            </View>
          ) : (
            <View>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <View pointerEvents="none">
                  <TextInput
                    label="Fecha y Hora del Evento *"
                    value={formatLabelDate(newEventDate)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor="#D183BA"
                    activeOutlineColor="#D183BA"
                    right={<TextInput.Icon icon="calendar" />}
                  />
                </View>
              </TouchableOpacity>

              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={newEventDate}
                  mode="datetime"
                  display="default"
                  onChange={onMobileDateChange}
                />
              )}
            </View>
          )}

          <TextInput
            label="Dirección Exacta (Calle, Ciudad) *"
            value={newEventDireccionExacta}
            onChangeText={setNewEventDireccionExacta}
            mode="outlined"
            style={styles.input}
            outlineColor="#D183BA"
            activeOutlineColor="#D183BA"
          />

          <Text variant="bodyMedium" style={styles.mapLabel}>
            Ubicación del Evento:
          </Text>

          <EventMap
            latitude={newEventLocation ? newEventLocation[0] : 41.3851}
            longitude={newEventLocation ? newEventLocation[1] : 2.1734}
            title={newEventTitle}
            description={newEventDireccionExacta}
            onMapPress={handleMapPress}
          />

          <View style={styles.row}>
            <TextInput
              label="Latitud *"
              value={newEventLocation ? String(newEventLocation[0]) : ''}
              editable={false}
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              label="Longitud *"
              value={newEventLocation ? String(newEventLocation[1]) : ''}
              editable={false}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          {errorMsg && (
            <HelperText type="error" visible={true} style={{ fontSize: 14 }}>
              ⚠️ {errorMsg}
            </HelperText>
          )}
        </Card.Content>

        <Card.Actions style={{ padding: 16 }}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            textColor="#D183BA"
            style={{ marginRight: 8, borderColor: '#D183BA' }}
          >
            Cancelar
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            buttonColor="#D183BA"
          >
            Guardar Evento
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5EBF4',
  },
  header: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#D183BA',
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  labelWeb: {
    color: '#D183BA',
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  webDateTimePicker: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D183BA',
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  mapLabel: {
    color: '#D183BA',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
