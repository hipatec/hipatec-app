import { confirmarAcao } from '../../services/feedback.service';
import { Component, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { EventosService } from '../../services/eventos.service';
import { mensagemErro } from '../../services/posts.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

export interface EventoForm {
  titulo: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  privacidade: 'Privado' | 'Público';
}

type CampoObrigatorio = 'titulo' | 'data' | 'horario' | 'local' | 'descricao' | 'visibilidade';

/** Estado compartilhado com quem abriu o modal: decide se fechar exige confirmação. */
export interface EstadoModalEvento { alterado: boolean; salvando?: boolean; }

/** Somente o papel operacional de mentora pode publicar; servidor valida novamente. */
export function podePublicarEvento(role: string | null | undefined): boolean {
  return role === 'mentoras';
}

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ModalShellComponent],
  templateUrl: './event-form-modal.component.html',
  styleUrls: ['./event-form-modal.component.scss']
})
export class EventFormModalComponent {
  /** Todos preenchem os campos; estudante mantém visibilidade privada. */
  @Input() podePublicar = false;
  @Input() estado: EstadoModalEvento = { alterado: false };

  salvando = false;
  erroSalvar = '';
  private readonly requisicaoId = (() => {
    // getRandomValues também funciona no HTTP da LAN; randomUUID exige contexto seguro.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  })();
  private errosServidor: Partial<Record<CampoObrigatorio, string>> = {};
  readonly form: EventoForm = { titulo: '', data: '', horario: '', local: '', descricao: '', privacidade: 'Privado' };
  private readonly inicial = JSON.stringify(this.form);

  tentouValidar = false;
  private readonly tocados = new Set<CampoObrigatorio>();

  constructor(private modalController: ModalController, private host: ElementRef<HTMLElement>, private eventos: EventosService) {}

  get erros(): Partial<Record<CampoObrigatorio, string>> {
    const erros: Partial<Record<CampoObrigatorio, string>> = {};
    if (!this.form.titulo.trim()) erros.titulo = 'Informe o nome do evento.';
    if (!this.form.data) erros.data = 'Informe a data do evento.';
    if (this.form.titulo.trim().length > 160) erros.titulo = 'Use até 160 caracteres.';
    if (this.form.data && (this.form.data < '2000-01-01' || this.form.data > '2100-12-31' || !/^\d{4}-\d{2}-\d{2}$/.test(this.form.data))) erros.data = 'Informe uma data entre 2000 e 2100.';
    if (this.form.horario && !/^([01]\d|2[0-3]):[0-5]\d$/.test(this.form.horario)) erros.horario = 'Informe um horário válido (HH:mm).';
    if (this.form.local.length > 1000) erros.local = 'Use até 1000 caracteres.';
    if (this.form.descricao.length > 4000) erros.descricao = 'Use até 4000 caracteres.';
    return { ...erros, ...this.errosServidor };
  }

  get formularioValido(): boolean {
    return Object.keys(this.erros).length === 0;
  }

  erro(campo: CampoObrigatorio): string | undefined {
    return this.tentouValidar || this.tocados.has(campo) ? this.erros[campo] : undefined;
  }

  /** Validação ao sair do campo. */
  tocar(campo: CampoObrigatorio) {
    this.tocados.add(campo);
  }

  atualizarAlterado() {
    this.estado.alterado = JSON.stringify(this.form) !== this.inicial;
    this.errosServidor = {};
  }

  salvar() {
    if (this.salvando) return;
    this.erroSalvar = '';
    this.tentouValidar = true;
    if (!this.formularioValido) {
      const primeiroErro = (['titulo', 'data', 'horario', 'local', 'descricao', 'visibilidade'] as CampoObrigatorio[]).find(campo => this.erros[campo]);
      if (primeiroErro) setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#evento-${primeiroErro === 'visibilidade' ? 'privacidade' : primeiroErro}`)?.focus());
      return;
    }
    this.salvando = this.estado.salvando = true;
    this.eventos.criar({ titulo: this.form.titulo.trim(), data: this.form.data,
      horario: this.form.horario || null, local: this.form.local.trim(), descricao: this.form.descricao.trim(),
      visibilidade: this.podePublicar && this.form.privacidade === 'Público' ? 'PUBLICO' : 'PRIVADO',
      requisicaoId: this.requisicaoId
    }).subscribe({
      next: evento => {
        this.salvando = this.estado.salvando = false;
        this.estado.alterado = false;
        this.modalController.dismiss(evento, 'saved');
      },
      error: erro => {
        this.salvando = this.estado.salvando = false;
        this.errosServidor = erro.error?.campos ?? {};
        this.erroSalvar = erro.status === 409
          ? 'Este envio já foi gravado com outros dados. Consulte a agenda antes de criar outro evento.'
          : mensagemErro(erro);
      }
    });
  }

  cancelar() {
    if (!this.salvando) this.modalController.dismiss(undefined, 'cancel');
  }
}

/** Abre o modal de evento; fechar (botão, Cancelar, Escape, fundo) com alterações pede confirmação. */
export async function abrirModalEvento(
  modalController: ModalController,
  alertController: AlertController,
  podePublicar: boolean
): Promise<HTMLIonModalElement> {
  const estado: EstadoModalEvento = { alterado: false };
  const modal = await modalController.create({
    component: EventFormModalComponent,
    componentProps: { podePublicar, estado },
    cssClass: 'hipatec-modal',
    canDismiss: async () => !estado.salvando && (!estado.alterado || await confirmarAcao(alertController, 'Descartar alterações?', 'Os dados preenchidos neste evento serão perdidos.', 'Descartar'))
  });
  await modal.present();
  return modal;
}
