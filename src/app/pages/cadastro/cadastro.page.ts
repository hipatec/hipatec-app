import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonSegment, IonSegmentButton, IonList, IonDatetime } from '@ionic/angular/standalone';
import { EstudanteService } from '../../services/estudante.service';
import { MentoraService } from '../../services/mentora.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonSegment, IonSegmentButton, IonList, IonDatetime, CommonModule, FormsModule, RouterLink]
})
export class CadastroPage implements OnInit {

  role: 'estudantes' | 'mentoras' = 'estudantes';
  nome = '';
  email = '';
  senha = '';
  dataNascimento = '';
  usuario = '';
  constructor(
    private estudanteService: EstudanteService,
    private mentoraService: MentoraService,
    private auth: AuthService, private router: Router,
  ) { }

  ngOnInit() {}

  switchRole(ev: any) {
    this.role = ev.detail?.value || 'estudantes';
    this.nome = '';
    this.email = '';
    this.senha = '';
    this.dataNascimento = '';
    this.usuario = '';
  }

  cadastrar() {
    if (!this.nome || !this.email || !this.senha || !this.dataNascimento || !this.usuario) {
      alert('Preencha todos os campos para continuar.');
      return;
    }

    const payload = {
      nome: this.nome,
      email: this.email,
      senha: this.senha,
      dataNascimento: this.dataNascimento,
      usuario: this.usuario,
    };

    const request = this.role === 'estudantes'
      ? this.estudanteService.create(payload)
      : this.mentoraService.create(payload);

    request.subscribe({
      next: response => {
        alert(this.role === 'mentoras' ? 'Cadastro recebido. Aguarde a aprovação da equipe para entrar.' : 'Cadastro realizado. Você já pode entrar.');
        this.senha = '';
        this.router.navigate(['/login']);
      },
      error: err => {
        console.error('Cadastro error:', err);
        alert('Falha ao enviar cadastro. Verifique os dados e tente novamente.');
      }
    });
  }

}
