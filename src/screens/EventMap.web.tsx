import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// @ts-expect-error: Leaflet no tiene tipos oficiales, pero esto es necesario para que funcione en la web
import 'leaflet/dist/leaflet.css';
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
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
}

// Componente auxiliar interno para capturar eventos de click en Leaflet Web
function MapEventsHandler({ onMapPress }: { onMapPress?: (e: any) => void }) {
  useMapEvents({
    click(e) {
      if (onMapPress) {
        onMapPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            },
          },
        });
      }
    },
  });
  return null;
}

// MAPA INDIVIDUAL INTERACTIVO PARA LA CREACIÓN EN WEB
export default function EventMap({ latitude, longitude, title, onMapPress }: EventMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <View style={styles.mapContainer}>
      {/* Comprobamos que estemos en entorno web antes de inyectar componentes del DOM */}
      {Platform.OS === 'web' ? (
        <MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          {/* Controlador de clicks en la web */}
          <MapEventsHandler onMapPress={onMapPress} />
        </MapContainer>
      ) : null}
    </View>
  );
}

// MAPA MULTI-EVENTO WEB
export function MultiEventMap({ markers, userLatitude, userLongitude }: MultiEventMapProps) {
  const centerLat = markers.length > 0 ? markers[0].latitude : userLatitude;
  const centerLng = markers.length > 0 ? markers[0].longitude : userLongitude;
  const centerPosition: [number, number] = [centerLat, centerLng];

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'web' ? (
        <MapContainer center={centerPosition} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ubicación del usuario actual */}
          <Marker position={[userLatitude, userLongitude]} />

          {/* Renderizado de eventos circundantes */}
          {markers.map((marker) => (
            <Marker key={marker.id} position={[marker.latitude, marker.longitude]} />
          ))}
        </MapContainer>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 220,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb',
  },
});
