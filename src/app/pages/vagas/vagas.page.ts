import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { briefcaseOutline, locationOutline, funnelOutline, timeOutline, openOutline } from 'ionicons/icons';

interface Vaga {
  empresa: string;
  titulo: string;
  descricao: string;
  modalidade: string;
  local: string;
  pais: string;
  estado: string;
  cidade: string;
  area: string;
  formacao: string;
  senioridade: string;
  idiomas: string;
  contrato: string;
  publicada: string;
  tags: string[];
}

@Component({
  selector: 'app-vagas',
  templateUrl: './vagas.page.html',
  styleUrls: ['./vagas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class VagasPage {
  busca = '';
  cargo = 'Todos';
  area = 'Todas';
  pais = 'Todos';
  estado = 'Todos';
  cidade = 'Todas';
  formacao = 'Todas';
  senioridade = 'Todas';
  idioma = 'Todos';
  modalidade = 'Todas';
  contrato = 'Todos';

  vagas: Vaga[] = [
    {
      empresa: 'Empresa 1',
      titulo: 'Desenvolvedora Front-end Júnior',
      descricao: 'Buscamos uma pessoa para atuar no desenvolvimento de interfaces acessíveis e colaborar com um time diverso.',
      modalidade: 'Híbrido',
      local: 'São Paulo, SP',
      pais: 'Brasil', estado: 'São Paulo', cidade: 'São Paulo', area: 'Tecnologia', formacao: 'Ensino Superior', senioridade: 'Júnior', idiomas: 'Inglês Intermediário', contrato: 'CLT',
      publicada: '12h',
      tags: ['Angular', 'Júnior']
    },
    {
      empresa: 'Empresa 1',
      titulo: 'Analista de Dados',
      descricao: 'Oportunidade para trabalhar com organização de dados, indicadores e melhoria contínua de produtos digitais.',
      modalidade: 'Remoto',
      local: 'Brasil',
      pais: 'Brasil', estado: 'Todos', cidade: 'Todas', area: 'Tecnologia', formacao: 'Ensino Superior', senioridade: 'Pleno', idiomas: 'Inglês Fluente', contrato: 'PJ',
      publicada: '1d',
      tags: ['Dados', 'SQL']
    },
    {
      empresa: 'Empresa 2',
      titulo: 'Pessoa Engenheira de Software',
      descricao: 'Faça parte de uma equipe que cria soluções digitais com impacto e troca constante de conhecimento.',
      modalidade: 'Remoto',
      local: 'Brasil',
      pais: 'Brasil', estado: 'Todos', cidade: 'Todas', area: 'Tecnologia', formacao: 'Ensino Superior', senioridade: 'Pleno', idiomas: 'Inglês Fluente', contrato: 'CLT',
      publicada: '2d',
      tags: ['Java', 'Pleno']
    },
    {
      empresa: 'Empresa 3',
      titulo: 'Product Designer',
      descricao: 'Atue na descoberta e no desenho de experiências simples, inclusivas e centradas nas pessoas.',
      modalidade: 'Híbrido',
      local: 'Rio de Janeiro, RJ',
      pais: 'Brasil', estado: 'Rio de Janeiro', cidade: 'Rio de Janeiro', area: 'Design', formacao: 'Ensino Superior', senioridade: 'Sênior', idiomas: 'Inglês Intermediário', contrato: 'CLT',
      publicada: '3d',
      tags: ['UX', 'Design']
    }
  ];

  constructor() {
    addIcons({ briefcaseOutline, locationOutline, funnelOutline, timeOutline, openOutline });
  }

  get vagasFiltradas(): Vaga[] {
    const termo = this.busca.trim().toLowerCase();
    return this.vagas.filter(vaga => {
      const correspondeBusca = !termo || [vaga.empresa, vaga.titulo, vaga.descricao, vaga.area, vaga.cidade, ...vaga.tags]
        .join(' ').toLowerCase().includes(termo);
      const correspondeCargo = this.cargo === 'Todos' || vaga.titulo === this.cargo;
      const correspondeArea = this.area === 'Todas' || vaga.area === this.area;
      const correspondePais = this.pais === 'Todos' || vaga.pais === this.pais;
      const correspondeEstado = this.estado === 'Todos' || vaga.estado === this.estado;
      const correspondeCidade = this.cidade === 'Todas' || vaga.cidade === this.cidade;
      const correspondeFormacao = this.formacao === 'Todas' || vaga.formacao === this.formacao;
      const correspondeSenioridade = this.senioridade === 'Todas' || vaga.senioridade === this.senioridade;
      const correspondeIdioma = this.idioma === 'Todos' || vaga.idiomas === this.idioma;
      const correspondeModalidade = this.modalidade === 'Todas' || vaga.modalidade === this.modalidade;
      const correspondeContrato = this.contrato === 'Todos' || vaga.contrato === this.contrato;
      return correspondeBusca && correspondeCargo && correspondeArea && correspondePais && correspondeEstado && correspondeCidade
        && correspondeFormacao && correspondeSenioridade && correspondeIdioma && correspondeModalidade && correspondeContrato;
    }).sort((a, b) => this.idadeEmHoras(a.publicada) - this.idadeEmHoras(b.publicada));
  }

  private idadeEmHoras(publicada: string): number {
    const quantidade = Number.parseInt(publicada, 10);
    return publicada.includes('h') ? quantidade : quantidade * 24;
  }

  limparFiltros() {
    this.busca = '';
    this.cargo = 'Todos';
    this.area = 'Todas';
    this.pais = 'Todos';
    this.estado = 'Todos';
    this.cidade = 'Todas';
    this.formacao = 'Todas';
    this.senioridade = 'Todas';
    this.idioma = 'Todos';
    this.modalidade = 'Todas';
    this.contrato = 'Todos';
  }

  abrirVaga(vaga: Vaga) {
    alert(`Detalhes da vaga: ${vaga.titulo}`);
  }

  inscrever(vaga: Vaga) {
    alert(`A inscrição em “${vaga.titulo}” abrirá o site da oportunidade em uma nova aba quando o link externo estiver configurado.`);
  }

}
