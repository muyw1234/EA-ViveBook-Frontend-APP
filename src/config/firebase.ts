// src/config/firebase.ts
import { Platform } from 'react-native';

let webFirebaseApp: any = null;

if (Platform.OS === 'web') {
  // Forzamos a que los módulos web se carguen ÚNICAMENTE si estamos en un navegador
  const { initializeApp, getApps, getApp } = require('firebase/app');

  const firebaseConfig = {
    apiKey: 'AIzaSyAFB9g4-Sn0b93oYoTpc_HaGLcCV-fgK4w',
    authDomain: 'ea-vivebook-frontend-web.firebaseapp.com',
    projectId: 'ea-vivebook-frontend-web',
    storageBucket: 'ea-vivebook-frontend-web.firebasestorage.app',
    messagingSenderId: '870483568720',
    appId: '1:870483568720:web:dd4452b22e2c47ae82c955',
    measurementId: 'G-DNXTF3D8MB',
  };

  if (getApps().length === 0) {
    webFirebaseApp = initializeApp(firebaseConfig);
    console.log('🔥 Firebase Web inicializado correctamente');
  } else {
    webFirebaseApp = getApp();
  }
} else {
  // En Android/iOS inicializamos el contenedor Nativo de forma segura
  const firebaseNativo = require('@react-native-firebase/app').default;
  if (!firebaseNativo.apps.length) {
    firebaseNativo.initializeApp({} as any);
    console.log('🤖 Firebase Nativo (Android) enlazado con google-services.json');
  }
}

export { webFirebaseApp };
