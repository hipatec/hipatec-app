import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { AprendizadoPage } from '../aprendizado/aprendizado.page';
import { MentoriasPage } from '../mentorias/mentorias.page';
import { abrirModalConteudo, ContentKind } from '../../components/content-form-modal/open-content-modal';

/** Entrada direta: mantém uma página de origem real atrás do diálogo. */
@Component({
  selector: 'app-content-create',
  standalone: true,
  imports: [CommonModule, AprendizadoPage, MentoriasPage],
  template: `<app-aprendizado class="ion-page" *ngIf="kind === 'course'" />
    <app-mentorias class="ion-page" *ngIf="kind === 'mentoring'" />`
})
export class ContentCreatePage {
  readonly kind: ContentKind;
  private modal?: HTMLIonModalElement;
  private opening?: Promise<HTMLIonModalElement>;
  private leaving = false;

  constructor(private route: ActivatedRoute, private router: Router,
    private modals: ModalController, private alerts: AlertController) {
    this.kind = route.snapshot.data['mode'];
  }

  async ionViewDidEnter() {
    if (this.opening) return;
    this.leaving = false;
    this.opening = abrirModalConteudo(this.modals, this.alerts, this.kind);
    this.modal = await this.opening;
    await this.modal.onDidDismiss();
    this.modal = undefined;
    this.opening = undefined;
    if (!this.leaving) {
      await this.router.navigate([this.kind === 'course' ? '/aprendizado' : '/painel'], {
        queryParams: this.route.snapshot.queryParams, fragment: this.route.snapshot.fragment ?? undefined, replaceUrl: true
      });
    }
  }

  async canLeave(): Promise<boolean> {
    const modal = this.modal ?? await this.opening;
    if (!modal) return true;
    this.leaving = true;
    const dismissed = await modal.dismiss(undefined, 'navigation');
    if (!dismissed) this.leaving = false;
    return dismissed;
  }
}
