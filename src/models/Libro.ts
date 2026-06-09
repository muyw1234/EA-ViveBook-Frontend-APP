
export type SellType = 'VENTA' | 'ALQUILER';
// Faltan muchos modelos -_-
export default interface ILibro {
    _id: string; // Lo he tenido que poner en el frontend web, no tengo claro si ponerlo. Anyways, TODO: reflejar el cambio en Frontend Web
    isbn: string;
    title: string;
    authors?: String[];
    autor?: string;
    categoria?: string;
    type: SellType;
    precio: number;
    estado: string;
    owner?: string;
    IsDeleted?: boolean;
    rentalStartDate?: Date;
    rentalEndDate?: Date;
    imageUrl?: string;
    isReserved?: boolean;
    reservedBy?: string;
}