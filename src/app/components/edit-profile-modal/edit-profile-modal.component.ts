import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
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

  saving = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['perfil']) {
      this.editModel = { ...(this.perfil || {}) };
      this.previewPfp = this.perfil?.pfp || null;
      this.previewBackground = this.perfil?.background || null;
      this.selectedPfpFile = null;
      this.selectedBackgroundFile = null;
    }
  }

  closeModal() {
    this.closed.emit();
  }

  onPfpSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) {
      this.selectedPfpFile = file;
      const reader = new FileReader();
      reader.onload = e => this.previewPfp = (e.target as any).result;
      reader.readAsDataURL(file);
    }
  }

  onBackgroundSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) {
      this.selectedBackgroundFile = file;
      const reader = new FileReader();
      reader.onload = e => this.previewBackground = (e.target as any).result;
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.saving) return;
    this.saving = true;

    // Emit save request to parent with both files
    this.requestSave.emit({ 
      perfil: this.editModel, 
      pfpFile: this.selectedPfpFile, 
      backgroundFile: this.selectedBackgroundFile 
    });
    
    // Reset saving state after emission
    this.saving = false;
  }
}