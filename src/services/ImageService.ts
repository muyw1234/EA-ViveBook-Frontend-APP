import { Alert, Platform } from 'react-native';
import api, { cloudinary_api } from './api';
import axios from 'axios';
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
    console.log('ImageService: Requesting Cloudinary upload token from backend...');
    Alert.alert('Depuración Token', 'Solicitando token al backend...');
    const res = await api.get('/image/token');
    console.log('ImageService: Token response:', JSON.stringify(res.data));
    Alert.alert('Depuración Token', `Token recibido: ${JSON.stringify(res.data)}`);
    return res.data.token;
  } catch (error: any) {
    const errMsg = error.response?.data?.message || error.message || JSON.stringify(error);
    console.error('ImageService: Error fetching token:', error);
    Alert.alert('Error de Token de Imagen', `No se pudo obtener el token de firma: ${errMsg}`);
    return;
  }
}

/**
 * @brief Subir imagen
 * @return Devuelve la url segura de la imagen.
 */
async function upload(data: any): Promise<string | undefined> {
  const token = await getToken();
  if (!token) {
    console.warn('ImageService: Token is empty. Aborting upload.');
    Alert.alert('Depuración Subida', 'El token está vacío. Abortando.');
    return;
  }

  data.append('api_key', cloudinary_api);
  data.append('timestamp', `${token.timestamp}`);
  data.append('signature', token.signature);

  try {
    console.log('ImageService: Sending POST request to Cloudinary...');
    Alert.alert('Depuración Subida', 'Enviando imagen a Cloudinary...');
    const res = await axios.post(`https://api.cloudinary.com/v1_1/df2qxcelv/image/upload`, data);
    console.log('ImageService: Cloudinary upload successful. URL:', res.data.secure_url);
    Alert.alert('Depuración Subida', `Subida exitosa. URL: ${res.data.secure_url}`);
    return res.data.secure_url;
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.message || JSON.stringify(error);
    console.error('ImageService: Cloudinary POST failed:', error.response?.data || error);
    Alert.alert('Error de Cloudinary', `No se pudo subir la imagen: ${errMsg}`);
    return;
  }
}

/**
 * @brief Sube una imagen a cloudinary desde la plataforma correspondiente (Android, iOS o Web)
 * @returns Devuelve la url segura de la imagen.
 */
async function uploadOnAndroid(): Promise<string | undefined> {
  console.log('ImageService: Requesting gallery permissions...');
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  console.log('ImageService: Permission result:', JSON.stringify(permissionResult));

  if (permissionResult.granted === false) {
    Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería de fotos.');
    return;
  }

  console.log('ImageService: Launching image library...');
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
  });
  console.log('ImageService: Picker result:', JSON.stringify(pickerResult));

  if (pickerResult.canceled === true || !pickerResult.assets || pickerResult.assets.length === 0) {
    console.log('ImageService: Image selection was canceled or empty.');
    return;
  }

  const asset = pickerResult.assets[0];
  console.log('ImageService: Selected asset details:', JSON.stringify(asset));

  // Alert visual para el usuario para depurar en Web
  Alert.alert(
    'Depuración de Imagen',
    `URI: ${asset.uri.substring(0, 50)}...\nFile present: ${!!asset.file}`,
  );

  const formData = new FormData();

  if (Platform.OS === 'web') {
    if (asset.file) {
      console.log('ImageService: Appending asset.file directly.');
      formData.append('file', asset.file);
    } else if (asset.uri && asset.uri.startsWith('data:')) {
      console.log('ImageService: URI is base64 data. Fetching to blob...');
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName || 'profile_image.jpg');
      } catch (err: any) {
        console.error('ImageService: Base64 fetch failed:', err);
        Alert.alert('Error de archivo', 'No se pudo leer el archivo de la imagen base64.');
        return;
      }
    } else {
      console.log('ImageService: Web environment but no file or data URI.');
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName || 'profile_image.jpg');
      } catch (err: any) {
        console.error('ImageService: Fetching asset.uri failed:', err);
        Alert.alert(
          'Error de archivo',
          `No se pudo obtener el archivo de la imagen desde la URI: ${err.message}`,
        );
        return;
      }
    }
  } else {
    // En plataformas nativas (iOS y Android)
    const fileUri = asset.uri;
    const fileName = asset.fileName || fileUri.split('/').pop() || 'profile_image.jpg';
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
