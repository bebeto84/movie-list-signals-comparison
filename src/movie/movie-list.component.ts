import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  Signal,
} from '@angular/core';
import { Movie } from '../movie.model';
import { MovieElementComponent } from './movie-element.component';
import { CommonModule, NgFor } from '@angular/common';
import { MovieService } from '../movie.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-movie-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MovieElementComponent],
  template: `
  <div class="movie-grid">
    <app-movie-element
      *ngFor="let movie of moviesS()"
      [movie]="movie"
      (addToBasket)="onAddToBasket(movie)"
      (removeFromBasket)="onRemoveFromBasket(movie)"
    ></app-movie-element>
  </div>
  `,
  styles: `.movie-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }`,
})
export class MovieListComponent {
  moviesS: Signal<Movie[]>;
  @Output() addToBasket = new EventEmitter<Movie>();
  @Output() removeFromBasket = new EventEmitter<Movie>();
  page = 1;

  constructor(private movieService: MovieService) {
    this.moviesS = this.movieService.moviesSignal; // Stream of movies from the service
  }

  ngOnInit(): void {
    this.loadMovies(); // Load the first page of movies
  }

  loadMovies(): void {
    this.movieService.loadMovies(); // Call service method to load movies
  }
  onAddToBasket(movie: Movie): void {
    this.addToBasket.emit(movie); // Pass the correct movie object
  }

  onRemoveFromBasket(movie: Movie): void {
    this.removeFromBasket.emit(movie); // Pass the correct movie object
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      this.page++;
      this.loadMovies();
    }
  }
}
