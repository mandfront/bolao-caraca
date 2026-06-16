export interface ApiFutebolMatch {
  partida_id: number | string
  status: string
  placar: string | null
  placar_mandante: number | null
  placar_visitante: number | null
  placar_penalti_mandante: number | null
  placar_penalti_visitante: number | null
  fase: string | null
  estadio: string | null
  data_realizacao: string | null
  hora_realizacao: string | null
  data_realizacao_iso: string | null
  minuto: string | null
  time_mandante: ApiFutebolTeam
  time_visitante: ApiFutebolTeam
  placar_oficial_mandante: number | null
  placar_oficial_visitante: number | null
}

export interface ApiFutebolTeam {
  time_id: number | string
  nome_popular: string
  sigla: string
  escudo: string
  nome: string
}

export interface ApiFutebolEvent {
  evento_id?: string | number
  minuto: number | null
  tipo: string
  atleta: string | null
  atleta_associado?: string | null
  descricao?: string | null
  time_id: string | number
}

export interface ApiFutebolLineup {
  time_id: string | number
  escalacao: string | null
  tecnico: string | null
  atletas: ApiFutebolPlayer[]
}

export interface ApiFutebolPlayer {
  atleta_id?: string | number
  nome_popular: string
  camisa: number | null
  posicao: string | null
  titular: boolean
}

export interface ApiFutebolResponse<T> {
  data?: T
  error?: string
}
