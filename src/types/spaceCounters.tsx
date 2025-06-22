export interface SpaceCounters {
    "Brinquedoteca": number;
    "Sala Google": number;
    "Sala de Video": number;
    "Atelier Criativo": number;
}

export type Space = keyof SpaceCounters;