import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
export interface Curso { id?: number; idMentora?: number; titulo: string; descricao: string; instituicao: string; formato: string; requisicaoId: string; }
@Injectable({ providedIn: 'root' })
export class CursosService {
  private readonly url = `${environment.apiUrl}cursos`;
  constructor(private http: HttpClient) {}
  getAll() { return this.http.get<Curso[]>(this.url); }
  create(entrada: Curso) { return this.http.post<Curso>(this.url, entrada); }
}
