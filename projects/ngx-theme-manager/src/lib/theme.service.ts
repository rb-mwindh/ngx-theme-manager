import {
  Inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  Optional,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  debounceTime,
  filter,
  map,
  skipWhile,
  Subject,
  take,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs';
import {
  StorageService,
  ThemeRegistryService,
  ThemeStyleManagerService,
  ThemeTrackingService,
} from './internal';

const PREFIX = 'ngx-theme-manager';

/**
 * @group InjectionToken
 */
export const STORAGE_KEY = new InjectionToken<string>(
  `${PREFIX}/STORAGE_KEY`,
  {
    factory: () => `${PREFIX}/current-theme`,
  },
);

/**
 * @group InjectionToken
 */
export const QUERY_PARAM = new InjectionToken<string>(
  `${PREFIX}/QUERY_PARAM`,
  {
    factory: () => `theme`,
  },
);

/**
 * Service for managing and switching between different themes in an application.
 *
 * @group Services
 * @group Public API
 */
@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  /**
   * Subject for triggering cleanup on service destruction.
   *
   * @private
   */
  readonly #destroyed = new Subject<void>();

  /**
   * Observable stream that emits the currently active theme.
   */
  public readonly themes$ = this.registry.themes$;

  /**
   * Observable stream of all registered themes.
   */
  public readonly currentTheme$ = this.tracker.currentTheme$;

  /**
   * Creates a new instance
   *
   * @param {ThemeRegistryService} registry - Service for registering available themes
   * @param {ThemeTrackingService} tracker - Service for tracking the currently selected theme
   * @param {ThemeStyleManagerService} manager - Service for theme discovery, activation and deactivation
   * @param {StorageService} storage - Service for storing the currently selected theme in the browser storage
   * @param {ActivatedRoute} activatedRoute - Angular service for managing the current route
   * @param {Router} router - Angular service for navigating between routes
   * @param {string} storageKey - Key for storing the currently selected theme in browser storage
   * @param {string} queryParam - Query parameter name for specifying the theme in the route
   */
  constructor(
    private readonly registry: ThemeRegistryService,
    private readonly tracker: ThemeTrackingService,
    private readonly manager: ThemeStyleManagerService,
    private readonly storage: StorageService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    @Optional() @Inject(STORAGE_KEY) private readonly storageKey?: string,
    @Optional() @Inject(QUERY_PARAM) private readonly queryParam?: string,
  ) {
    // update the current route, the browser storage and the style elements' media attribute,
    // when the currently selected theme changes
    this.tracker.currentTheme$
      .pipe(
        filter(isNotNull),
        tap((theme) => this.#updateRouteParam(theme)),
        tap((theme) => this.#updateStoredTheme(theme)),
        tap((theme) => manager.use(theme)),
        takeUntil(this.#destroyed),
      )
      .subscribe();

    // calculate the initially selected theme
    this.registry.themes$
      .pipe(
        debounceTime(1),
        takeWhile(() => !this.tracker.currentTheme),
        map(
          (themes) =>
            themes.find((theme) => theme.defaultTheme) || themes[0],
        ),
        map((defaultTheme) => ({
          fromRoute: this.#themeFromRoute,
          fromStorage: this.#themeFromStorage,
          defaultTheme: defaultTheme?.id,
        })),
        map(
          ({ fromRoute, fromStorage, defaultTheme }) =>
            fromRoute || fromStorage || defaultTheme,
        ),
        tap((initialTheme) => {
          if (!this.tracker.currentTheme) {
            this.tracker.currentTheme = initialTheme;
          }
        }),
        take(1),
      )
      .subscribe();

    // if we got a storage key, update current theme on storage changes
    if (!!this.storageKey) {
      this.storage.changes$
        .pipe(
          skipWhile(() => !this.tracker.currentTheme),
          filter(({ key }) => key === this.storageKey),
          map(({ newValue }) => newValue),
          tap((theme) => (this.tracker.currentTheme = theme)),
          takeUntil(this.#destroyed),
        )
        .subscribe();
    }

    // if we got a query param, update the current theme on route param changes
    if (!!this.queryParam) {
      this.activatedRoute.queryParamMap
        .pipe(
          skipWhile(() => !this.tracker.currentTheme),
          filter((map) => map.has(this.queryParam!)),
          map((map) => map.get(this.queryParam!)),
          tap((theme) => (this.tracker.currentTheme = theme)),
          takeUntil(this.#destroyed),
        )
        .subscribe();
    }
  }

  /**
   * Cleanup logic to be executed when the service is destroyed.
   *
   * @internal
   */
  ngOnDestroy() {
    this.#destroyed.next();
    this.#destroyed.complete();
  }

  /**
   * Select the theme to be used
   *
   * @param {string} theme
   */
  selectTheme(theme: string) {
    this.tracker.currentTheme = theme;
  }

  /**
   * Gets the theme from the browser's storage.
   *
   * @returns {string | null} - The stored theme or null if the storage key is not provided
   * @private
   */
  get #themeFromStorage(): string | null {
    if (!this.storageKey) {
      return null;
    }
    return this.storage.getItem(this.storageKey);
  }

  /**
   * Gets the theme from the current route's query.
   *
   * @returns {string | null} - The current theme or null if the query param is not provided
   * @private
   */
  get #themeFromRoute(): string | null {
    if (!this.queryParam) {
      return null;
    }
    return this.activatedRoute.snapshot.queryParamMap.get(this.queryParam);
  }

  /**
   * Updates the browser's url query params with the given theme ID.
   *
   * Does nothing if the query param is not provided.
   *
   * @param {string} theme - The theme ID to update in the browser's url query params
   * @private
   */
  #updateRouteParam(theme: string) {
    if (!this.queryParam) {
      return;
    }
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: theme ? { [this.queryParam]: theme } : {},
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });
  }

  /**
   * Updates the theme ID in the browser's storage.
   *
   * Does nothing if the storage key is not provided.
   *
   * @param {string} theme - The theme ID to save in the browser's storage
   * @private
   */
  #updateStoredTheme(theme: string) {
    if (!this.storageKey) {
      return;
    }
    this.storage.setItem(this.storageKey, theme);
  }
}

/**
 * Type guard.
 *
 * @param {T | null]} arg - The argument to guard
 * @internal
 */
function isNotNull<T>(arg: T | null): arg is T {
  return arg !== null;
}
