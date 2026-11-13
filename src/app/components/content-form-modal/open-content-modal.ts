import { AlertController, ModalController } from '@ionic/angular/standalone';
import { confirmarAcao } from '../../services/feedback.service';
import { CourseFormModalComponent } from './course-form-modal.component';
import { MentoringFormModalComponent } from './mentoring-form-modal.component';

export type ContentKind = 'course' | 'mentoring';

export async function abrirModalConteudo(modals: ModalController, alerts: AlertController, kind: ContentKind) {
  const estado = { alterado: false, enviando: false };
  const modal = await modals.create({
    component: kind === 'course' ? CourseFormModalComponent : MentoringFormModalComponent,
    componentProps: { estado },
    cssClass: 'hipatec-modal',
    canDismiss: async () => !estado.enviando && (!estado.alterado || confirmarAcao(alerts, 'Descartar alterações?',
      'Os dados preenchidos não foram salvos e serão perdidos.', 'Descartar'))
  });
  await modal.present();
  return modal;
}
