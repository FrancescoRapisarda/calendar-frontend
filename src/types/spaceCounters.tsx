export interface SpaceCounters {
    "Sala de Aula": number;
    "Ateliê Criativo": number;
    "Auditório": number;
    "Quadra": number;
    "Sala Google": number;
    "Brinquedoteca": number;
    "Biblioteca": number;
    "Área externa": number;
}

export type Space = keyof SpaceCounters;