import { Image } from 'react-native';
import { Text } from 'react-native-paper';

// Es una copia con unos cambios de ImageFrame web
export default function ImageFrame(props: { imageUrl: string | undefined }) {
  if (props.imageUrl)
    return <Image source={{ uri: props.imageUrl as string }} style={{ height: 256, width: 256 }} />;
  else return <Text variant="displaySmall">Imagen no disponible</Text>; //Tambien podria ser un icono de imagen no encontrado
}
