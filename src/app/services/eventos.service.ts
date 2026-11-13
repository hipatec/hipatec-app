import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface EventoEntrada {
  titulo: string; data: string; horario: string | null; local: string; descricao: string;
  visibilidade: 'PRIVADO' | 'PUBLICO'; requisicaoId: string;
}
export interface Evento extends Omit<EventoEntrada, 'requisicaoId'> { id: number; fuso: string; }

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly url = `${environment.apiUrl}eventos`;
  constructor(private http: HttpClient) {}
  criar(evento: EventoEntrada) { return this.http.post<Evento>(this.url, evento); }
  listar(de: string, ate: string) { return this.http.get<Evento[]>(this.url, { params: { de, ate } }); }
}
