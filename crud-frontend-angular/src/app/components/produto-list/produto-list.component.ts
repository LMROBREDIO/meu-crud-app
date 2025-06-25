// src/app/components/produto-list/produto-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-produto-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './produto-list.component.html',
  // styleUrl: './produto-list.component.scss' // <-- Se seu arquivo SCSS não existe, use styleUrl no singular e remova a referência. Se existe, mantenha styleUrls.
  styleUrls: ['./produto-list.component.scss'] // Use styleUrls se o arquivo SCSS existe e você o mantém
})
export class ProdutoListComponent implements OnInit { // <-- CLASSE CORRETA: ProdutoListComponent
  produtos: Produto[] = [];
  produtoSelecionado: Produto = { id: undefined, nome: '', preco: 0, descricao: '' };
  isEditing: boolean = false;
  feedbackMessage: string = '';
  isError: boolean = false;

  constructor(private produtoService: ProdutoService) {
    console.log('ProdutoListComponent CONSTRUTOR inicializado!');
  }

  ngOnInit(): void {
    console.log('ProdutoListComponent ngOnInit!');
    this.loadProdutos();
  }

  loadProdutos(): void {
    this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.produtos = data;
        this.setFeedbackMessage('Produtos carregados com sucesso!', false);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.setFeedbackMessage(`Erro ao carregar produtos: ${err.message}`, true);
      }
    });
  }

  newProduto(): void {
    this.produtoSelecionado = { id: undefined, nome: '', preco: 0, descricao: '' };
    this.isEditing = false;
    this.clearFeedbackMessage();
  }

  editProduto(produto: Produto): void {
    this.produtoSelecionado = { ...produto };
    this.isEditing = true;
    this.clearFeedbackMessage();
  }

  saveProduto(): void {
    if (this.isEditing) {
      this.produtoService.updateProduto(this.produtoSelecionado).subscribe({
        next: () => {
          this.loadProdutos();
          this.newProduto();
          this.setFeedbackMessage('Produto atualizado com sucesso!', false);
        },
        error: (err) => {
          console.error('Erro ao atualizar produto:', err);
          this.setFeedbackMessage(`Erro ao atualizar produto: ${err.message}`, true);
        }
      });
    } else {
      this.produtoService.createProduto(this.produtoSelecionado).subscribe({
        next: () => {
          this.loadProdutos();
          this.newProduto();
          this.setFeedbackMessage('Produto criado com sucesso!', false);
        },
        error: (err) => {
          console.error('Erro ao criar produto:', err);
          this.setFeedbackMessage(`Erro ao criar produto: ${err.message}`, true);
        }
      });
    }
  }

  deleteProduto(id: number | undefined): void {
    if (id === undefined) {
      this.setFeedbackMessage('ID do produto inválido para exclusão.', true);
      return;
    }

    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.produtoService.deleteProduto(id).subscribe({
        next: () => {
          this.loadProdutos();
          this.setFeedbackMessage('Produto excluído com sucesso!', false);
        },
        error: (err) => {
          console.error('Erro ao excluir produto:', err);
          this.setFeedbackMessage(`Erro ao excluir produto: ${err.message}`, true);
        }
      });
    }
  }

  setFeedbackMessage(message: string, isError: boolean): void {
    this.feedbackMessage = message;
    this.isError = isError;
    setTimeout(() => this.clearFeedbackMessage(), 5000);
  }

  clearFeedbackMessage(): void {
    this.feedbackMessage = '';
    this.isError = false;
  }
}