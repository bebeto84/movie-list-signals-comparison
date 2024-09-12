// movie.service.ts
import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Movie } from './movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private baseUrl =
    'https://api.themoviedb.org/3/movie/popular?api_key=9eecc30ae89f253bce3cec4140734493';

  private _moviesSignal = signal<Movie[]>([]); // Initial empty movie array

  // Basket signal
  private _basketSignal = signal<Movie[]>([]); // Initial empty basket

  // Page tracking signal (for pagination)
  private _pageSignal = signal<number>(1);

  private _moviesSubject = new BehaviorSubject<Movie[]>([]);
  movies$ = this._moviesSubject.asObservable(); // Observable stream for the movie list

  private _basketSubject = new BehaviorSubject<Movie[]>([]);
  basket$ = this._basketSubject.asObservable(); // Observable stream for the basket

  constructor(private http: HttpClient) {}

  // Expose movies signal to components
  get moviesSignal() {
    return this._moviesSignal;
  }

  // Expose basket signal to components
  get basketSignal() {
    return this._basketSignal;
  }

  // Computed signal for total price based on the basket
  get totalPriceSignal() {
    return computed(() =>
      this._basketSignal().reduce((sum, movie) => sum + movie.price, 0)
    );
  }

  // Computed signal for total discount in the basket
  get totalDiscountSignal() {
    return computed(() => {
      return this._basketSignal().reduce((totalDiscount, movie) => {
        const discount = movie.originalPrice - movie.price;
        return totalDiscount + discount;
      }, 0);
    });
  }

  /*   loadMovies(page: number): void {
    this.http
      .get<any>(`${this.baseUrl}&page=${page}`)
      .pipe(
        map((data) =>
          data.results.map((movie: any) => ({
            id: movie.id,
            title: movie.title,
            poster_path: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
            price: Math.floor(Math.random() * 20) + 5, // Random price for movies
            originalPrice: Math.floor(Math.random() * 20) + 5, // Store the original price
          }))
        )
      )
      .subscribe((movies: Movie[]) => {
        firstValueFrom(this.movies$).then((currentMovies) => {
          this._moviesSubject.next([...currentMovies, ...movies]); // Append new movies to the existing ones
        });
      });
  } */

  loadMovies(): void {
    const currentPage = this._pageSignal();

    this.http
      .get<any>(`${this.baseUrl}&page=${currentPage}`)
      .subscribe((data) => {
        const newMovies = data.results.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          poster_path: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
          price: Math.floor(Math.random() * 20) + 5, // Assign random price
          originalPrice: Math.floor(Math.random() * 20) + 5, // Store original price
        }));

        // Update the movie signal with new movies
        this._moviesSignal.set([...this._moviesSignal(), ...newMovies]);

        // Increment the page for pagination
        this._pageSignal.update((page) => page + 1);
      });
  }

  // Add a movie to the basket and DECREASE its price by 0.5%
  /*  addToBasket(newMovie: Movie): void {
    firstValueFrom(this.basket$).then((currentBasket) => {
      const isAlreadyInBasket = currentBasket.find(
        (movie) => movie.id === newMovie.id
      );

      if (!isAlreadyInBasket) {
        // Add the new movie to the basket
        const updatedBasket = [...currentBasket, newMovie];

        // Calculate discount (0.5% per movie in the basket)
        const discountFactor = 1 - updatedBasket.length * 0.005; // Discount = 0.5% * number of movies

        // Update the prices of all movies in the basket with the new discount
        const updatedMoviesInBasket = updatedBasket.map((movie) => ({
          ...movie,
          price: movie.originalPrice * discountFactor,
        }));

        // Update the basket with the updated prices
        this._basketSubject.next(updatedMoviesInBasket);

        // Update global movie list with the discounted prices for the movies in the basket
        this.updateMoviesInListWithDiscount(updatedMoviesInBasket);
      }
    });
  }
 */

  addToBasket(newMovie: Movie): void {
    const currentBasket = this._basketSignal();

    // Check if the movie is already in the basket
    const isAlreadyInBasket = currentBasket.find(
      (movie) => movie.id === newMovie.id
    );

    if (!isAlreadyInBasket) {
      const updatedBasket = [...currentBasket, newMovie];

      // Calculate discount (0.5% per movie in the basket)
      const discountFactor = 1 - updatedBasket.length * 0.005;

      // Update movie prices in the basket with the new discount
      const updatedMoviesInBasket = updatedBasket.map((movie) => ({
        ...movie,
        price: movie.originalPrice * discountFactor,
      }));

      // Set the basket signal with updated prices
      this._basketSignal.set(updatedMoviesInBasket);

      // Update the global movie list to reflect the discounts
      this.updateMoviesInListWithDiscount(updatedMoviesInBasket);
    }
  }

  removeFromBasket(movieToRemove: Movie): void {
    const currentBasket = this._basketSignal();

    // Filter out the movie being removed
    const updatedBasket = currentBasket.filter(
      (movie) => movie.id !== movieToRemove.id
    );

    // Recalculate the discount factor based on remaining movies
    const discountFactor = 1 - updatedBasket.length * 0.005;

    // Update movie prices in the basket with the new discount
    const updatedMoviesInBasket = updatedBasket.map((movie) => ({
      ...movie,
      price: movie.originalPrice * discountFactor,
    }));

    // Set the basket signal with updated prices
    this._basketSignal.set(updatedMoviesInBasket);

    // Update the global movie list to reflect the discounts
    this.updateMoviesInListWithDiscount(updatedMoviesInBasket);
  }

  // Private method to update global movie list with discounted prices
  private updateMoviesInListWithDiscount(updatedMoviesInBasket: Movie[]): void {
    const currentMovies = this._moviesSignal();
    const updatedMovies = currentMovies.map((movie) => {
      const basketMovie = updatedMoviesInBasket.find(
        (basketMovie) => basketMovie.id === movie.id
      );
      if (basketMovie) {
        return { ...movie, price: basketMovie.price }; // Apply the discounted price
      }
      return movie;
    });

    // Update the global movie list
    this._moviesSignal.set(updatedMovies);
  }

  // Check if a movie is in the basket
  isMovieInBasket(movieId: number): boolean {
    return !!this._basketSignal().find((movie) => movie.id === movieId);
  }

  /*   removeFromBasket(movieToRemove: Movie): void {
    firstValueFrom(this.basket$).then((currentBasket) => {
      const updatedBasket = currentBasket.filter(
        (movie) => movie.id !== movieToRemove.id
      );

      // Calculate discount (0.5% per movie in the basket)
      const discountFactor = 1 - updatedBasket.length * 0.005;

      // Update the prices of all remaining movies in the basket with the new discount
      const updatedMoviesInBasket = updatedBasket.map((movie) => ({
        ...movie,
        price: movie.originalPrice * discountFactor,
      }));

      // Update the basket with the updated prices
      this._basketSubject.next(updatedMoviesInBasket);

      // Update global movie list with the discounted prices for the movies in the basket
      this.updateMoviesInListWithDiscount(updatedMoviesInBasket);
    });
  } */
  /* private updateMoviesInListWithDiscount(updatedMoviesInBasket: Movie[]): void {
    firstValueFrom(this.movies$).then((currentMovies) => {
      const updatedMovies = currentMovies.map((movie) => {
        const basketMovie = updatedMoviesInBasket.find(
          (basketMovie) => basketMovie.id === movie.id
        );
        if (basketMovie) {
          return { ...movie, price: basketMovie.price }; // Apply the discounted price
        }
        return movie;
      });

      // Update the global movie list
      this._moviesSubject.next(updatedMovies);
    });
  }

  getTotalDiscount(): Observable<number> {
    return this.basket$.pipe(
      map((basket) => {
        return basket.reduce((totalDiscount, movie) => {
          const discount = movie.originalPrice - movie.price;
          return totalDiscount + discount;
        }, 0);
      })
    );
  }

  // Get the total price of the basket
  getTotalPrice(): Observable<number> {
    return this.basket$.pipe(
      map((basket) => basket.reduce((sum, movie) => sum + movie.price, 0)),
      startWith(0)
    );
  }

  // Check if a movie is in the basket
  isMovieInBasket(movieId: number): Observable<boolean> {
    return this.basket$.pipe(
      map((basket) => !!basket.find((movie) => movie.id === movieId))
    );
  } */
}
