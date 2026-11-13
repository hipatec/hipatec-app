import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Mentoria {
  id?: number;
  idMentora?: number;
  area?: string;
  formato?: string;
  requisicaoId?: string;
  titulo: string;
  descricao?: string;
  progresso?: number;
}

export interface MentoriaCreate {
  idMentora?: number;
  area?: string;
  formato?: string;
  requisicaoId?: string;
  titulo: string;
  descricao?: string;
  progresso?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MentoriasService {
  private base = `${environment.apiUrl}mentorias`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Mentoria[]> {
    return this.http.get<Mentoria[]>(this.base);
  }

  create(payload: MentoriaCreate): Observable<Mentoria> {
    return this.http.post<Mentoria>(this.base, payload);
  }
}
