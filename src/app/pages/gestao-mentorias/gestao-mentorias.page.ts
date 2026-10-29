import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({ selector: 'app-gestao-mentorias', templateUrl: './gestao-mentorias.page.html', styleUrls: ['./gestao-mentorias.page.scss'], standalone: true, imports: [IonicModule, CommonModule] })
export class GestaoMentoriasPage {
  conteudos = [
    { titulo: 'Lógica de programação', descricao: 'Fundamentos para iniciantes.', matriculas: 12, conclusao: 86 },
    { titulo: 'Mentoria de Carreira', descricao: 'Preparação para entrevistas.', matriculas: 8, conclusao: 74 },
    { titulo: 'Mentoria Tech', descricao: 'Arquitetura e desenvolvimento Angular.', matriculas: 4, conclusao: 92 }
  ];
}
