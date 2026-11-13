import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({ selector: 'app-admin-perfis', templateUrl: './admin-perfis.page.html', styleUrls: ['./admin-perfis.page.scss'], standalone: true, imports: [FeedbackNoticeComponent, IonicModule, CommonModule] })
export class AdminPerfisPage {
  aviso = '';
  solicitacoes: Array<{ nome: string; email: string; area: string; data: string }> = [];
  autorizar(pessoa: any) { this.aviso = 'A aprovação e recusa pela aplicação ainda não estão disponíveis. Nenhum acesso foi alterado.'; }
  recusar(pessoa: any) { this.aviso = 'A aprovação e recusa pela aplicação ainda não estão disponíveis. Nenhum acesso foi alterado.'; }
}
