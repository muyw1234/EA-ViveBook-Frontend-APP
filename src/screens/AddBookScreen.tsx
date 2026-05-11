import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { styles as globalStyles } from '../../styles/default';

export default function AddBookScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('VENTA');
  const [precio, setPrecio] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddBook = async () => {
    if (!isbn || !title || !precio || !estado) {
      Alert.alert(t('error'), t('err_missing_fields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/libros', {
        isbn,
        title,
        type,
        precio: parseFloat(precio),
        estado
      });

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

          <TextInput
            label={t('state_label')}
            value={estado}
            onChangeText={setEstado}
            style={styles.input}
            mode="outlined"
          />

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
    backgroundColor: '#f5f5f5',
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