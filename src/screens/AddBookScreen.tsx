import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card, Menu, TouchableRipple } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { styles as globalStyles } from '../../styles/default';

export default function AddBookScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [estadoMenuVisible, setEstadoMenuVisible] = useState(false);
  const [type, setType] = useState('VENTA');
  const [precio, setPrecio] = useState('');
  const [estado, setEstado] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddBook = async () => {
    if (!isbn || !title || !precio || !estado) {
      Alert.alert(t('error'), t('err_missing_fields'));
      return;
    }

    setLoading(true);
    try {
      const bookData: any = {
        isbn,
        title,
        autor,
        categoria,
        type,
        precio: parseFloat(precio),
        estado
      };

      if (type === 'ALQUILER') {
        if (!rentalStartDate || !rentalEndDate) {
          Alert.alert(t('error'), t('err_missing_dates') || 'Faltan las fechas de alquiler');
          setLoading(false);
          return;
        }
        if (new Date(rentalEndDate) < new Date(rentalStartDate)) {
          Alert.alert(t('error'), t('err_invalid_dates') || 'La fecha de fin no puede ser anterior a la de inicio');
          setLoading(false);
          return;
        }
        bookData.rentalStartDate = rentalStartDate;
        bookData.rentalEndDate = rentalEndDate;
      }

      const response = await api.post('/libros', bookData);

      if (response.status === 201) {
        Alert.alert(t('success'), t('msg_add_success'));
        navigation.goBack();
      }
    } catch (error: any) {
      console.error("Error adding book:", error);
      Alert.alert(t('error'), t('msg_add_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>{t('add_book_title')}</Text>
          
          <TextInput
            label={t('isbn_label')}
            value={isbn}
            onChangeText={setIsbn}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label={t('title_label')}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('author_label')}
            value={autor}
            onChangeText={setAutor}
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Categoría"
                    value={categoria}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                  />
                </View>
              </TouchableRipple>
            }
          >
            {['Terror', 'Misterio', 'Aventura', 'Juvenil', 'Policíaco', 'Infantil', 'Autoayuda', 'Novela', 'Biografías', 'Cómics', 'Otros'].map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategoria(cat);
                  setMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </Menu>

          <Text style={styles.label}>{t('type_label')}:</Text>
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: 'VENTA', label: t('buy_action') },
              { value: 'ALQUILER', label: t('rent_action') },
            ]}
            style={styles.segmented}
          />

          <TextInput
            label={t('price_label')}
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={estadoMenuVisible}
            onDismiss={() => setEstadoMenuVisible(false)}
            anchor={
              <TouchableRipple onPress={() => setEstadoMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label={t('state_label')}
                    value={estado}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Icon icon="menu-down" />}
                  />
                </View>
              </TouchableRipple>
            }
          >
            {['Nuevo', 'Como nuevo', 'Bien', 'Aceptable', 'Usado', 'Usado con marcas'].map((est) => (
              <Menu.Item
                key={est}
                onPress={() => {
                  setEstado(est);
                  setEstadoMenuVisible(false);
                }}
                title={est}
              />
            ))}
          </Menu>

          {type === 'ALQUILER' && (
            <>
              <TextInput
                label={t('rental_start_label')}
                value={rentalStartDate}
                onChangeText={setRentalStartDate}
                style={styles.input}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                label={t('rental_end_label')}
                value={rentalEndDate}
                onChangeText={setRentalEndDate}
                style={styles.input}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </>
          )}

          <Button 
            mode="contained" 
            onPress={handleAddBook} 
            loading={loading}
            style={styles.button}
            buttonColor="#D183BA"
          >
            {t('btn_submit_now')}
          </Button>
        </Card.Content>
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
  card: {
    padding: 8,
    marginTop: 10,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  segmented: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
  }
});