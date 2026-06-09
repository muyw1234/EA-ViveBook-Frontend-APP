import { Alert } from "react-native";
import api, { cloudinary_api } from "./api";
import axios from "axios";
import FormData from "form-data";
import * as ImagePicker from "expo-image-picker";

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
    return (await api.get("/image/token")).data.token;
  } catch (error) {
    Alert.alert("ImageService", JSON.stringify(error));
    return;
  }
}

/**
 * @brief Subir imagen
 * @return Devuelve la url segura de la imagen.
 */
async function upload(data: FormData): Promise<string | undefined> {
  const token: Token = (await getToken())!;
  // data.append('file',fileObject); // se supone que ya lo tiene
  data.append("api_key", cloudinary_api);
  data.append("timestamp", `${token.timestamp}`);
  data.append("signature", token.signature);
  try {
    const res = await await axios.post(
      `https://api.cloudinary.com/v1_1/df2qxcelv/image/upload`,
      data,
      {
        // tambien tendria que extraer el cloudname en variables de entornos ...
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data.secure_url;
  } catch (error) {
    Alert.alert("ImageService", JSON.stringify(error));
    return;
  }
}

/**
 * @brief Sube una image a cloudinary desde la plataforma android
 * @returns Devuelve la url segura de la imagen.
 */
async function uploadOnAndroid(): Promise<string | undefined> {
  let permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.granted === false) {
    Alert.alert("Permission to access camera is required");
    return;
  }
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
  });
  if (pickerResult.canceled === true) return;

  //   Alert.alert(
  //     "Image Selector",
  //     `You have selected: ${JSON.stringify(pickerResult.assets[0])}`,
  //   );
  const formData: FormData = new FormData();
  formData.append("file", {
    uri: pickerResult.assets[0].uri,
    type: pickerResult.assets[0].mimeType,
    name: pickerResult.assets[0].fileName,
  } as any); // no puede ser 'as File'
  return upload(formData);
}

export default { upload, uploadOnAndroid };
