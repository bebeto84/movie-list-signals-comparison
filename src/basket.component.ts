// basket.component.ts
import { ChangeDetectionStrategy, Component, OnInit, Signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MovieService } from './movie.service';
import { Movie } from './movie.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BasketComponent {
  basketS: Signal<Movie[]>; // Observable stream of movies in the basket
  totalPriceS: Signal<number>; // Observable for the total price
  totalDiscountS: Signal<number>; // Observable for the total discount

  constructor(private movieService: MovieService) {
    this.basketS = this.movieService.basketSignal; // Subscribe to the basket
    this.totalPriceS = this.movieService.totalPriceSignal // Subscribe to the total price
    this.totalDiscountS = this.movieService.totalDiscountSignal; // Subscribe to the total discount
  }

  // Remove a movie from the basket
  removeFromBasket(movie: Movie): void {
    this.movieService.removeFromBasket(movie);
  }
}
