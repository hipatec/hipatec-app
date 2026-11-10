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

  public minhasMentorias: Mentoria[] = [];
  public meuAprendizado: Mentoria[] = [];
  public mentoriasDisponiveis: Array<{ id: number; titulo: string; mentora: string; descricao: string }> = [];
  public agenda: Array<{ data: string; titulo: string; tipo: string }> = [];

  public mesAtual = new Date().getMonth();
  public anoAtual = new Date().getFullYear();
  private readonly eventosPorMes: Record<string, number[]> = {};

  get diasDoMes(): Array<number | null> {
    const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1).getDay();
    const deslocamento = (primeiroDia + 6) % 7;
    const totalDias = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
    return [...Array(deslocamento).fill(null), ...Array.from({ length: totalDias }, (_, index) => index + 1)];
  }

  get diasComEvento(): number[] {
    return this.eventosPorMes[`${this.anoAtual}-${this.mesAtual}`] ?? [];
  }

  get mentoriasEmAndamento(): number {
    return this.minhasMentorias.filter(item => (item.progresso ?? 0) < 1).length;
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
