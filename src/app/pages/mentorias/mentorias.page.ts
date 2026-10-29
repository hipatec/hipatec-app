import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { MentoriasService, Mentoria } from '../../services/mentorias.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mentorias',
  templateUrl: './mentorias.page.html',
  styleUrls: ['./mentorias.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true
})

export class MentoriasPage implements OnInit {

  public userRole = '';

  // dados simulados (quando o banco chegar, você só substituirá estes dois array)
  public minhasMentorias: Mentoria[] = [
    { id: 1, titulo: 'Lógica de programação', descricao: 'Lógica de programação do ZERO para iniciantes', progresso: 0.6 },
    { id: 2, titulo: 'Fundamentos do UX Design', descricao: 'Fundamentos do UX Design', progresso: 1.0 },
    { id: 3, titulo: 'Banco de Dados SQL', descricao: 'Banco de Dados SQL e Lógica de BD', progresso: 0.2 },
    { id: 4, titulo: 'Introdução à Inteligência Artificial', descricao: 'Conceitos essenciais para começar a explorar IA', progresso: 0.8 },
  ];

  public meuAprendizado: Mentoria[] = [
    { id: 101, titulo: 'Lógica de programação', descricao: 'Lógica de programação do zero para iniciantes', progresso: 0.6 },
    { id: 102, titulo: 'Fundamentos do UX Design', descricao: 'Fundamentos de experiência e interface', progresso: 1.0 },
    { id: 103, titulo: 'Banco de Dados SQL', descricao: 'Banco de dados SQL e lógica de BD', progresso: 0.2 }
  ];
  public mentoriasDisponiveis = [
    { id: 10, titulo: 'Mentoria de Carreira', mentora: 'Ana Silva', descricao: 'Como se preparar para entrevistas.' },
    { id: 11, titulo: 'Mentoria Tech', mentora: 'Bia Costa', descricao: 'Dicas de arquitetura Angular.' },
  ];

  public agenda = [
    { data: '12 NOV', titulo: 'Entrega do projeto de SQL', tipo: 'Prazo' },
    { data: '15 NOV', titulo: 'Mentoria de Carreira', tipo: 'Mentoria' },
    { data: '20 NOV', titulo: 'Conclusão de UX Design', tipo: 'Curso' }
  ];

  public mesAtual = 10;
  public anoAtual = 2026;
  private readonly eventosPorMes: Record<string, number[]> = {
    '2026-10': [12, 15, 20]
  };

  get diasDoMes(): Array<number | null> {
    const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1).getDay();
    const deslocamento = (primeiroDia + 6) % 7;
    const totalDias = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
    return [...Array(deslocamento).fill(null), ...Array.from({ length: totalDias }, (_, index) => index + 1)];
  }

  get diasComEvento(): number[] {
    return this.eventosPorMes[`${this.anoAtual}-${this.mesAtual}`] ?? [];
  }

  get tituloDoMes(): string {
    const titulo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(this.anoAtual, this.mesAtual, 1));
    return titulo.charAt(0).toUpperCase() + titulo.slice(1);
  }

  mudarMes(direcao: number) {
    const proximoMes = new Date(this.anoAtual, this.mesAtual + direcao, 1);
    this.mesAtual = proximoMes.getMonth();
    this.anoAtual = proximoMes.getFullYear();
  }

  constructor(
    private modalCtrl: ModalController,
    private mentoriasService: MentoriasService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ calendarOutline, chevronBackOutline, chevronForwardOutline });
  }

  goToAprendizado() {
    this.router.navigate(['/aprendizado']);
  }
  isMentora(): boolean {
    return this.userRole === 'mentoras';
  }
  ngOnInit() {
    this.authService.sessao().subscribe({
      next: sessao => {
        this.userRole = sessao.role;
        this.loadMentorias();
      },
      error: () => { this.userRole = ''; }
    });
  }

  loadMentorias() {
    this.mentoriasService.getAll().subscribe({
      next: (data) => this.minhasMentorias = data,
      error: (err) => {
        console.error('Erro ao carregar mentorias', err);
        // fallback: keep empty or optionally set sample data
      }
    });
  }

  async abrirDetalhes(item: any) {
    console.log('Abrindo detalhes de:', item);
  }

}
