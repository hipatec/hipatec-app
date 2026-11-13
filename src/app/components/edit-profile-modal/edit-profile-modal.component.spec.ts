import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { EditProfileModalComponent } from './edit-profile-modal.component';

describe('Descarte do perfil na mesma página', () => {
  it('reabre o mesmo perfil com baseline e sem arquivos, previews locais ou erros', async () => {
    TestBed.configureTestingModule({ imports: [EditProfileModalComponent, IonicModule.forRoot()] });
    const fixture = TestBed.createComponent(EditProfileModalComponent);
    const perfil = { nome: 'Perfil API fixture', usuario: 'fixture', biografia: 'Original' };
    fixture.componentRef.setInput('perfil', perfil); fixture.detectChanges();
    const c = fixture.componentInstance;
    c.editModel.nome = 'Descartado'; c.selectedPfpFile = new File(['a'], 'avatar.png');
    c.selectedBackgroundFile = new File(['b'], 'capa.png'); c.previewPfp = 'data:local'; c.previewBackground = 'data:local'; c.erro = 'Falha';
    c.descartado();
    fixture.componentRef.setInput('show', true); fixture.detectChanges();
    expect(c.editModel).toEqual(perfil); expect(c.editModel).not.toBe(perfil);
    expect(c.selectedPfpFile).toBeNull(); expect(c.selectedBackgroundFile).toBeNull();
    expect(c.previewPfp).toBeNull(); expect(c.previewBackground).toBeNull(); expect(c.erro).toBe('');
    expect(await c.canDismiss()).toBeTrue();
    fixture.componentRef.setInput('show', false); fixture.detectChanges();
  });
});
