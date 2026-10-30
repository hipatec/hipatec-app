import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonTextarea, IonButton } from '@ionic/angular/standalone';
import { MentoriasService } from '../../../services/mentorias.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonTextarea, IonButton, CommonModule, FormsModule]
})
export class CadastroPage {
  titulo = '';
  descricao = '';
  progresso = 0;

  constructor(private mentoriasService: MentoriasService) { }


  submit() {
    const payload = {
      titulo: this.titulo,
      descricao: this.descricao,
      progresso: 0
    };

    this.mentoriasService.create(payload).subscribe({
      next: res => {
        console.log('Mentoria criada', res);
        this.titulo = '';
        this.descricao = '';
        this.progresso = 0;
      },
      error: err => console.error('Erro ao criar mentoria', err)
    });
  }

}
