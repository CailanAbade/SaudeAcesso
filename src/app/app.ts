import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BannerCookiesComponent } from './compartilhado/componentes/banner-cookies/banner-cookies';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BannerCookiesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}