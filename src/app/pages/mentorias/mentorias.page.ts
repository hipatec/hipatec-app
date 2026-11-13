import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { MentoriasService, Mentoria } from '../../services/mentorias.service';
import { EventosService, Evento } from '../../services/eventos.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { abrirModalEvento, podePublicarEvento } from '../../components/event-form-modal/event-form-modal.component';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mentorias',
  templateUrl: './mentorias.page.html',
  styleUrls: ['./mentorias.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true
})

export class MentoriasPage implements OnInit, OnDestroy {

  public userRole = '';
  @ViewChild('botaoEvento') private botaoEvento?: ElementRef<HTMLButtonElement>;
  private sessaoCarregada = false;
  private eventoSolicitadoPelaRota = false;
  private modalEventoAberto = false;

  public minhasMentorias: Mentoria[] = [];
  public meuAprendizado: Mentoria[] = [];
  public mentoriasDisponiveis: Array<{ id: number; titulo: string; mentora: string; descricao: string }> = [];
  public agenda: Array<{ data: string; titulo: string; tipo: string; local: string; descricao: string }> = [];

  public mesAtual = new Date().getMonth();
  public anoAtual = new Date().getFullYear();
  eventos: Evento[] = [];
  carregandoEventos = false;
  erroEventos = '';
  avisoEvento = '';
  private consultaEventos?: Subscription;

  get diasDoMes(): Array<number | null> {
    const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1).getDay();
    const deslocamento = (primeiroDia + 6) % 7;
    const totalDias = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
    return [...Array(deslocamento).fill(null), ...Array.from({ length: totalDias }, (_, index) => index + 1)];
  }

  get diasComEvento(): number[] {
    return this.eventos.map(e => Number(e.data.slice(8, 10)));
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
    if (this.sessaoCarregada) this.carregarEventos();
  }

  constructor(
    private modalCtrl: ModalController,
    private mentoriasService: MentoriasService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private eventosService: EventosService
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
    // Entrada pela rota legada /calendario/eventos/novo (redireciona para /painel?evento=novo).
    this.route.queryParamMap.subscribe(params => {
      this.eventoSolicitadoPelaRota = params.get('evento') === 'novo';
      this.abrirEventoSolicitado();
    });
    this.authService.sessao().subscribe({
      next: sessao => {
        this.userRole = sessao.role;
        this.sessaoCarregada = true;
        this.loadMentorias();
        this.carregarEventos();
        this.abrirEventoSolicitado();
      },
      error: () => { this.userRole = ''; }
    });
  }

  /** Os campos dependem do papel: só abre pela rota depois que a sessão responder. */
  private abrirEventoSolicitado() {
    if (this.eventoSolicitadoPelaRota && this.sessaoCarregada) this.abrirEvento();
  }

  async abrirEvento() {
    if (this.modalEventoAberto) return;
    this.modalEventoAberto = true;
    const origem = document.activeElement as HTMLElement | null;
    try {
      const modal = await abrirModalEvento(this.modalCtrl, this.alertCtrl, podePublicarEvento(this.userRole));
      const resultado = await modal.onDidDismiss<Evento>();
      if (resultado.role === 'saved' && resultado.data) {
        this.anoAtual = Number(resultado.data.data.slice(0, 4));
        this.mesAtual = Number(resultado.data.data.slice(5, 7)) - 1;
        this.avisoEvento = 'Evento salvo. Atualizando agenda…';
        this.carregarEventos();
      }
    } finally {
      this.modalEventoAberto = false;
    }
    if (this.eventoSolicitadoPelaRota) {
      this.eventoSolicitadoPelaRota = false;
      // Troca a entrada do histórico (sem voltar nem empilhar): fechar não reabre o modal.
      await this.router.navigate([], { relativeTo: this.route, queryParams: { evento: null }, queryParamsHandling: 'merge', preserveFragment: true, replaceUrl: true });
    }
    const ativo = document.activeElement;
    if (!ativo || ativo === document.body) {
      const alvo = origem && origem !== document.body && origem.isConnected ? origem : this.botaoEvento?.nativeElement;
      alvo?.focus();
    }
  }

  carregarEventos() {
    this.consultaEventos?.unsubscribe();
    this.carregandoEventos = true;
    this.erroEventos = '';
    this.eventos = []; this.agenda = [];
    const mes = String(this.mesAtual + 1).padStart(2, '0');
    const ultimo = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
    this.consultaEventos = this.eventosService.listar(`${this.anoAtual}-${mes}-01`, `${this.anoAtual}-${mes}-${ultimo}`).subscribe({
      next: eventos => {
        this.eventos = eventos;
        this.agenda = eventos.map(e => ({
          titulo: e.titulo, local: e.local, descricao: e.descricao,
          data: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${e.data}T12:00:00Z`)),
          tipo: `${e.horario ? e.horario.slice(0, 5) + ' · America/Sao_Paulo' : 'Dia inteiro'} · ${e.visibilidade === 'PRIVADO' ? 'Privado' : 'Público'}`
        }));
        this.carregandoEventos = false;
        if (this.avisoEvento) this.avisoEvento = 'Evento salvo. Agenda atualizada.';
      },
      error: () => {
        this.carregandoEventos = false;
        this.erroEventos = 'Não foi possível carregar os eventos. Tente novamente.';
        if (this.avisoEvento) this.avisoEvento = 'Evento salvo. A atualização da agenda falhou; tente carregar novamente.';
      }
    });
  }

  ngOnDestroy() { this.consultaEventos?.unsubscribe(); }

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
