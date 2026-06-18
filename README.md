# EA-ViveBook-Frontend-APP

Aplicacion movil y web de ViveBook desarrollada con Expo, React Native y TypeScript.

Este proyecto representa la experiencia principal del usuario final de ViveBook: descubrir libros, comprar o alquilar ejemplares, gestionar favoritos, crear eventos, participar en retos, usar chat y consultar informacion personalizada de la cuenta.

## Tabla de contenido

- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Tecnologias principales](#tecnologias-principales)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pantallas y funcionalidades](#pantallas-y-funcionalidades)
- [Servicios internos](#servicios-internos)
- [Configuracion de entorno](#configuracion-de-entorno)
- [Instalacion local](#instalacion-local)
- [Ejecucion en desarrollo](#ejecucion-en-desarrollo)
- [Android Studio, SDK y Java](#android-studio-sdk-y-java)
- [Mapas](#mapas)
- [Cloudinary](#cloudinary)
- [Autenticacion y sesiones](#autenticacion-y-sesiones)
- [Socket.IO y tiempo real](#socketio-y-tiempo-real)
- [Internacionalizacion](#internacionalizacion)
- [Calidad de codigo](#calidad-de-codigo)
- [Builds con EAS](#builds-con-eas)
- [Resolucion de problemas](#resolucion-de-problemas)

## Objetivo del proyecto

La APP de ViveBook conecta con el Backend para ofrecer una experiencia movil centrada en comunidad lectora:

- Registro e inicio de sesion.
- Descubrimiento y busqueda de libros.
- Gestion de libros en venta o alquiler.
- Subida de portadas mediante Cloudinary.
- Favoritos, wishlist y biblioteca personal.
- Compra, alquiler y reservas.
- Eventos literarios con geolocalizacion.
- Chat y buzon de mensajes.
- Retos de usuario y progreso.
- Ajustes, accesibilidad y personalizacion visual.

El proyecto esta preparado para funcionar en desarrollo local, emulador Android, web mediante Expo y builds remotas con EAS.

## Tecnologias principales

- Expo `~54`.
- React `19`.
- React Native `0.81`.
- TypeScript.
- React Navigation.
- Axios.
- Socket.IO Client.
- React Hook Form y Zod.
- React Native Paper.
- Expo Image Picker.
- Expo Location.
- Expo Notifications.
- Cloudinary para subida directa de imagenes.
- React Native Maps en Android/iOS.
- Leaflet y React Leaflet en Web.
- ESLint y Prettier.
- Husky para validaciones pre-commit.

## Estructura del proyecto

```text
EA-ViveBook-Frontend-APP/
+-- App.tsx
+-- index.ts
+-- app.json
+-- app.config.js
+-- eas.json
+-- package.json
+-- .env.example
+-- src/
    +-- components/
    +-- config/
    +-- context/
    +-- models/
    +-- navigation/
    +-- screens/
    +-- services/
    +-- utils/
+-- styles/
+-- assets/
```

### Directorios principales

| Ruta | Responsabilidad |
| --- | --- |
| `src/screens` | Pantallas principales de la aplicacion. |
| `src/navigation` | Navegacion entre pantallas y tabs. |
| `src/services` | Comunicacion con Backend, sesiones, Socket.IO, imagenes, eventos y reservas. |
| `src/config` | Configuracion comun de entorno. |
| `src/context` | Contextos globales, como accesibilidad. |
| `src/components` | Componentes reutilizables. |
| `src/models` | Tipos y modelos compartidos. |
| `src/utils` | Utilidades comunes, normalizacion de respuestas y helpers. |
| `styles` | Estilos compartidos. |
| `assets` | Iconos, splash y recursos estaticos. |

## Pantallas y funcionalidades

### Autenticacion

Pantallas:

- `LoginScreen.tsx`
- `RegisterScreen.tsx`

Funciones:

- Inicio de sesion con Backend.
- Registro de usuarios.
- Restauracion automatica de sesion.
- Deteccion de sesion expirada o rechazada.
- Integracion preparada para proveedores sociales.

### Inicio y descubrimiento

Pantallas:

- `HomeScreen.tsx`
- `DiscoverScreen.tsx`
- `SearchScreen.tsx`

Funciones:

- Visualizacion de contenido destacado.
- Busqueda de libros.
- Descubrimiento de catalogo.
- Consulta de informacion normalizada recibida desde Backend.

### Libros

Pantallas:

- `AddBookScreen.tsx`
- `MyBooksScreen.tsx`
- `BooksForSaleScreen.tsx`
- `BooksForRentScreen.tsx`
- `FavoritesScreen.tsx`

Funciones:

- Crear libros.
- Subir portada a Cloudinary.
- Guardar en Backend la URL final de la imagen.
- Visualizar libros propios.
- Consultar libros en venta.
- Consultar libros en alquiler.
- Gestionar favoritos.

### Eventos

Pantallas:

- `ExploreEventsScreen.tsx`
- `EventDetailScreen.tsx`
- `CreateEventScreen.tsx`
- `EventMap.tsx`
- `EventMap.web.tsx`

Funciones:

- Explorar eventos.
- Ver detalle de eventos.
- Crear eventos.
- Mostrar ubicaciones en mapa.
- Usar Leaflet/OpenStreetMap en Web.
- Usar `react-native-maps` en Android/iOS.

### Chat y buzon

Pantallas:

- `ChatListScreen.tsx`
- `ChatRoomScreen.tsx`
- `BuzonScreen.tsx`

Funciones:

- Listado de conversaciones.
- Sala de chat.
- Comunicacion en tiempo real mediante Socket.IO.

### Usuario, ajustes y accesibilidad

Pantallas:

- `ProfileScreen.tsx`
- `SettingsScreen.tsx`
- `AccessibilityMenu.tsx`
- `DashboardScreen.tsx`

Funciones:

- Perfil de usuario.
- Ajustes de aplicacion.
- Opciones de accesibilidad.
- Componentes adaptados mediante `AppText` y contexto de accesibilidad.

### Retos

Pantalla:

- `RetosScreen.tsx`

Funciones:

- Mostrar retos disponibles.
- Calcular progreso del usuario.
- Mostrar retos completados.
- Consultar historial y estado de objetivos.

## Servicios internos

### `src/config/environment.ts`

Centraliza las URLs de conexion:

- API HTTP.
- Socket.IO.
- Cloudinary.

Tambien aplica valores por defecto segun plataforma:

- Android Emulator: `http://10.0.2.2:1337`.
- iOS Simulator y Web: `http://localhost:1337`.

### `src/services/api.ts`

Cliente Axios centralizado.

Responsabilidades:

- Definir la URL base del Backend.
- Adjuntar token JWT cuando existe.
- Gestionar errores globales `401` y `403`.
- Cerrar sesiones rechazadas por Backend.

### `src/services/session.ts`

Gestiona persistencia y restauracion de sesion.

Responsabilidades:

- Guardar token y datos de usuario.
- Restaurar sesion al iniciar la APP.
- Validar expiracion del JWT.
- Limpiar sesion cuando el Backend rechaza credenciales.

### `src/utils/apiResponse.ts`

Normaliza respuestas del Backend.

Soporta tanto respuestas directas como respuestas con contrato:

```ts
{
  success: boolean;
  status: number;
  message: string;
  data: unknown;
}
```

### `src/services/reserva.ts`

Centraliza la normalizacion de reservas, incluyendo respuestas paginadas.

### `src/services/ImageService.ts`

Gestiona la subida de imagenes a Cloudinary.

Flujo general:

1. La APP solicita al Backend un token/firma temporal.
2. El usuario selecciona una imagen.
3. La APP sube la imagen a Cloudinary.
4. Cloudinary devuelve una URL publica.
5. La APP guarda esa URL en el libro creado.

### `src/services/socket.ts`

Gestiona la conexion Socket.IO.

Se usa para funcionalidades de tiempo real, especialmente chat.

### `src/services/evento.ts`

Contiene helpers y llamadas relacionadas con eventos.

### `src/services/i18n.ts`

Configuracion de internacionalizacion.

### `src/services/socialAuth.ts`

Configuracion de autenticacion social.

## Configuracion de entorno

El proyecto utiliza variables de entorno compatibles con Expo.

Las variables que deben llegar al bundle empiezan por `EXPO_PUBLIC_`.

Partir siempre de:

```bash
.env.example
```

Crear un archivo local:

```bash
.env
```

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://localhost:1337
EXPO_PUBLIC_SOCKET_URL=http://localhost:1337

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=df2qxcelv
EXPO_PUBLIC_CLOUDINARY_API_KEY=991611377853644

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=
```

### Variables disponibles

| Variable | Descripcion |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base del Backend HTTP. |
| `EXPO_PUBLIC_SOCKET_URL` | URL base para Socket.IO. |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre de nube de Cloudinary. |
| `EXPO_PUBLIC_CLOUDINARY_API_KEY` | API key publica de Cloudinary. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID web para Google Sign-In. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Client ID iOS para Google Sign-In. |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` | API key de Google Maps Android para mapas nativos. |

Importante:

- No guardar secretos privados en la APP.
- La `API Secret` de Cloudinary pertenece exclusivamente al Backend.
- Las claves publicas deben restringirse desde sus proveedores.

## Instalacion local

Requisitos:

- Node.js compatible con Expo.
- npm.
- Expo CLI mediante `npx`.
- Backend de ViveBook levantado.

Instalar dependencias:

```bash
npm install
```

Preparar `.env`:

```bash
cp .env.example .env
```

En Windows PowerShell, si no se usa `cp`:

```powershell
Copy-Item .env.example .env
```

## Ejecucion en desarrollo

### Expo Dev Server

```bash
npm run start
```

### Web

```bash
npm run web
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

La ejecucion iOS requiere macOS y Xcode.

## Android Studio, SDK y Java

Para ejecutar Android en emulador o dispositivo fisico se necesita:

- Android Studio.
- Android SDK.
- Android Platform Tools.
- Java incluido en Android Studio o un JDK compatible.

Variables habituales en Windows:

```powershell
$env:ANDROID_HOME="C:\Users\<usuario>\AppData\Local\Android\Sdk"
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
```

Entradas recomendadas en `Path`:

```text
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\cmdline-tools\latest\bin
%JAVA_HOME%\bin
```

Comprobaciones:

```powershell
adb --version
java -version
```

Listar dispositivos:

```powershell
adb devices
```

## Mapas

El proyecto usa dos implementaciones segun plataforma.

### Web

En Web se usa:

- Leaflet.
- React Leaflet.
- OpenStreetMap.

Archivo:

```text
src/screens/EventMap.web.tsx
```

### Android/iOS

En nativo se usa:

- `react-native-maps`.

Archivo:

```text
src/screens/EventMap.tsx
```

En Android, `react-native-maps` necesita una API Key de Google Maps:

```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=
```

Esta variable se lee en `app.config.js` y Expo la inyecta en el `AndroidManifest.xml` generado.

Si se cambia esta variable, hay que reconstruir Android:

```bash
npm run android
```

Si no se actualiza el manifest generado:

```bash
npx expo prebuild --platform android --clean
npm run android
```

La clave debe tener activado `Maps SDK for Android` y estar restringida al paquete:

```text
com.anonymous.EAViveBookFrontendAPP
```

## Cloudinary

La APP sube imagenes a Cloudinary de forma controlada.

Variables publicas en la APP:

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_API_KEY=
```

La API Secret nunca debe estar en la APP.

Debe estar solo en Backend:

```env
CLOUDINARY_SECRET=
```

El Backend protege el endpoint de firma/token y la APP utiliza esa respuesta para poder subir imagenes.

## Autenticacion y sesiones

La APP usa JWT emitidos por el Backend.

El flujo actual contempla:

- Login y registro.
- Persistencia de sesion.
- Restauracion automatica al iniciar.
- Validacion de expiracion del token.
- Cierre automatico ante respuestas `401` o `403`.
- Mensaje especifico en login cuando la sesion expiro o fue rechazada.

## Socket.IO y tiempo real

La conexion Socket.IO usa la variable:

```env
EXPO_PUBLIC_SOCKET_URL=
```

El servicio central esta en:

```text
src/services/socket.ts
```

Se utiliza para funcionalidades de comunicacion en tiempo real, como el chat.

## Internacionalizacion

La configuracion i18n esta centralizada en:

```text
src/services/i18n.ts
```

El objetivo es permitir textos adaptables y mantener una base preparada para crecer a varios idiomas.

## Calidad de codigo

Scripts disponibles:

```bash
npm run lint
npm run lint:quiet
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
```

### Pre-commit

El hook de Husky ejecuta:

```bash
npm run lint
npm run format:check
npm run typecheck
```

Esto evita commits con errores de lint, formato o TypeScript.

## Builds con EAS

El proyecto incluye `eas.json` con perfiles remotos.

### Configurar EAS

```bash
npx eas-cli@latest login
npm run eas:configure
```

### Build preview Android

Genera un APK instalable para pruebas internas:

```bash
npm run build:preview:android
```

### Build preview iOS

```bash
npm run build:preview:ios
```

### Build produccion Android

```bash
npm run build:production:android
```

Normalmente genera un AAB para Google Play.

### Build produccion iOS

```bash
npm run build:production:ios
```

Requiere cuenta de Apple Developer.

### Entornos remotos

Los perfiles remotos usan:

```text
https://ea3-api.upc.edu
```

para:

- API HTTP.
- Socket.IO.

Las variables de Cloudinary publicas tambien se definen en `eas.json`.

Si se necesitan valores sensibles o variables adicionales, deben configurarse como variables/secrets del entorno de EAS o GitHub Actions segun el flujo de despliegue.

## Relacion con Backend

La APP espera que el Backend ofrezca:

- Autenticacion JWT.
- Endpoints de usuarios.
- Endpoints de libros.
- Endpoints de reservas.
- Endpoints de eventos.
- Endpoints de retos.
- Endpoints de favoritos y listas del usuario.
- Endpoint protegido de firma/token para imagenes.
- Socket.IO para chat.

La normalizacion de respuestas permite compatibilidad con respuestas directas y con el contrato administrativo/comun:

```ts
{
  success: boolean;
  status: number;
  message: string;
  data: T;
}
```

## Resolucion de problemas

### La APP no conecta con el Backend en Android Emulator

En Android Emulator, `localhost` apunta al propio emulador, no a tu PC.

Usar:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:1337
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:1337
```

### `adb` no se reconoce

Comprobar que Android SDK esta instalado y que `platform-tools` esta en el `Path`.

```powershell
adb --version
```

### `JAVA_HOME is not set`

Configurar `JAVA_HOME` apuntando al JBR de Android Studio o a un JDK compatible.

Ejemplo:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
```

### Error de Google Maps en Android

Mensaje habitual:

```text
API key not found. Check that <meta-data android:name="com.google.android.geo.API_KEY" ... />
```

Solucion:

1. Crear una API Key en Google Cloud.
2. Activar `Maps SDK for Android`.
3. Restringirla por paquete y SHA-1.
4. Definir:

```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=...
```

5. Reconstruir:

```bash
npm run android
```

### La subida de imagen no se completa

Comprobar:

- Que el Backend esta levantado.
- Que el usuario esta autenticado.
- Que el endpoint de token/firma de imagen responde correctamente.
- Que Cloudinary esta configurado en Backend.
- Que las variables publicas de Cloudinary estan en la APP.

### Cambios en `.env` no aparecen

Reiniciar Expo:

```bash
npm run start -- --clear
```

Si afecta a configuracion nativa Android:

```bash
npx expo prebuild --platform android --clean
npm run android
```

## Estado actual

El proyecto esta preparado para trabajar contra el Backend actual de ViveBook, con:

- Configuracion comun de API y Socket.IO.
- Normalizacion comun de respuestas.
- Gestion global de sesiones rechazadas.
- Subida de imagenes mediante Cloudinary.
- Builds remotas con EAS.
- Validaciones de lint, formato y TypeScript.

## Siguientes mejoras recomendadas

- Incorporar pruebas unitarias con Vitest.
- Anadir pruebas de servicios criticos: API, session, reservas e ImageService.
- Cubrir pantallas principales con pruebas de componentes.
- Revisar dependencias no utilizadas antes de cerrar version.
- Documentar flujo completo de publicacion mobile en el repositorio de despliegue.
