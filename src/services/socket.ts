import { io } from 'socket.io-client';

// Ajusta la URL según tu entorno (IP de tu servidor backend)
import { Platform } from 'react-native';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:1337' : 'http://localhost:1337';

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
