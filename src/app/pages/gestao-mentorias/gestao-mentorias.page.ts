import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({ selector: 'app-gestao-mentorias', templateUrl: './gestao-mentorias.page.html', styleUrls: ['./gestao-mentorias.page.scss'], standalone: true, imports: [IonicModule, CommonModule] })
export class GestaoMentoriasPage {
  conteudos: Array<{ titulo: string; descricao: string; matriculas: number; conclusao: number }> = [];
}
