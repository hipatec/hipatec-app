import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({ selector: 'app-admin-perfis', templateUrl: './admin-perfis.page.html', styleUrls: ['./admin-perfis.page.scss'], standalone: true, imports: [IonicModule, CommonModule] })
export class AdminPerfisPage {
  solicitacoes = [
    { nome: 'Ana Clara Souza', email: 'ana@example.test', area: 'Desenvolvimento Web', data: '12/11/2026' },
    { nome: 'Marina Alves', email: 'marina@example.test', area: 'Dados e IA', data: '11/11/2026' }
  ];
  autorizar(pessoa: any) { this.solicitacoes = this.solicitacoes.filter(item => item !== pessoa); alert(`${pessoa.nome} foi autorizada.`); }
  recusar(pessoa: any) { this.solicitacoes = this.solicitacoes.filter(item => item !== pessoa); alert(`${pessoa.nome} foi recusada.`); }
}
