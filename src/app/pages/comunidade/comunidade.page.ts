import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-comunidade',
  templateUrl: './comunidade.page.html',
  styleUrls: ['./comunidade.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButtons, IonMenuButton, IonSpinner
  ]
})
export class ComunidadePage implements OnInit {
  public safeCommunityUrl!: SafeResourceUrl;
  public isLoading: boolean = true;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // 1. Pega o email que salvamos no login
    const userEmail = localStorage.getItem('userEmail') || '';
    
    // 2. Chave de segurança (precisa ser idêntica no WordPress)
    const secretKey = 'HIPATEC_DEMO_2026';
    
    // 3. Monta a URL passando os dados
    const wpBaseUrl = 'https://hipatec-comunidade-cchrgwduc2cng0hd.southafricanorth-01.azurewebsites.net/portal/';
    const ssoUrl = `${wpBaseUrl}?sso_email=${userEmail}&secret=${secretKey}`;

    // 4. Passa pro iframe
    this.safeCommunityUrl = this.sanitizer.bypassSecurityTrustResourceUrl(ssoUrl);
  }

  onIframeLoad() {
    this.isLoading = false;
  }
}