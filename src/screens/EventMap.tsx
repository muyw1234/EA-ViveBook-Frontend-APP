import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
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

let WebMapComponents: any = null;
if (Platform.OS === 'web') {
  const Leaflet = require('react-leaflet');
  const L = require('leaflet');
  require('leaflet/dist/leaflet.css');

  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  function ChangeView({ center }: { center: [number, number] }) {
    const map = Leaflet.useMap();
    useEffect(() => {
      if (center && center[0] !== undefined && center[1] !== undefined) {
        map.setView(center, map.getZoom());
      }
    }, [center, map]);
    return null;
  }

  function MapEventsHandler({ onMapPress }: { onMapPress?: (e: any) => void }) {
    Leaflet.useMapEvents({
      click(e: any) {
        if (onMapPress) {
          onMapPress({
            nativeEvent: {
              coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng },
            },
          });
        }
      },
    });
    return null;
  }

  WebMapComponents = { Leaflet, L, ChangeView, MapEventsHandler };
}

export function EventMap({ latitude, longitude, title, description, onMapPress }: EventMapProps) {
  const safeLat = latitude || 41.3851;
  const safeLng = longitude || 2.1734;

  if (Platform.OS === 'web' && WebMapComponents) {
    const { Leaflet, ChangeView, MapEventsHandler } = WebMapComponents;
    const position: [number, number] = [safeLat, safeLng];

    return (
      <View style={styles.mapContainer}>
        <Leaflet.MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }}>
          <ChangeView center={position} />
          <Leaflet.TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Leaflet.Marker position={position} />
          <MapEventsHandler onMapPress={onMapPress} />
        </Leaflet.MapContainer>
      </View>
    );
  }

  const singleEventHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${safeLat}, ${safeLng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${safeLat}, ${safeLng}]).addTo(map).bindPopup('<b>${title || "Ubicación"}</b><br>${description || ""}').openPopup();
        
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({latitude: e.latlng.lat, longitude: e.latlng.lng}));
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: singleEventHTML }}
        style={styles.map}
        onMessage={(event) => {
          if (onMapPress) {
            const coords = JSON.parse(event.nativeEvent.data);
            onMapPress({ nativeEvent: { coordinate: coords } });
          }
        }}
      />
    </View>
  );
}

export function MultiEventMap({ markers, userLatitude, userLongitude, onMarkerPress }: MultiEventMapProps) {
  const finalLat = userLatitude || 41.3851;
  const finalLng = userLongitude || 2.1734;

  if (Platform.OS === 'web' && WebMapComponents) {
    const { Leaflet } = WebMapComponents;
    const centerPosition: [number, number] = [finalLat, finalLng];

    return (
      <View style={[styles.mapContainer, { height: 300 }]}>
        <Leaflet.MapContainer center={centerPosition} zoom={13} style={{ width: '100%', height: '100%' }}>
          <Leaflet.TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Leaflet.Marker position={centerPosition}>
            <Leaflet.Popup>Estás aquí</Leaflet.Popup>
          </Leaflet.Marker>

          {markers.map((marker) => (
            <Leaflet.Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              eventHandlers={{ click: () => onMarkerPress?.(marker.id) }}
            >
              <Leaflet.Popup>
                <div style={{ textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                  <div>Nombre: {marker.title}</div>
                  <div>Fecha: {formatearFechaConGuiones(marker.eventDate)}</div>
                </div>
              </Leaflet.Popup>
            </Leaflet.Marker>
          ))}
        </Leaflet.MapContainer>
      </View>
    );
  }

  const markersJson = JSON.stringify(markers);
  const multiEventHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${finalLat}, ${finalLng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        // Marcador del usuario en azul
        var userIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        L.marker([${finalLat}, ${finalLng}], {icon: userIcon}).addTo(map).bindPopup('Estás aquí');

        // Icono violeta para los eventos
        var eventIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41]
        });

        var markersData = ${markersJson};
        markersData.forEach(function(item) {
          var m = L.marker([item.latitude, item.longitude], {icon: eventIcon}).addTo(map);
          m.bindPopup('<b>' + item.title + '</b>');
          m.on('click', function() {
            window.ReactNativeWebView.postMessage(item.id);
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.mapContainer, { height: 300 }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: multiEventHTML }}
        style={styles.map}
        onMessage={(event) => {
          const markerId = event.nativeEvent.data;
          onMarkerPress?.(markerId);
        }}
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
  map: {
    flex: 1,
  },
});