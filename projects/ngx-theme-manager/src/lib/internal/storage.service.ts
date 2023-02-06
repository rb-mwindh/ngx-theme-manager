import { Inject, Injectable, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { share, Subject, takeUntil } from 'rxjs';

/**
 * StorageChangeEvent represents the change event of the storage.
 *
 * @interface
 * @group Public API
 */
export interface StorageChangeEvent {
  /**
   * The key of the item that was changed.
   */
  key: string;

  /**
   * The value of the item before the change.
   */
  oldValue: string | null;

  /**
   * The value of the item after the change.
   */
  newValue: string | null;
}

/**
 * RbStorageService is a service that provides an observable stream of storage change events.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class StorageService implements OnDestroy {
  readonly #destroy$ = new Subject<void>();

  /**
   * The browser's local storage object.
   *
   * @readonly
   * @private
   */
  readonly #storage: Storage;

  /**
   * The browser's window object.
   *
   * @readonly
   * @private
   */
  readonly #window: Window;

  /**
   * The Subject receiving the storage change events.
   *
   * @readonly
   * @private
   */
  readonly #changes$ = new Subject<StorageChangeEvent>();

  /**
   * The observable stream of storage change events, shared among subscribers.
   *
   * @readonly
   */
  public readonly changes$ = this.#changes$.pipe(
    share(),
    takeUntil(this.#destroy$),
  );

  /**
   * Creates an instance of RbStorageService.
   *
   * @param {Document} document - the document object provided by Angular's DI.
   */
  public constructor(@Inject(DOCUMENT) document: Document) {
    this.#window = (document as any).parentWindow || document.defaultView;
    this.#storage = this.#window.localStorage;
    this.#window.addEventListener(
      'storage',
      this.#storageEventListener.bind(this),
    );
  }

  /**
   * An Angular lifecycle hook that removes the storage event listener and completes the {@link #changes$} subject.
   *
   * @internal
   */
  ngOnDestroy() {
    this.#window.removeEventListener(
      'storage',
      this.#storageEventListener.bind(this),
    );
    this.#destroy$.next();
    this.#destroy$.complete();
  }

  /**
   * Sets a key-value pair in the local storage and emits a change event.
   *
   * @param {string} key - The key to set
   * @param {string} newValue - The value to set
   */
  public setItem(key: string, newValue: string): void {
    const oldValue = this.#storage.getItem(key);
    this.#storage.setItem(key, newValue);
    this.#changes$.next({ key, oldValue, newValue });
  }

  /**
   * Gets the value of a key in the local storage.
   *
   * @param {string} key - The key to get the value of
   * @returns {(string | null)} The value of the key or null if it does not exist
   */
  public getItem(key: string): string | null {
    return this.#storage.getItem(key);
  }

  /**
   * Removes the value of a key from the local storage and emits a change event.
   *
   * @param {string} key - The key to remove
   */
  public removeItem(key: string): void {
    const oldValue = this.#storage.getItem(key);
    this.#storage.removeItem(key);
    this.#changes$.next({ key, oldValue, newValue: null });
  }

  /**
   * Clears all keys from the local storage and emits a change event for each removed key.
   */
  public clear(): void {
    const changes: StorageChangeEvent[] = [];
    for (let i = 0; i < this.#storage.length; i++) {
      const key = this.#storage.key(i)!; // I'm sure it's never null!
      const oldValue = this.#storage.getItem(key);
      changes.push({ key, oldValue, newValue: null });
    }
    this.#storage.clear();
    changes.forEach((change) => this.#changes$.next(change));
  }

  /**
   * The storage event handler that takes a native StorageEvent and emits a {@link StorageChangeEvent}.
   *
   * @param {StorageEvent} event - The native event to handle
   * @private
   */
  #storageEventListener(event: StorageEvent): void {
    if (event.storageArea != this.#storage) {
      return;
    }

    const key = event.key!;
    const { oldValue, newValue } = event;
    this.#changes$.next({ key, oldValue, newValue });
  }
}
