import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

export default function EventMap({ latitude, longitude, title, description }: EventMapProps) {
  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
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

const styles = StyleSheet.create({
  mapContainer: {
    height: 180,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb'
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});