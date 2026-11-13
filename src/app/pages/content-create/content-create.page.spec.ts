import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { ContentCreatePage } from './content-create.page';

describe('Entrada direta dos modais', () => {
  for (const [mode, fallback] of [['course', '/aprendizado'], ['mentoring', '/painel']]) {
    it(`fecha ${mode} na origem correta sem perder parâmetros`, async () => {
      let finish!: () => void;
      const modal = { present: async () => {}, onDidDismiss: () => new Promise<void>(resolve => finish = resolve) };
      const router = { navigate: jasmine.createSpy().and.resolveTo(true) };
      const route = { snapshot: { data: { mode }, queryParams: { filtro: ['a', 'b'] }, fragment: 'secao' } };
      const page = new ContentCreatePage(route as unknown as ActivatedRoute, router as unknown as Router,
        { create: async () => modal } as unknown as ModalController, {} as AlertController);
      const entered = page.ionViewDidEnter();
      for (let i = 0; i < 10 && !finish; i++) await Promise.resolve();
      finish(); await entered;
      expect(router.navigate).toHaveBeenCalledWith([fallback], {
        queryParams: { filtro: ['a', 'b'] }, fragment: 'secao', replaceUrl: true
      });
    });
  }

  it('nega navegação quando descarte é cancelado e não redireciona ao sair por navegação', async () => {
    let finish!: () => void;
    const modal = { present: async () => {}, onDidDismiss: () => new Promise<void>(resolve => finish = resolve), dismiss: jasmine.createSpy().and.resolveTo(false) };
    const router = { navigate: jasmine.createSpy().and.resolveTo(true) };
    const page = new ContentCreatePage({ snapshot: { data: { mode: 'course' } } } as unknown as ActivatedRoute,
      router as unknown as Router, { create: async () => modal } as unknown as ModalController, {} as AlertController);
    const entered = page.ionViewDidEnter();
    for (let i = 0; i < 10 && !finish; i++) await Promise.resolve();
    expect(await page.canLeave()).toBeFalse();
    modal.dismiss.and.resolveTo(true);
    expect(await page.canLeave()).toBeTrue();
    finish(); await entered;
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
