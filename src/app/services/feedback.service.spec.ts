import { TestBed } from '@angular/core/testing';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { FeedbackService, confirmarAcao } from './feedback.service';

describe('Feedback Ionic compartilhado', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [IonicModule.forRoot({ animated: false })] }));
  afterEach(async () => {
    for (const overlay of Array.from(document.querySelectorAll('ion-alert, ion-toast'))) {
      await (overlay as HTMLIonAlertElement).dismiss(); overlay.remove();
    }
  });
  it('cancelamento restaura foco e segunda confirmação não empilha decisões', async () => {
    const origem = document.createElement('button'); document.body.appendChild(origem); origem.focus();
    const alerts = TestBed.inject(AlertController);
    const primeira = confirmarAcao(alerts, 'Descartar?', 'O texto será perdido.', 'Descartar');
    expect(await confirmarAcao(alerts, 'Outra decisão', 'Não abrir', 'Excluir')).toBeFalse();
    let alerta: HTMLIonAlertElement | undefined;
    for (let i=0; i<100 && !alerta; i++) { alerta = await alerts.getTop(); await new Promise(r=>setTimeout(r,10)); }
    expect(alerta?.header).toBe('Descartar?');
    await alerta!.dismiss(undefined, 'cancel');
    expect(await primeira).toBeFalse(); expect(document.activeElement).toBe(origem); origem.remove();
  });
  it('ação específica confirma somente pelo papel destructive', async () => {
    const alerts = TestBed.inject(AlertController);
    spyOn(alerts, 'create').and.resolveTo({ present: async()=>undefined, onDidDismiss: async()=>({role:'destructive'}) } as any);
    expect(await confirmarAcao(alerts, 'Descartar?', 'Texto perdido.', 'Descartar')).toBeTrue();
    expect(alerts.create).toHaveBeenCalledWith(jasmine.objectContaining({ buttons: [
      {text:'Cancelar',role:'cancel'}, {text:'Descartar',role:'destructive'}
    ] }));
  });
  it('toast é único, legível e não altera o foco', async () => {
    const origem = document.createElement('button'); document.body.appendChild(origem); origem.focus();
    const service = TestBed.inject(FeedbackService);
    await service.sucesso('Perfil atualizado.'); await service.sucesso('Publicação criada.');
    const toast = await TestBed.inject(ToastController).getTop();
    expect(document.querySelectorAll('ion-toast').length).toBe(1);
    expect(toast!.message).toBe('Publicação criada.'); expect(toast!.duration).toBeGreaterThanOrEqual(5000);
    expect(toast!.keyboardClose).toBeFalse(); expect(document.activeElement).toBe(origem);
    expect(toast!.getAttribute('aria-live')).toBe('polite'); origem.remove();
  });
});
