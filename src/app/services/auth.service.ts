import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  solicitarRecuperacao(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/recuperacao-senha`, { email });
  }

  redefinirSenha(token: string, senha: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}auth/redefinir-senha`, { token, senha });
  }

  login(
    role: 'estudantes' | 'mentoras',
    email: string,
    senha: string
  ): Observable<number> {

    const endpoint =
      role === 'estudantes'
        ? 'estudantes/login'
        : 'mentoras/login';

    const url = `${environment.apiUrl}${endpoint}`;
    const params = new HttpParams()
      .set('email', email)
      .set('senha', senha);

    return this.http.post<number>(url, {}, { params });
  }
  saveToken(token: string) {
    try { localStorage.setItem('auth_token', token); } catch { /* ignore on private mode */ }
  }

  getToken(): string | null {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  }

  logout() {
    try { localStorage.removeItem('auth_token'); } catch { /* ignore */ }
  }
}
