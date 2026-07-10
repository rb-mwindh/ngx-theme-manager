import { DOCUMENT } from "@angular/common";
import { inject, Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";

/**
 * Represents a change to the configured browser storage.
 *
 * @interface
 * @group Public API
 */
export interface StorageChangeEvent {
  /**
   * The key of the item that changed.
   *
   * The value is null when the complete storage was cleared by a native
   * storage event.
   */
  readonly key: string | null;

  /**
   * The value before the change.
   */
  readonly oldValue: string | null;

  /**
   * The value after the change.
   */
  readonly newValue: string | null;
}

/**
 * Document extension used by older browser implementations.
 *
 * @internal
 */
interface DocumentWithParentWindow extends Document {
  parentWindow?: Window;
}

/**
 * No-operation storage implementation used when localStorage is unavailable.
 *
 * @internal
 */
const NOOP_STORAGE: Storage = {
  get length(): number {
    return 0;
  },

  clear(): void {},

  getItem(): null {
    return null;
  },

  key(): null {
    return null;
  },

  removeItem(): void {},

  setItem(): void {},
};

/**
 * Provides access to localStorage and an observable stream of storage changes.
 *
 * No signal is exposed because storage changes are events rather than
 * application state.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class StorageService implements OnDestroy {
  /**
   * Injected document.
   *
   * @private
   */
  readonly #document = inject(DOCUMENT);

  /**
   * Browser window associated with the injected document.
   *
   * @private
   */
  readonly #window: Window | undefined;

  /**
   * Browser storage used by this service.
   *
   * Falls back to a no-operation implementation when localStorage is not
   * available.
   *
   * @private
   */
  readonly #storage: Storage;

  /**
   * Internal event source for storage changes.
   *
   * @private
   */
  readonly #changesSubject = new Subject<StorageChangeEvent>();

  /**
   * Observable stream of storage change events.
   */
  readonly changes$ = this.#changesSubject.asObservable();

  /**
   * Creates the service and registers the native storage event listener.
   */
  constructor() {
    const document = this.#document as DocumentWithParentWindow;

    this.#window =
      document.parentWindow ??
      document.defaultView ??
      undefined;

    this.#storage = getLocalStorage(this.#window);

    this.#window?.addEventListener(
      'storage',
      this.#storageEventListener,
    );
  }

  /**
   * Removes the native event listener and completes the event stream.
   *
   * @internal
   */
  ngOnDestroy(): void {
    this.#window?.removeEventListener(
      'storage',
      this.#storageEventListener,
    );

    this.#changesSubject.complete();
  }

  /**
   * Stores a value.
   *
   * No event is emitted when the new value equals the existing value.
   *
   * @param key The key to set.
   * @param newValue The value to store.
   */
  setItem(key: string, newValue: string): void {
    const oldValue = this.#storage.getItem(key);

    if (oldValue === newValue) {
      return;
    }

    this.#storage.setItem(key, newValue);
    this.#changesSubject.next({
      key,
      oldValue,
      newValue,
    });
  }

  /**
   * Returns a stored value.
   *
   * @param key The key to retrieve.
   * @returns The stored value or null.
   */
  getItem(key: string): string | null {
    return this.#storage.getItem(key);
  }

  /**
   * Removes a stored value.
   *
   * No event is emitted when the key does not exist.
   *
   * @param key The key to remove.
   */
  removeItem(key: string): void {
    const oldValue = this.#storage.getItem(key);

    if (oldValue === null) {
      return;
    }

    this.#storage.removeItem(key);
    this.#changesSubject.next({
      key,
      oldValue,
      newValue: null,
    });
  }

  /**
   * Clears all stored values and emits one change event for each removed key.
   */
  clear(): void {
    const changes: StorageChangeEvent[] = [];

    for (let index = 0; index < this.#storage.length; index++) {
      const key = this.#storage.key(index);

      if (key === null) {
        continue;
      }

      changes.push({
        key,
        oldValue: this.#storage.getItem(key),
        newValue: null,
      });
    }

    this.#storage.clear();

    changes.forEach((change) => {
      this.#changesSubject.next(change);
    });
  }

  /**
   * Handles native storage events from other browser contexts.
   *
   * @param event The native storage event.
   * @private
   */
  readonly #storageEventListener = (
    event: StorageEvent,
  ): void => {
    if (event.storageArea !== this.#storage) {
      return;
    }

    this.#changesSubject.next({
      key: event.key,
      oldValue: event.oldValue,
      newValue: event.newValue,
    });
  };
}

/**
 * Returns the window's localStorage implementation.
 *
 * Accessing localStorage may throw in restricted browser environments.
 * In that case, a no-operation implementation is returned.
 *
 * @param window Browser window.
 * @internal
 */
function getLocalStorage(window: Window | undefined): Storage {
  if (!window) {
    return NOOP_STORAGE;
  }

  try {
    return window.localStorage;
  } catch {
    return NOOP_STORAGE;
  }
}
