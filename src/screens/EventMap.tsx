import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapMarkerData {
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
}

interface MultiEventMapProps {
  markers: MapMarkerData[];
  userLatitude: number;
  userLongitude: number;
}

export default function EventMap({ latitude, longitude, title, description }: EventMapProps) {
  return (
    <View style={styles.mapContainer}>
      <MapView style={styles.map} initialRegion={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
        <Marker coordinate={{ latitude, longitude }} title={title} description={description} pinColor="#7c3aed" />
      </MapView>
    </View>
  );
}

// NUEVO: Componente multi-marcador para el DiscoverScreen móvil
export function MultiEventMap({ markers, userLatitude, userLongitude }: MultiEventMapProps) {
  return (
    <View style={[styles.mapContainer, { height: 300 }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLatitude || 41.3851, // Barcelona por defecto
          longitude: userLongitude || 2.1734,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        {/* Marcador del propio Usuario */}
        <Marker 
          coordinate={{ latitude: userLatitude, longitude: userLongitude }} 
          title="Mi ubicación" 
          pinColor="#3b82f6" 
        />

        {/* Marcadores de los eventos cercanos */}
        {markers.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            title={item.title}
            pinColor="#7c3aed"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 180,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb'
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});