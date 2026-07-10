import { TestBed } from "@angular/core/testing";
import { Subscription } from "rxjs";
import { StorageChangeEvent, StorageService } from "./storage.service";

describe('StorageService', () => {
  let service: StorageService;
  let subscription: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService],
    });

    service = TestBed.inject(StorageService);
    subscription = new Subscription();
  });

  afterEach(() => {
    subscription.unsubscribe();

    localStorage.clear();
    sessionStorage.clear();

  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('should complete changes$ when its injection context is destroyed', () => {
    const complete = jest.fn();

    subscription.add(
      service.changes$.subscribe({
        complete,
      }),
    );

    TestBed.resetTestingModule();

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('should emit changes from native storage events', () => {
    const changes: StorageChangeEvent[] = [];

    subscription.add(
      service.changes$.subscribe((change) => {
        changes.push(change);
      }),
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test_key',
        oldValue: 'old_value',
        newValue: 'new_value',
        storageArea: localStorage,
      }),
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test_key',
        oldValue: 'new_value',
        newValue: null,
        storageArea: localStorage,
      }),
    );

    expect(changes).toEqual([
      {
        key: 'test_key',
        oldValue: 'old_value',
        newValue: 'new_value',
      },
      {
        key: 'test_key',
        oldValue: 'new_value',
        newValue: null,
      },
    ]);
  });

  it('should expose a null key when native storage is cleared', () => {
    const changes: StorageChangeEvent[] = [];

    subscription.add(
      service.changes$.subscribe((change) => {
        changes.push(change);
      }),
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: null,
        oldValue: null,
        newValue: null,
        storageArea: localStorage,
      }),
    );

    expect(changes).toEqual([
      {
        key: null,
        oldValue: null,
        newValue: null,
      },
    ]);
  });

  it('should ignore native events for a different storage area', () => {
    const changes: StorageChangeEvent[] = [];

    subscription.add(
      service.changes$.subscribe((change) => {
        changes.push(change);
      }),
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test_key',
        oldValue: null,
        newValue: 'session_value',
        storageArea: sessionStorage,
      }),
    );

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test_key',
        oldValue: null,
        newValue: 'local_value',
        storageArea: localStorage,
      }),
    );

    expect(changes).toEqual([
      {
        key: 'test_key',
        oldValue: null,
        newValue: 'local_value',
      },
    ]);
  });

  describe('setItem', () => {
    it('should store the provided value', () => {
      service.setItem('test_key', 'test_value');

      expect(localStorage.getItem('test_key')).toBe('test_value');
    });

    it('should emit the storage change', () => {
      const changes: StorageChangeEvent[] = [];

      subscription.add(
        service.changes$.subscribe((change) => {
          changes.push(change);
        }),
      );

      service.setItem('test_key', 'a');
      service.setItem('test_key', 'b');

      expect(changes).toEqual([
        {
          key: 'test_key',
          oldValue: null,
          newValue: 'a',
        },
        {
          key: 'test_key',
          oldValue: 'a',
          newValue: 'b',
        },
      ]);
    });

    it('should not emit when the value does not change', () => {
      const next = jest.fn();

      localStorage.setItem('test_key', 'test_value');

      subscription.add(
        service.changes$.subscribe(next),
      );

      service.setItem('test_key', 'test_value');

      expect(next).not.toHaveBeenCalled();
    });


  });

  describe('getItem', () => {
    it('should return a stored value', () => {
      localStorage.setItem('test_key', 'test_value');

      expect(service.getItem('test_key')).toBe('test_value');
    });

    it('should return null when the key does not exist', () => {
      expect(service.getItem('missing_key')).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove an existing value', () => {
      localStorage.setItem('test_key', 'test_value');

      service.removeItem('test_key');

      expect(localStorage.getItem('test_key')).toBeNull();
    });

    it('should emit the storage change', () => {
      const changes: StorageChangeEvent[] = [];

      localStorage.setItem('test_key', 'test_value');

      subscription.add(
        service.changes$.subscribe((change) => {
          changes.push(change);
        }),
      );

      service.removeItem('test_key');

      expect(changes).toEqual([
        {
          key: 'test_key',
          oldValue: 'test_value',
          newValue: null,
        },
      ]);
    });

    it('should not emit when the key does not exist', () => {
      const next = jest.fn();

      subscription.add(
        service.changes$.subscribe(next),
      );

      service.removeItem('missing_key');

      expect(next).not.toHaveBeenCalled();
    });


  });

  describe('clear', () => {
    it('should clear all stored values', () => {
      localStorage.setItem('a', 'value_a');
      localStorage.setItem('b', 'value_b');

      service.clear();

      expect(localStorage.length).toBe(0);
    });

    it('should emit one change for each removed item', () => {
      const changes: StorageChangeEvent[] = [];

      localStorage.setItem('a', 'value_a');
      localStorage.setItem('b', 'value_b');

      subscription.add(
        service.changes$.subscribe((change) => {
          changes.push(change);
        }),
      );

      service.clear();

      expect(changes).toEqual(
        expect.arrayContaining([
          {
            key: 'a',
            oldValue: 'value_a',
            newValue: null,
          },
          {
            key: 'b',
            oldValue: 'value_b',
            newValue: null,
          },
        ]),
      );

      expect(changes).toHaveLength(2);
    });

    it('should not emit when storage is already empty', () => {
      const next = jest.fn();

      subscription.add(
        service.changes$.subscribe(next),
      );

      service.clear();

      expect(next).not.toHaveBeenCalled();
    });
  });
});
