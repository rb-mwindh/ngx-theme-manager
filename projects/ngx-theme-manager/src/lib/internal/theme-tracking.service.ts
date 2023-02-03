import { Injectable } from '@angular/core';
import { distinctUntilChanged, share, Subject, tap } from 'rxjs';

/**
 * A service to track the currently active theme.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class ThemeTrackingService {
  /**
   * The subject that emits the next value set through {@link currentTheme}.
   *
   * @private
   */
  readonly #currentTheme$ = new Subject<string | null>();

  /**
   * A private property to hold the current theme value.
   *
   * @private
   */
  #currentTheme: string | null = null;

  /**
   * The observable that emits the current theme, shared among subscribers.
   * This observable prevents emitting the same value twice in a row.
   * It also updates the private {@link #currentTheme} property.
   */
  readonly currentTheme$ = this.#currentTheme$.pipe(
    distinctUntilChanged(),
    tap((theme) => (this.#currentTheme = theme)),
    share(),
  );

  /**
   * Set the current theme.
   *
   * @param {string | null} arg
   */
  set currentTheme(arg: string | null) {
    this.#currentTheme$.next(arg);
  }

  /**
   * Get the current theme.
   *
   * @returns {string | null} The current theme
   */
  get currentTheme(): string | null {
    return this.#currentTheme;
  }
}
