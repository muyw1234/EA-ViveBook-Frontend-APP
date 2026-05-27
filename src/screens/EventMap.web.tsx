import React from 'react';
import { View, StyleSheet } from 'react-native';

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

// Mapa individual (Este ya te funciona perfecto)
export default function EventMap({ latitude, longitude, title }: EventMapProps) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005}%2C${latitude-0.005}%2C${longitude+0.005}%2C${latitude+0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return (
    <View style={styles.mapContainer}>
      <iframe title={title} width="100%" height="100%" style={{ border: 0 }} src={mapUrl} />
    </View>
  );
}

export function MultiEventMap({ markers, userLatitude, userLongitude }: MultiEventMapProps) {
  // Ajustamos el delta a 0.01 para que el Zoom sea mucho más cercano (callejero de Barcelona)
  const zoomDelta = 0.01; 
  
  // Si hay marcadores, centramos la vista en el primer evento para asegurar que se vea la zona con acción
  const centerLat = markers.length > 0 ? markers[0].latitude : userLatitude;
  const centerLng = markers.length > 0 ? markers[0].longitude : userLongitude;

  // Calculamos la caja de visualización (Bounding Box)
  const minLng = centerLng - zoomDelta;
  const minLat = centerLat - zoomDelta;
  const maxLng = centerLng + zoomDelta;
  const maxLat = centerLat + zoomDelta;

  // Para que OpenStreetMap pinte un marcador destacado en el centro de los eventos en la versión embebida:
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;

  return (
    <View style={styles.mapContainer}>
      <iframe 
        title="Multi Event Map" 
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
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#e5e7eb'
  },
});