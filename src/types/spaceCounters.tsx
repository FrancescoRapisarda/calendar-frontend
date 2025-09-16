export interface SpaceCounters {
    // "Brinquedoteca": number;
    "Sala Google": number;
    "Sala de Video": number;
    "Atelier Criativo": number;
    "Sala de Aula": number;
    "Brinquedoteca": number;
    "Corredores": number;
    "Area Externa": number;
}

export type Space = keyof SpaceCounters;