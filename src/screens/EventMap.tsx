import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  eventDate?: string;
  direccionExacta?: string;
}

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  onMapPress?: (e: any) => void;
}

interface MultiEventMapProps {
  markers: MapMarkerData[];
  userLatitude: number;
  userLongitude: number;
  onMarkerPress?: (id: string) => void;
}

const formatearFechaConGuiones = (dateString?: string) => {
  if (!dateString) return 'xx-xx-xx';
  if (dateString.includes('/')) {
    const soloFecha = dateString.split(' ')[0];
    const partes = soloFecha.split('/');
    return `${partes[0].padStart(2, '0')}-${partes[1].padStart(2, '0')}-${partes[2]}`;
  }
  const fecha = new Date(dateString);
  if (isNaN(fecha.getTime())) return 'xx-xx-xx';
  return `${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${fecha.getFullYear()}`;
};

const generarHtmlLeaflet = (
  centerLat: number,
  centerLng: number,
  zoom: number,
  markersData: any[],
  showUser: boolean,
  userLat?: number,
  userLng?: number,
) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
      body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e5e7eb; }
      .leaflet-popup-content { font-family: monospace; font-size: 12px; text-align: left; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Marcador de posición del usuario azul simulado
      ${
        showUser && userLat && userLng
          ? `
        var userIcon = L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup('<b>Estás aquí</b>');
      `
          : ''
      }

      // Marcadores de los eventos
      var markers = ${JSON.stringify(markersData)};
      markers.forEach(function(m) {
        var marker = L.marker([m.latitude, m.longitude]).addTo(map);
        if (m.popupHtml) {
          marker.bindPopup(m.popupHtml);
        }
        // Escucha el click del marcador y lo comunica a React Native
        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_CLICK', id: m.id }));
        });
      });

      // Escucha el click en cualquier punto del mapa para crear coordenadas
      map.on('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'MAP_CLICK', 
          latitude: e.latlng.lat, 
          longitude: e.latlng.lng 
        }));
      });
    </script>
  </body>
  </html>
`;

export function EventMap({ latitude, longitude, title, description, onMapPress }: EventMapProps) {
  const safeLat = latitude || 41.3851;
  const safeLng = longitude || 2.1734;

  const singleMarker = [{ latitude: safeLat, longitude: safeLng, id: 'single' }];
  const htmlContent = generarHtmlLeaflet(safeLat, safeLng, 14, singleMarker, false);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK' && onMapPress) {
        onMapPress({
          nativeEvent: { coordinate: { latitude: data.latitude, longitude: data.longitude } },
        });
      }
    } catch (e) {}
  };

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.mapFill}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

export function MultiEventMap({
  markers,
  userLatitude,
  userLongitude,
  onMarkerPress,
}: MultiEventMapProps) {
  const finalLat = userLatitude || 41.3851;
  const finalLng = userLongitude || 2.1734;

  const validMarkers = (markers || []).filter(
    (m) => m && typeof m.latitude === 'number' && typeof m.longitude === 'number',
  );

  const mappedMarkers = validMarkers.map((m) => ({
    id: m.id,
    latitude: m.latitude,
    longitude: m.longitude,
    popupHtml: `<b>Nombre:</b> ${m.title}<br/><b>Fecha:</b> ${formatearFechaConGuiones(m.eventDate)}`,
  }));

  const mobileHtml = generarHtmlLeaflet(
    finalLat,
    finalLng,
    13,
    mappedMarkers,
    true,
    finalLat,
    finalLng,
  );

  const handleMobileMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK') {
        onMarkerPress?.(data.id);
      }
    } catch (e) {}
  };

  return (
    <View style={[styles.mapContainer, { height: 300 }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mobileHtml }}
        style={styles.mapFill}
        onMessage={handleMobileMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

export default EventMap;

const styles = StyleSheet.create({
  mapContainer: {
    height: 220,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb',
  },
  mapFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
