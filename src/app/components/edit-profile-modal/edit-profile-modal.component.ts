import { IonicModule, IonModal, AlertController } from '@ionic/angular';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ContentModalFocusDirective } from '../content-form-modal/content-modal-focus.directive';
import { confirmarAcao } from '../../services/feedback.service';
import { FeedbackNoticeComponent } from '../feedback-notice/feedback-notice.component';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackNoticeComponent, IonicModule, ModalShellComponent, ContentModalFocusDirective]
})
export class EditProfileModalComponent implements OnChanges {
  @Input() show = false;
  @Input() perfil: any;
  @Output() closed = new EventEmitter<void>();
  // Emit a request for the parent page to perform the actual save (payload: { perfil, pfpFile, backgroundFile })
  @Output() requestSave = new EventEmitter<{ 
    perfil: any; 
    pfpFile?: File | null; 
    backgroundFile?: File | null 
  }>();

  editModel: any = {};
  selectedPfpFile: File | null = null;
  selectedBackgroundFile: File | null = null;
  previewPfp: string | null = null;
  previewBackground: string | null = null;

  @Input() saving = false;
  @Input() erro = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['perfil'] || changes['show']?.currentValue === true) this.restaurarPerfil();
  }

  private restaurarPerfil() {
    this.editModel = { ...(this.perfil || {}) };
    this.previewPfp = this.perfil?.pfp || null;
    this.previewBackground = this.perfil?.background || null;
    this.selectedPfpFile = null;
    this.selectedBackgroundFile = null;
    this.erro = '';
  }

  descartado() { this.restaurarPerfil(); this.closed.emit(); }

  @ViewChild(IonModal) modal?: IonModal;
  constructor(private alertas: AlertController) {}
  readonly canDismiss = async () => {
    if (this.saving) return false;
    const alterado = ['nome', 'usuario', 'biografia'].some(key => (this.editModel[key] || '') !== (this.perfil?.[key] || ''))
      || !!this.selectedPfpFile || !!this.selectedBackgroundFile;
    return !this.show || !alterado || confirmarAcao(this.alertas, 'Descartar alterações?', 'As alterações do perfil serão perdidas.', 'Descartar');
  };
  closeModal() { if (!this.saving) void this.modal?.dismiss(undefined, 'cancel'); }

  onPfpSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) {
      this.selectedPfpFile = file;
      const reader = new FileReader();
      reader.onload = e => { if (this.selectedPfpFile === file) this.previewPfp = (e.target as any).result; };
      reader.readAsDataURL(file);
    }
  }

  onBackgroundSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) {
      this.selectedBackgroundFile = file;
      const reader = new FileReader();
      reader.onload = e => { if (this.selectedBackgroundFile === file) this.previewBackground = (e.target as any).result; };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.saving) return;


    // Emit save request to parent with both files
    this.requestSave.emit({ 
      perfil: this.editModel, 
      pfpFile: this.selectedPfpFile, 
      backgroundFile: this.selectedBackgroundFile 
    });
    
    // Reset saving state after emission

  }
}