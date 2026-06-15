import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Card,
  Menu,
  TouchableRipple,
  ActivityIndicator,
} from 'react-native-paper';
import { AppText as Text } from '../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ImageService from '../services/ImageService';
import ILibro, { SellType } from '../models/Libro';

export default function AddBookScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [estadoMenuVisible, setEstadoMenuVisible] = useState(false);
  const [type, setType] = useState<SellType>('VENTA');
  const [precio, setPrecio] = useState('');
  const [estado, setEstado] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  const handleImageUpload = async () => {
    setUploadingImage(true);
    setImageUploadError('');

    try {
      const url = await ImageService.uploadOnAndroid();
      if (url) {
        setImageUrl(url);
      } else {
        setImageUploadError(t('image_not_uploaded'));
      }
    } catch (error) {
      console.error('Error uploading book image:', error);
      setImageUploadError(t('image_not_uploaded'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageUploadError('');
  };

  // Al dar click en el boton de subida
  const handleAddBook = async () => {
    if (!isbn || !title || !precio || !estado) {
      Alert.alert(t('error'), t('err_missing_fields'));
      return;
    }

    setLoading(true);
    try {
      const bookData: ILibro = {
        isbn,
        title,
        autor,
        categoria,
        type,
        precio: parseFloat(precio),
        estado,
        ...(imageUrl ? { imageUrl } : {}),
      };

      if (type === 'ALQUILER') {
        bookData.rentalStartDate = new Date(rentalStartDate);
        bookData.rentalEndDate = new Date(rentalEndDate);
        if (!rentalStartDate || !rentalEndDate) {
          Alert.alert(t('error'), t('err_missing_dates') || 'Faltan las fechas de alquiler');
          setLoading(false);
          return;
        }
        if (bookData.rentalEndDate < bookData.rentalStartDate) {
          Alert.alert(
            t('error'),
            t('err_invalid_dates') || 'La fecha de fin no puede ser anterior a la de inicio',
          );
          setLoading(false);
          return;
        }
        // bookData.rentalStartDate = new Date(rentalStartDate);
        // bookData.rentalEndDate = new Date(rentalEndDate);
      }
      //Alert.alert('Adding book',JSON.stringify(bookData));
      const response = await api.post('/libros', bookData);

      if (response.status === 201) {
        Alert.alert(t('success'), t('msg_add_success'));
        navigation.goBack();
      }
      if (response.data.status === 401) Alert.alert('Adding book', response.data.message);
    } catch (error: any) {
      console.error('Error adding book:', error);
      Alert.alert(t('error'), t('msg_add_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {t('add_book_title')}
          </Text>

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

          <View style={styles.imageSection}>
            {imageUrl ? (
              <>
                <Text variant="labelLarge" style={styles.imageLabel}>
                  {t('image_preview')}
                </Text>
                <Card.Cover source={{ uri: imageUrl }} style={styles.imagePreview} />
                <Text variant="bodySmall" style={styles.imageSuccess}>
                  {t('image_ready')}
                </Text>
                <View style={styles.imageActions}>
                  <Button
                    icon="image-edit"
                    mode="outlined"
                    onPress={handleImageUpload}
                    disabled={uploadingImage}
                  >
                    {t('image_change_button')}
                  </Button>
                  <Button
                    icon="delete-outline"
                    mode="text"
                    onPress={handleRemoveImage}
                    disabled={uploadingImage}
                    textColor="#A33C3C"
                  >
                    {t('image_remove_button')}
                  </Button>
                </View>
              </>
            ) : (
              <Button
                icon="camera"
                mode="elevated"
                onPress={handleImageUpload}
                loading={uploadingImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? t('image_uploading') : t('image_upload_button')}
              </Button>
            )}

            {uploadingImage && imageUrl ? (
              <View style={styles.imageStatus}>
                <ActivityIndicator size="small" color="#A33C3C" />
                <Text variant="bodySmall">{t('image_uploading')}</Text>
              </View>
            ) : null}

            {imageUploadError ? (
              <Text variant="bodySmall" style={styles.imageError}>
                {imageUploadError}
              </Text>
            ) : null}
          </View>

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
            {[
              'Terror',
              'Misterio',
              'Aventura',
              'Juvenil',
              'Policíaco',
              'Infantil',
              'Autoayuda',
              'Novela',
              'Biografías',
              'Cómics',
              'Otros',
            ].map((cat) => (
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
            {['Nuevo', 'Como nuevo', 'Bien', 'Aceptable', 'Usado', 'Usado con marcas'].map(
              (est) => (
                <Menu.Item
                  key={est}
                  onPress={() => {
                    setEstado(est);
                    setEstadoMenuVisible(false);
                  }}
                  title={est}
                />
              ),
            )}
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
            disabled={loading || uploadingImage}
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
  imageSection: {
    gap: 10,
    marginBottom: 16,
  },
  imageLabel: {
    color: '#7B141E',
  },
  imagePreview: {
    height: 280,
    backgroundColor: '#F3C7BD',
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageSuccess: {
    color: '#39734D',
  },
  imageError: {
    color: '#A33C3C',
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
  },
});
