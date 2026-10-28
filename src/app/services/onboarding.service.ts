import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface OnboardingRespostas {
  nivelExperiencia: string;
  areasInteresse: string[];
  objetivos: string[];
  principalDificuldade: string;
  formatoAprendizado: string;
}

export interface OnboardingStatus {
  concluido: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly apiUrl = `${environment.apiUrl}api/onboarding`;

  constructor(
    private http: HttpClient
  ) {}

  salvarRespostas(respostas: OnboardingRespostas): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/respostas`,
      respostas
    );
  }

  verificarStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(
      `${this.apiUrl}/status`,
      {}
    );
  }
}
