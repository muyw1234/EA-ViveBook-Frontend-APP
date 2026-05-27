import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

export default function EventMap({ latitude, longitude, title, description }: EventMapProps) {
  // Generamos un mapa interactivo visual para la web usando OpenStreetMap embebido
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005}%2C${latitude-0.005}%2C${longitude+0.005}%2C${latitude+0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.mapContainer}>
      <iframe
        title={title}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={mapUrl}
      />
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
});