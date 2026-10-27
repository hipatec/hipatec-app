import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  OnboardingRespostas,
  OnboardingService
} from '../../services/onboarding.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class OnboardingPage {
  etapa = 0;
  enviando = false;
  erro = '';

  respostas: OnboardingRespostas = {
    nivelExperiencia: '',
    areasInteresse: [],
    objetivos: [],
    principalDificuldade: '',
    formatoAprendizado: ''
  };

  constructor(
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  get progresso(): number {
    return ((this.etapa + 1) / 4) * 100;
  }

  selecionarArea(area: string): void {
    const areas = this.respostas.areasInteresse;

    if (areas.includes(area)) {
      this.respostas.areasInteresse = areas.filter(item => item !== area);
    } else {
      this.respostas.areasInteresse = [...areas, area];
    }
  }

  selecionarObjetivo(objetivo: string): void {
    const objetivos = this.respostas.objetivos;

    if (objetivos.includes(objetivo)) {
      this.respostas.objetivos = objetivos.filter(item => item !== objetivo);
    } else {
      this.respostas.objetivos = [...objetivos, objetivo];
    }
  }

  estaSelecionada(lista: string[], valor: string): boolean {
    return lista.includes(valor);
  }

  avancar(): void {
    this.erro = '';

    if (!this.etapaValida()) {
      this.erro = 'Selecione uma opção para continuar.';
      return;
    }

    if (this.etapa < 3) {
      this.etapa++;
    } else {
      this.finalizar();
    }
  }

  voltar(): void {
    if (this.etapa > 0) {
      this.etapa--;
      this.erro = '';
    }
  }

  private etapaValida(): boolean {
    switch (this.etapa) {
      case 0:
        return !!this.respostas.nivelExperiencia;
      case 1:
        return this.respostas.areasInteresse.length > 0;
      case 2:
        return this.respostas.objetivos.length > 0;
      case 3:
        return !!this.respostas.principalDificuldade &&
          !!this.respostas.formatoAprendizado;
      default:
        return false;
    }
  }

  finalizar(): void {
    if (!this.etapaValida()) {
      this.erro = 'Preencha as opções desta etapa.';
      return;
    }

    this.enviando = true;
    this.erro = '';

    this.onboardingService.salvarRespostas(this.respostas).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/mentorias']);
      },
      error: (erro: { error?: { message?: string } }) => {
        this.enviando = false;
        this.erro =
          erro?.error?.message ??
          'Não foi possível salvar suas respostas. Tente novamente.';
      }
    });
  }
}
