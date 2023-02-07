import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ContentObserver } from '@angular/cdk/observers';
import { filter, map, timer } from 'rxjs';
import { Theme } from '../theme';
import { ThemeRegistryService } from './theme-registry.service';

/**
 * A service that manages the activation and deactivation of themes.
 *
 * The service uses the `ContentObserver` service to observe changes in the `<head>` element
 * and updates the {@link ThemeRegistryService internal theme registry}
 * when new `<style>` elements are added to the DOM.
 *
 * Themes are identified by the `data-theme` attribute on the `<style>` element.
 *
 * The service provides a method `use` to activate a theme with a given ID
 * and deactivate all other themes.
 *
 * @internal
 * @group Services
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeStyleManagerService {
  /**
   * Creates a new instance.
   *
   * Subscribes to the `ContentObserver` to listen for new `<style>` elements
   * added to the document head. If a new `<style>` element is added, the
   * {@link #updateRegistry} method is called.
   *
   * @param {ContentObserver} observer - The Angular ContentObserver service
   * @param {ThemeRegistryService} themeRegistry - A service to register new themes
   * @param {Document} document - A reference to the current document
   */
  constructor(
    private readonly observer: ContentObserver,
    private readonly themeRegistry: ThemeRegistryService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    this.observer
      .observe(document.head)
      .pipe(
        map((mutations) =>
          mutations.some((mutation) =>
            Array.from(mutation.addedNodes).some(
              (node) => node.nodeName === 'STYLE',
            ),
          ),
        ),
        filter((newStyles) => !!newStyles),
      )
      .subscribe(() => this.#updateRegistry());
  }

  /**
   * Activates the theme with the given ID and deactivates all other themes.
   *
   * @param {string} theme - The theme to activate
   * @see turnOn
   * @see turnOff
   * @remarks A theme may consist of 1 or more `<style>` elements.
   */
  use(theme: string): void {
    // INFO: [author: NWD8FE, since: 2023/01/26]
    //  running asynchronously, to give #updateRegistries
    //  the chance to run first.
    timer(0).subscribe(() => {
      const styles = this.#getAllThemeStyles();
      styles.forEach((el) => {
        const id = el.getAttribute('data-theme');
        (theme === id ? turnOn : turnOff)(el);
      });
    });
  }

  /**
   * Get all theme `<style>` elements in the document head.
   *
   * @private
   */
  #getAllThemeStyles(): HTMLStyleElement[] {
    return Array.from(
      this.document.head.querySelectorAll('style[data-theme]'),
    );
  }

  /**
   * Updates the internal theme registry.
   *
   * Identifies all `<style>` elements without the `data-no-theme` and `data-theme` attributes.
   * Extracts the theme annotations from the elements' text content and applies the
   * `data-theme` or `data-no-theme` attribute depending on the discovered theme id.
   *
   * @private
   * @see extractThemeAnnotations
   * @see applyThemeIdentifier
   */
  #updateRegistry() {
    Array.from(
      this.document.head.querySelectorAll<HTMLStyleElement>(
        'style:not([data-no-theme]):not([data-theme])',
      ),
    )
      .map((el) => ({ el, meta: extractThemeAnnotations(el.textContent) }))
      .forEach(({ el, meta }) => {
        if (applyThemeIdentifier(el, meta?.id)) {
          turnOff(el);
          this.themeRegistry.register(meta);
        }
      });
  }
}

/**
 * Applies a theme identifier to a `<style>` element.
 *
 * If the provided `id` is truthy, the element receives the attribute
 * `data-theme` set to the given `id`. Otherwise, the element
 * will get the attribute `data-no-theme` without any value.
 *
 * @param {HTMLStyleElement} el - The `<style>` element to apply the identifier to
 * @param {string | undefined} id - The theme identifier
 * @returns {boolean} true, if the style element belongs to a theme
 * @group Functions
 * @internal
 */
export function applyThemeIdentifier(
  el: HTMLStyleElement,
  id?: string,
): boolean {
  if (!!id) {
    el.setAttribute('data-theme', id);
    return true;
  } else {
    el.toggleAttribute('data-no-theme', true);
    return false;
  }
}

/**
 * Turn off a style element by setting its `media` attribute to `none`.
 *
 * @param {HTMLStyleElement} el - The style element to turn off.
 * @group Functions
 * @internal
 */
export function turnOff(el: HTMLStyleElement): void {
  el.media = 'none';
}

/**
 * Turn on a style element by removing its `media` attribute.
 *
 * @param {HTMLStyleElement} el - The style element to turn on.
 * @group Functions
 * @internal
 */
export function turnOn(el: HTMLStyleElement): void {
  el.removeAttribute('media');
}

/**
 * Extracts theme annotations from a given string.
 *
 * **Format:** `@@<annotationName> value` (until end of line)
 *
 * Possible annotation names:
 * - `id`: a unique identifier for the theme
 * - `displayName`: a human-readable name for the theme
 * - `description`: a short description of the theme
 * - `defaultTheme`: a boolean flag indicating if this is the default theme
 *
 * @param {string} s The string to extract annotations from.
 * @returns {Theme | null} An object containing the extracted annotations, or null if no annotations were found.
 * @group Functions
 * @internal
 */
export function extractThemeAnnotations(
  s: undefined | null | string,
): Theme | null {
  if (!s) {
    return null;
  }
  const id = unwrap(/@@id\s+([^\r\n]+)$/m.exec(s));
  if (!id) {
    return null;
  }
  const displayName = unwrap(/@@displayName\s+([^\r\n]+)$/m.exec(s)) || id;
  const description = unwrap(/@@description\s+([^\r\n]+)$/m.exec(s));
  const defaultTheme = /@@default/m.test(s);
  return { id, displayName, description, defaultTheme };
}

/**
 * Unwrap a match from a regular expression, returning the first captured group as a string.
 *
 * @param {RegExpExecArray} match - The match to unwrap.
 * @group Functions
 * @internal
 */
export function unwrap(match: RegExpExecArray | null): string | undefined {
  return (match && match[1] && match[1].trim()) || undefined;
}
