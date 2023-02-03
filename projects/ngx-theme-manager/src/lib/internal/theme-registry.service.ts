import { Injectable } from '@angular/core';
import { share, Subject } from 'rxjs';
import { Theme } from '../theme';

/**
 * RbThemeRegistryService is an injectable service that allows for
 * registering and unregistering themes, as well as providing access
 * to the currently registered themes.
 * It also provides an observable of themes that can be used
 * to notify subscribers of changes to the registered themes.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class ThemeRegistryService {
  /**
   * The internal dictionary that holds the registered themes.
   *
   * @private
   */
  readonly #dictionary = new Map<string, Theme>();

  /**
   * The subject that emits an updated array of registered themes whenever a change occurs.
   *
   * @private
   */
  readonly #themes$ = new Subject<Theme[]>();

  /**
   * The observable that emits the collection of registered themes when it changes.
   */
  readonly themes$ = this.#themes$.pipe(share());

  /**
   * Registers a new theme and emits the changed collection of themes.
   *
   * If a theme with the same ID is already registered,
   * the registered theme will be merged with the new one.
   *
   * Themes without ID will be ignored.
   *
   * @param {Theme | undefined | null} theme - The new theme to register
   */
  register(theme: Theme | undefined | null): void {
    if (!theme?.id) {
      return;
    }
    const oldValue = this.#dictionary.get(theme.id) || {};
    this.#dictionary.set(theme.id, { ...oldValue, ...theme });
    this.#themes$.next([...this.#dictionary.values()]);
  }

  /**
   * Removes the provided theme from the registry and emits the changed collection of themes.
   *
   * @param {Theme} theme - The theme to remove.
   */
  unregister(theme: Theme): void {
    if (this.#dictionary.delete(theme?.id)) {
      this.#themes$.next([...this.#dictionary.values()]);
    }
  }

  /**
   * Returns the collection of registered themes.
   *
   * @returns {Theme[]} A new array with all currently registered themes
   * @remarks A new array is created every time this getter is called.
   */
  get themes(): Theme[] {
    return [...this.#dictionary.values()];
  }

  /**
   * Returns the theme with the given ID, or null if no such theme is registered.
   *
   * @param {string | null} id - The ID of the theme to retrieve
   */
  get(id: string | null): Theme | null {
    return this.#dictionary.get(id!) || null;
  }

  /**
   * Returns whether a theme with the given ID is currently registered.
   *
   * @param {string | null} id - The ID of the theme to check.
   */
  has(id: string | null): boolean {
    return this.#dictionary.has(id!);
  }
}
