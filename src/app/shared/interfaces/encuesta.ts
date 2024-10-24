
export interface Encuesta {
  id?: string;
  name: string;
  age: number;
  phoneNumber: string;
  deportes: {
    basquet: boolean,
    futbol: boolean,
    tenis: boolean,
    voley: boolean,
    otros: boolean,
  };
  estacion: string;
  pasatiempos: string;
  createdAt: Date;
}
