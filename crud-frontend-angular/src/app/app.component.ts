// src/app/app.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProdutoListComponent } from './components/produto-list/produto-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProdutoListComponent
  ],
  templateUrl: './app.component.html', // <-- CORRIGIDO AQUI
  styleUrl: './app.component.scss'     // <-- E AQUI (se usar o SCSS do AppComponent)
})
export class AppComponent {
  protected title = 'crud-frontend-angular';
}