import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ForgotPasswordPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private requisicao?: Subscription;
  private token = '';

  email = '';
  emailEnviado = false;
  enviando = false;
  erro = '';
  redefinir = false;
  linkValido = false;
  senha = '';
  confirmacao = '';

  constructor() {
    addIcons({ mailOutline });
  }

  ionViewWillEnter(): void {
    this.ionViewWillLeave();
    this.email = '';
    this.emailEnviado = false;
    this.erro = '';
    this.redefinir = this.route.snapshot.data['redefinir'] === true;
    this.linkValido = false;
    if (this.redefinir) {
      this.token = new URLSearchParams(this.location.path(true).split('#')[1] ?? '').get('token') ?? '';
      this.linkValido = /^[A-Za-z0-9_-]{43}$/.test(this.token);
      this.location.replaceState('/redefinir-senha');
    }
  }

  ionViewWillLeave(): void {
    this.requisicao?.unsubscribe();
    this.enviando = false;
    this.token = '';
    this.senha = '';
    this.confirmacao = '';
  }

  ngOnDestroy(): void {
    this.ionViewWillLeave();
  }

  enviarRecuperacao(form: NgForm): void {
    if (this.enviando || this.emailEnviado) return;
    this.erro = '';
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.erro = 'Confira os campos antes de continuar.';
      return;
    }
    if (this.redefinir) {
      if (!this.linkValido) {
        this.erro = 'Solicite um novo link de recuperação.';
        return;
      }
      if (this.senha !== this.confirmacao) {
        this.erro = 'As senhas precisam ser iguais.';
        return;
      }
      if (!this.senha.trim() || new TextEncoder().encode(this.senha).length > 72) {
        this.erro = 'Use uma senha com conteúdo e no máximo 72 bytes; acentos ocupam mais espaço.';
        return;
      }
    }
    this.email = this.email.trim();
    this.enviando = true;
    const pedido = this.redefinir
      ? this.auth.redefinirSenha(this.token, this.senha)
      : this.auth.solicitarRecuperacao(this.email);
    this.requisicao = pedido.pipe(finalize(() => this.enviando = false)).subscribe({
      next: () => {
        this.emailEnviado = true;
        this.token = '';
        this.senha = '';
        this.confirmacao = '';
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          this.erro = 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.';
        } else if (this.redefinir && error.status === 400) {
          this.linkValido = false;
          this.token = '';
          this.senha = '';
          this.confirmacao = '';
          this.erro = 'O link é inválido, expirou ou já foi utilizado. Solicite um novo link.';
        } else if (this.redefinir && error.status === 422) {
          this.erro = 'Use pelo menos 8 caracteres e no máximo 72 bytes na senha.';
        } else {
          this.erro = 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';
        }
      }
    });
  }
}
