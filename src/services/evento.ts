import api from './api';

export interface IPoint {
    type: 'Point';
    coordinates: [number, number];
}

export interface IParticipant {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface IEvento {
    _id: string;
    title: string;
    description: string;
    creator: string | { _id: string; name: string; email: string };
    participant: IParticipant[];
    eventDate: string;
    createdDate: string;
    location: IPoint;
    direccionExacta: string;
    IsDeleted?: boolean;
}

const EventoService = {
    getEvento: async (eventoId: string): Promise<IEvento> => {
        const response = await api.get(`/eventos/${eventoId}`);
        // Tu backend usa sendSuccess, extraemos los datos de response.data.data
        return response.data.data;
    },

    participateEvento: async (eventoId: string, usuarioId: string) => {
        const response = await api.put(`/eventos/${eventoId}/participate`, { usuarioId });
        return response.data.data;
    },

    leaveEvento: async (eventoId: string, usuarioId: string) => {
        const response = await api.put(`/eventos/${eventoId}/leave`, { usuarioId });
        return response.data.data;
    }
};

export default EventoService;