import { Alert, Platform } from 'react-native';
import api, { cloudinary_api } from './api';
import axios from 'axios';
import FormData from 'form-data';
import * as ImagePicker from 'expo-image-picker';

export interface Token {
  timestamp: number;
  signature: string;
}

/**
 * @brief Obtiene el token para subir la imagen a cloudinary
 * @returns El token
 */
async function getToken(): Promise<Token | undefined> {
  try {
    return (await api.get('/image/token')).data.token;
  } catch (error: any) {
    const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
    Alert.alert('Error de Token de Imagen', `No se pudo obtener el token de firma: ${errMsg}`);
    return;
  }
}

/**
 * @brief Subir imagen
 * @return Devuelve la url segura de la imagen.
 */
async function upload(data: FormData): Promise<string | undefined> {
  const token = await getToken();
  if (!token) return;

  data.append('api_key', cloudinary_api);
  data.append('timestamp', `${token.timestamp}`);
  data.append('signature', token.signature);
  try {
    const res = await axios.post(`https://api.cloudinary.com/v1_1/df2qxcelv/image/upload`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.secure_url;
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.message || JSON.stringify(error);
    Alert.alert('Error de Cloudinary', `No se pudo subir la imagen: ${errMsg}`);
    return;
  }
}

/**
 * @brief Sube una imagen a cloudinary desde la plataforma correspondiente (Android, iOS o Web)
 * @returns Devuelve la url segura de la imagen.
 */
async function uploadOnAndroid(): Promise<string | undefined> {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.granted === false) {
    Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería de fotos.');
    return;
  }
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
  });
  if (pickerResult.canceled === true || !pickerResult.assets || pickerResult.assets.length === 0)
    return;

  const asset = pickerResult.assets[0];
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // En Web, si el objeto file real está disponible en el asset, lo usamos directamente.
    // De lo contrario, hacemos un fetch de la URI base64/Blob para obtener el blob.
    if (asset.file) {
      formData.append('file', asset.file);
    } else {
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName || 'profile_image.jpg');
      } catch (err: any) {
        Alert.alert('Error de archivo', 'No se pudo leer el archivo de la imagen en Web.');
        return;
      }
    }
  } else {
    // En plataformas nativas (iOS y Android), construimos el objeto con fallback para mimeType y name
    const fileUri = asset.uri;
    const fileName = asset.fileName || fileUri.split('/').pop() || 'profile_image.jpg';

    // Intentar deducir la extensión para el tipo
    const match = /\.(\w+)$/.exec(fileName);
    const fileType = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    } as any);
  }

  return upload(formData);
}

export default { upload, uploadOnAndroid };
