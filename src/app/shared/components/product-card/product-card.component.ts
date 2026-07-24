import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../data/models/product.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  @Input() canAdd = true;
  @Output() add = new EventEmitter<{ product: ProductListItem; quantity: number }>();

  quantity = 1;

  increment(): void {
    if (this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  handleAddToCart(): void {
    this.add.emit({ product: this.product, quantity: this.quantity });
    this.quantity = 1;
  }
}
