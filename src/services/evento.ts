import api from './api';
import { getApiCollection, getPaginatedData, unwrapApiData } from '../utils/apiResponse';

// Usamos la nomenclatura GeoJSON precisa de tu versión web
export interface IGeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IParticipant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Interfaz para cuando el backend te devuelve el objeto completo
export interface IEvento {
  _id: string;
  title: string;
  description: string;
  creator: string | { _id: string; name: string; email: string };
  participant: IParticipant[];
  eventDate: string;
  createdDate: string;
  location: IGeoJSONPoint;
  direccionExacta: string;
  IsDeleted?: boolean;
}

// Interfaz necesaria para la carga útil de creación (Payload)
export interface IEventoData {
  _id?: string;
  title: string;
  description: string;
  creator?: string; // ID del usuario autenticado que lo crea
  participant?: string[];
  eventDate: string; // Formato ISO string adecuado para transporte JSON
  createdDate: string;
  location: IGeoJSONPoint;
  direccionExacta: string;
}

const EventoService = {
  // ➕ MÉTODO NUEVO: Sincronizado con la lógica de tu web
  createEvento: async (eventoData: IEventoData): Promise<IEvento> => {
    try {
      const response = await api.post('/eventos', eventoData);
      return unwrapApiData<IEvento>(response.data);
    } catch (error) {
      console.error('Error al crear el evento desde la app:', error);
      throw error;
    }
  },

  getAllEventos: async (
    page?: number,
    limit?: number,
    upcoming?: boolean,
    search?: string,
    sort?: string,
  ): Promise<{ data: IEvento[]; pagination: any }> => {
    try {
      const response = await api.get('/eventos', {
        params: { page, limit, upcoming, search, sort },
      });
      return getPaginatedData<IEvento>(response.data);
    } catch (error) {
      console.error('Error al obtener eventos globales:', error);
      throw error;
    }
  },

  getEvento: async (eventoId: string): Promise<IEvento> => {
    const response = await api.get(`/eventos/${eventoId}`);
    return unwrapApiData<IEvento>(response.data);
  },

  getEventsAtExactLocation: async (lng: number, lat: number): Promise<IEvento[]> => {
    try {
      const response = await api.get(`/eventos/exact-location`, {
        params: { lng, lat },
      });
      return getApiCollection<IEvento>(response.data);
    } catch (error) {
      console.error('Error fetching events at exact location:', error);
      throw error;
    }
  },

  // Prueba esto en tu EventoService si sigue fallando por temas de autenticación:
  participateEvento: async (eventoId: string, usuarioId: string): Promise<IEvento> => {
    const response = await api.put(`/eventos/${eventoId}/participate`, { usuarioId });
    return unwrapApiData<IEvento>(response.data);
  },

  leaveEvento: async (eventoId: string, usuarioId: string): Promise<IEvento> => {
    const response = await api.put(`/eventos/${eventoId}/leave`, { usuarioId });
    return unwrapApiData<IEvento>(response.data);
  },
};

export default EventoService;
