import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CHAVE_ARMAZENAMENTO = 'saudeacesso_consentimento_cookies';

@Component({
  selector: 'app-banner-cookies',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './banner-cookies.html',
  styleUrl: './banner-cookies.css',
})
export class BannerCookiesComponent {
  visivel = signal(false);

  constructor() {
    const jaRespondeu = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!jaRespondeu) this.visivel.set(true);
  }

  aceitar(): void {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ aceito: true, dataResposta: new Date().toISOString() }));
    this.visivel.set(false);
  }

  recusarOpcionais(): void {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ aceito: false, dataResposta: new Date().toISOString() }));
    this.visivel.set(false);
  }
}