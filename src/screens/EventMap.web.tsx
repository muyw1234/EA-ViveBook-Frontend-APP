import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet CSS necesario para el entorno web
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

// Componente para actualizar dinámicamente la vista del mapa Leaflet
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
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

export default function EventMap({
  latitude,
  longitude,
  title,
  description,
  onMapPress,
}: EventMapProps) {
  // Aseguramos fallback numérico si no se envían datos iniciales
  const safeLat = typeof latitude === 'number' ? latitude : 41.3851;
  const safeLng = typeof longitude === 'number' ? longitude : 2.1734;
  const position: [number, number] = [safeLat, safeLng];

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'web' ? (
        <MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }}>
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <MapEventsHandler onMapPress={onMapPress} />
        </MapContainer>
      ) : null}
    </View>
  );
}

export function MultiEventMap({
  markers,
  userLatitude,
  userLongitude,
  onMarkerPress,
}: MultiEventMapProps) {
  const finalLat = typeof userLatitude === 'number' ? userLatitude : 41.3851;
  const finalLng = typeof userLongitude === 'number' ? userLongitude : 2.1734;

  // Filtramos marcadores corruptos o vacíos que puedan romper Leaflet
  const validMarkers = (markers || []).filter(
    (m) => m && typeof m.latitude === 'number' && typeof m.longitude === 'number',
  );

  const centerLat = validMarkers.length > 0 ? validMarkers[0].latitude : finalLat;
  const centerLng = validMarkers.length > 0 ? validMarkers[0].longitude : finalLng;
  const centerPosition: [number, number] = [centerLat, centerLng];

  function ProximityHoverHandler() {
    const map = useMap();

    useEffect(() => {
      const handleMouseMove = (e: L.LeafletMouseEvent) => {
        let closestMarker: any = null;
        let minDistance = 0.002;

        validMarkers.forEach((marker) => {
          const latDiff = Math.abs(e.latlng.lat - marker.latitude);
          const lngDiff = Math.abs(e.latlng.lng - marker.longitude);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          if (distance < minDistance) {
            minDistance = distance;
            closestMarker = marker;
          }
        });

        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && layer.getLatLng) {
            const latLng = layer.getLatLng();
            if (
              closestMarker &&
              latLng.lat === closestMarker.latitude &&
              latLng.lng === closestMarker.longitude
            ) {
              layer.openPopup();
            }
          }
        });
      };

      map.on('mousemove', handleMouseMove);
      return () => {
        map.off('mousemove', handleMouseMove);
      };
    }, [map]);

    return null;
  }

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

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'web' ? (
        <MapContainer center={centerPosition} zoom={13} style={{ width: '100%', height: '100%' }}>
          <ChangeView center={centerPosition} />
          <ProximityHoverHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {typeof userLatitude === 'number' && typeof userLongitude === 'number' ? (
            <Marker position={[userLatitude, userLongitude]}>
              <Popup>Estás aquí</Popup>
            </Marker>
          ) : null}

          {validMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              eventHandlers={{
                click: () => {
                  if (onMarkerPress) {
                    onMarkerPress(marker.id);
                  }
                },
              }}
            >
              <Popup>
                <div
                  style={{
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#333',
                  }}
                >
                  <div>Nombre: {marker.title}</div>
                  <div>Fecha: {formatearFechaConGuiones(marker.eventDate)}</div>
                </div>
              </Popup>
            </Marker>
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
