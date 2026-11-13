import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

const confirmacoes = new WeakSet<AlertController>();
/** Confirma uma ação existente; não executa nem autoriza a operação no servidor. */
export async function confirmarAcao(controller: AlertController, titulo: string, consequencia: string, acao: string): Promise<boolean> {
  if (confirmacoes.has(controller)) return false;
  confirmacoes.add(controller);
  const origem = document.activeElement as HTMLElement | null;
  try {
    const alerta = await controller.create({
      header: titulo, message: consequencia, cssClass: 'hipatec-confirmacao', backdropDismiss: false,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: acao, role: 'destructive' }]
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    return role === 'destructive';
  } finally {
    confirmacoes.delete(controller);
    if (origem?.isConnected) origem.focus({ preventScroll: true });
  }
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private toast?: HTMLIonToastElement;
  private versao = 0;
  constructor(private toasts: ToastController) {}
  /** Chamar somente depois da resposta de gravação; última confirmação substitui a anterior. */
  async sucesso(mensagem: string) {
    const versao = ++this.versao;
    await this.toast?.dismiss();
    const navbar = document.querySelector<HTMLElement>('app-navbar ion-header');
    const toast = await this.toasts.create({ message: mensagem, duration: Math.max(5000, mensagem.length * 65),
      position: 'top', positionAnchor: navbar?.offsetParent ? navbar : undefined,
      keyboardClose: false, cssClass: 'hipatec-toast', htmlAttributes: { 'aria-live': 'polite', 'aria-atomic': 'true' }
    });
    if (versao !== this.versao) { toast.remove(); return; }
    this.toast = toast;
    await toast.present();
  }
}
