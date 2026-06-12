import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

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

export default function EventMap({
  latitude,
  longitude,
  title,
  description,
  onMapPress,
}: EventMapProps) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null &&
      mapRef.current
    ) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  }, [latitude, longitude]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        onPress={onMapPress}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          description={description}
          pinColor="#7c3aed"
        />
      </MapView>
    </View>
  );
}

export function MultiEventMap({ markers, userLatitude, userLongitude }: MultiEventMapProps) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (
      userLatitude !== undefined &&
      userLatitude !== null &&
      userLongitude !== undefined &&
      userLongitude !== null &&
      mapRef.current
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        },
        1000,
      );
    }
  }, [userLatitude, userLongitude]);

  return (
    <View style={[styles.mapContainer, { height: 300 }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLatitude || 41.3851,
          longitude: userLongitude || 2.1734,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        {/* Marcador del propio Usuario */}
        {userLatitude !== undefined &&
        userLatitude !== null &&
        userLongitude !== undefined &&
        userLongitude !== null ? (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            title="Mi ubicación"
            pinColor="#3b82f6"
          />
        ) : null}

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
    backgroundColor: '#e5e7eb',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
