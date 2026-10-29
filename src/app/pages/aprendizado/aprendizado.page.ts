import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookOutline, checkmarkCircleOutline, timeOutline, calendarOutline } from 'ionicons/icons';

interface AprendizadoItem {
  titulo: string;
  descricao: string;
  progresso: number;
  tipo: string;
  mentora: string;
  proximaAtividade: string;
}

@Component({
  selector: 'app-aprendizado',
  templateUrl: './aprendizado.page.html',
  styleUrls: ['./aprendizado.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AprendizadoPage {
  itens: AprendizadoItem[] = [
    {
      titulo: 'Lógica de programação',
      descricao: 'Lógica de programação do zero para iniciantes.',
      progresso: 0.6,
      tipo: 'Curso',
      mentora: 'Ana Silva',
      proximaAtividade: 'Aula 7 · Estruturas de repetição'
    },
    {
      titulo: 'Fundamentos do UX Design',
      descricao: 'Fundamentos de experiência e interface.',
      progresso: 1,
      tipo: 'Curso concluído',
      mentora: 'Bia Costa',
      proximaAtividade: 'Revisar certificado'
    },
    {
      titulo: 'Banco de Dados SQL',
      descricao: 'Banco de dados SQL e lógica de BD.',
      progresso: 0.2,
      tipo: 'Curso',
      mentora: 'Carla Souza',
      proximaAtividade: 'Aula 2 · Consultas básicas'
    }
  ];

  sugestoes = [
    { titulo: 'Mentoria de Carreira', tipo: 'Mentoria', descricao: 'Prepare-se para entrevistas e novos desafios.', mentora: 'Ana Silva' },
    { titulo: 'Mentoria Tech', tipo: 'Mentoria', descricao: 'Troque experiências sobre arquitetura Angular.', mentora: 'Bia Costa' },
    { titulo: 'Introdução à IA', tipo: 'Curso', descricao: 'Conheça os primeiros conceitos de inteligência artificial.', mentora: 'Carla Souza' }
  ];

  itensPorPagina = 12;
  filtroAtividade = 'Todas as atividades';
  filtroSugestao = 'Todos';
  paginaAtividades = 1;
  paginaSugestoes = 1;

  get itensFiltrados() {
    if (this.filtroAtividade === 'Em andamento') return this.itens.filter(item => item.progresso < 1);
    if (this.filtroAtividade === 'Concluídas') return this.itens.filter(item => item.progresso === 1);
    return this.itens;
  }

  get atividadesPaginadas() {
    const inicio = (this.paginaAtividades - 1) * this.itensPorPagina;
    return this.itensFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get sugestoesFiltradas() {
    return this.filtroSugestao === 'Todos'
      ? this.sugestoes
      : this.sugestoes.filter(sugestao => sugestao.tipo === this.filtroSugestao);
  }

  get sugestoesPaginadas() {
    const inicio = (this.paginaSugestoes - 1) * this.itensPorPagina;
    return this.sugestoesFiltradas.slice(inicio, inicio + this.itensPorPagina);
  }

  get totalPaginasAtividades() { return Math.max(1, Math.ceil(this.itensFiltrados.length / this.itensPorPagina)); }
  get totalPaginasSugestoes() { return Math.max(1, Math.ceil(this.sugestoesFiltradas.length / this.itensPorPagina)); }

  alterarFiltroAtividade(valor: string) {
    this.filtroAtividade = valor;
    this.paginaAtividades = 1;
  }

  alterarFiltroSugestao(valor: string) {
    this.filtroSugestao = valor;
    this.paginaSugestoes = 1;
  }

  alterarItensPorPagina(valor: string) {
    this.itensPorPagina = Number(valor);
    this.paginaAtividades = 1;
    this.paginaSugestoes = 1;
  }

  mudarPagina(tipo: 'atividades' | 'sugestoes', direcao: number) {
    if (tipo === 'atividades') {
      this.paginaAtividades = Math.min(this.totalPaginasAtividades, Math.max(1, this.paginaAtividades + direcao));
    } else {
      this.paginaSugestoes = Math.min(this.totalPaginasSugestoes, Math.max(1, this.paginaSugestoes + direcao));
    }
  }
  constructor() {
    addIcons({ bookOutline, checkmarkCircleOutline, timeOutline, calendarOutline });
  }

  get percentualConcluido() {
    return Math.round(this.itens.reduce((total, item) => total + item.progresso, 0) / this.itens.length * 100);
  }

  continuar(item: AprendizadoItem) {
    alert(`Continuar: ${item.titulo}`);
  }

  inscrever(sugestao: { titulo: string }) {
    alert(`Inscrição: ${sugestao.titulo}`);
  }

}
