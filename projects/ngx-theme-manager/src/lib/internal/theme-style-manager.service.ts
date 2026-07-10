import { ContentObserver } from "@angular/cdk/observers";
import { DOCUMENT } from "@angular/common";
import { inject, Injectable, OnDestroy } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { Theme } from "../theme";
import { ThemeRegistryService } from "./theme-registry.service";

/**
 * Manages the activation and deactivation of theme style elements.
 *
 * The service observes the document head and registers style elements
 * containing theme annotations.
 *
 * Themes are identified by a data-theme attribute on their style elements.
 *
 * @internal
 * @group Services
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeStyleManagerService implements OnDestroy {
  /**
   * Observes changes to the document head.
   *
   * @private
   */
  readonly #observer = inject(ContentObserver);

  /**
   * Registry receiving discovered theme metadata.
   *
   * @private
   */
  readonly #themeRegistry = inject(ThemeRegistryService);

  /**
   * Injected document.
   *
   * @private
   */
  readonly #document = inject(DOCUMENT);

  /**
   * Emits when the service is destroyed.
   *
   * @private
   */
  readonly #destroyed = new Subject<void>();

  /**
   * Creates the service, scans existing styles and observes subsequently
   * inserted styles.
   */
  constructor() {
    this.#updateRegistry();

    this.#observer
      .observe(this.#document.head)
      .pipe(takeUntil(this.#destroyed))
      .subscribe(() => {
        this.#updateRegistry();
      });
  }

  /**
   * Stops observing the document head.
   *
   * @internal
   */
  ngOnDestroy(): void {
    this.#destroyed.next();
    this.#destroyed.complete();
  }

  /**
   * Activates all style elements belonging to the provided theme and
   * deactivates all other theme style elements.
   *
   * @param theme The theme ID to activate.
   * @remarks A theme may consist of one or more style elements.
   */
  use(theme: string): void {
    /*
     * Process any previously undiscovered styles before selecting the theme.
     * This avoids relying on asynchronous timer scheduling.
     */
    this.#updateRegistry();

    this.#getAllThemeStyles().forEach((element) => {
      const id = element.getAttribute('data-theme');

      if (id === theme) {
        turnOn(element);
      } else {
        turnOff(element);
      }
    });
  }

  /**
   * Returns all registered theme style elements from the document head.
   *
   * @private
   */
  #getAllThemeStyles(): HTMLStyleElement[] {
    return Array.from(
      this.#document.head.querySelectorAll<HTMLStyleElement>(
        'style[data-theme]',
      ),
    );
  }

  /**
   * Detects and registers all unprocessed style elements.
   *
   * Style elements containing a valid theme ID receive a data-theme
   * attribute. All other processed style elements receive a data-no-theme
   * attribute so they are not parsed repeatedly.
   *
   * @private
   */
  #updateRegistry(): void {
    const discoveredThemes = Array.from(
      this.#document.head.querySelectorAll<HTMLStyleElement>(
        'style:not([data-no-theme]):not([data-theme])',
      ),
    )
      .map((element) => ({
        element,
        theme: extractThemeAnnotations(element.textContent),
      }))
      .flatMap(({ element, theme }) => {
        if (!applyThemeIdentifier(element, theme?.id)) {
          return [];
        }

        turnOff(element);

        return theme ? [theme] : [];
      });

    this.#themeRegistry.registerAll(discoveredThemes);
  }
}

/**
 * Applies a theme identifier to a style element.
 *
 * If the provided ID is present, the element receives a data-theme
 * attribute. Otherwise, it receives a data-no-theme attribute.
 *
 * @param element The style element to update.
 * @param id The discovered theme ID.
 * @returns Whether the style element belongs to a theme.
 * @group Functions
 * @internal
 */
export function applyThemeIdentifier(
  element: HTMLStyleElement,
  id?: string,
): boolean {
  if (id) {
    element.setAttribute('data-theme', id);
    return true;
  }

  element.toggleAttribute('data-no-theme', true);
  return false;
}

/**
 * Deactivates a style element.
 *
 * @param element The style element to deactivate.
 * @group Functions
 * @internal
 */
export function turnOff(element: HTMLStyleElement): void {
  element.media = 'none';
}

/**
 * Activates a style element.
 *
 * @param element The style element to activate.
 * @group Functions
 * @internal
 */
export function turnOn(element: HTMLStyleElement): void {
  element.removeAttribute('media');
}

/**
 * Extracts theme annotations from CSS content.
 *
 * Format: @@&lt;annotationName&gt; value
 *
 * Supported annotations:
 *
 * - id
 * - displayName
 * - description
 * - default / defaultTheme
 *
 * @param source CSS content containing the annotations.
 * @returns The extracted theme metadata or null.
 * @group Functions
 * @internal
 */
export function extractThemeAnnotations(
  source: string | undefined | null,
): Theme | null {
  if (!source) {
    return null;
  }

  const id = unwrap(/@@id\s+([^\r\n]+)$/m.exec(source));

  if (!id) {
    return null;
  }

  const displayName =
    unwrap(/@@displayName\s+([^\r\n]+)$/m.exec(source)) ??
    id;

  const description = unwrap(
    /@@description\s+([^\r\n]+)$/m.exec(source),
  );

  const defaultTheme = /@@default(?:Theme)?(?:\s|$)/m.test(source);

  return {
    id,
    displayName,
    description,
    defaultTheme,
  };
}

/**
 * Returns the first captured group of a regular expression match.
 *
 * @param match Regular expression result.
 * @returns The trimmed captured value or undefined.
 * @group Functions
 * @internal
 */
export function unwrap(
  match: RegExpExecArray | null,
): string | undefined {
  const value = match?.[1]?.trim();
  return value || undefined;
}
