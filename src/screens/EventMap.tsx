import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

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

// Helper común para formatear fechas de forma segura sin romper componentes
const formatearFechaConGuiones = (dateString?: string) => {
  if (!dateString) return 'xx-xx-xx';

  if (dateString.includes('/')) {
    const soloFecha = dateString.split(' ')[0];
    const partes = soloFecha.split('/');
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const anio = partes[2];
    return `${dia}-${mes}-${anio}`;
  }

  const fecha = new Date(dateString);
  if (isNaN(fecha.getTime())) return 'xx-xx-xx';

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
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

  // Fallback para móvil (React Native Maps)
  const MapViewModule = require('react-native-maps').default;
  const { Marker: MobileMarker } = require('react-native-maps');

  return (
    <View style={styles.mapContainer}>
      <MapViewModule
        style={styles.map}
        initialRegion={{
          latitude: safeLat,
          longitude: safeLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={onMapPress}
      >
        <MobileMarker
          coordinate={{ latitude: safeLat, longitude: safeLng }}
          title={title || 'Ubicación'}
          description={description}
        />
      </MapViewModule>
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

  if (Platform.OS === 'web' && WebMapComponents) {
    const { Leaflet } = WebMapComponents;
    const centerPosition: [number, number] = [finalLat, finalLng];

    return (
      <View style={[styles.mapContainer, { height: 300 }]}>
        <Leaflet.MapContainer
          center={centerPosition}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
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
              eventHandlers={{
                click: () => onMarkerPress?.(marker.id),
              }}
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

  const MapViewModule = require('react-native-maps').default;
  const { Marker: MobileMarker, Callout: MobileCallout } = require('react-native-maps');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (userLatitude && userLongitude && mapRef.current) {
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
      <MapViewModule
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: finalLat,
          longitude: finalLng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        <MobileMarker
          coordinate={{ latitude: finalLat, longitude: finalLng }}
          title="Mi ubicación"
          pinColor="#3b82f6"
        />

        {markers.map((item) => (
          <MobileMarker
            key={item.id}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            pinColor="#7c3aed"
            onCalloutPress={() => onMarkerPress?.(item.id)}
          >
            <MobileCallout tooltip={false}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Nombre: {item.title}</Text>
                <Text style={styles.calloutText}>
                  Fecha: {formatearFechaConGuiones(item.eventDate)}
                </Text>
              </View>
            </MobileCallout>
          </MobileMarker>
        ))}
      </MapViewModule>
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
    ...StyleSheet.absoluteFillObject,
  },
  calloutContainer: {
    padding: 6,
    minWidth: 140,
    backgroundColor: '#ffffff',
  },
  calloutText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#333333',
    lineHeight: 16,
  },
});
