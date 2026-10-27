import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sessao { id: number; role: 'estudantes' | 'mentoras'; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  solicitarRecuperacao(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/recuperacao-senha`, { email });
  }

  redefinirSenha(token: string, senha: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/redefinir-senha`, { token, senha });
  }

  login(role: Sessao['role'], email: string, senha: string): Observable<Sessao> {
    return this.http.post<Sessao>(`${environment.apiUrl}auth/login`, { role, email, senha })
      .pipe(tap(sessao => { this.limparEstado(); this.identificar(sessao); }));
  }

  sessao(): Observable<Sessao> {
    return this.http.get<Sessao>(`${environment.apiUrl}auth/session`)
      .pipe(tap(sessao => this.identificar(sessao)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/logout`, {})
      .pipe(tap(() => this.limparEstado()));
  }

  limparEstado() {
    for (const chave of ['userId', 'userRole', 'perfil', 'pfpPerfil', 'auth_token', 'userEmail']) {
      localStorage.removeItem(chave);
    }
  }

  logout() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    } catch { /* ignore */ }
  }
}
