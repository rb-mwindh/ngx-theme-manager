import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { StorageService } from './storage.service';
import { cold } from 'jest-marbles';

describe('StorageService', function () {
  let service: StorageService;

  beforeEach(() => {
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');

    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [StorageService],
    });

    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', function () {
    expect(service).toBeDefined();
  });

  it('should subscribe to "storage" event', function () {
    expect(window.addEventListener).toBeCalledWith(
      'storage',
      expect.anything(),
    );
  });

  it('should unsubscribe from "storage" event', function () {
    service.ngOnDestroy();
    expect(window.removeEventListener).toBeCalledWith(
      'storage',
      expect.anything(),
    );
  });

  it('should emit on "storage" event', fakeAsync(() => {
    const a = {
      key: 'test_key',
      oldValue: 'old_value',
      newValue: 'new_value',
    };
    const b = {
      key: 'test_key',
      oldValue: 'new_value',
      newValue: null,
    };
    const storageArea = localStorage;

    cold('--a-b', { a, b }).subscribe((value) => {
      window.dispatchEvent(
        new StorageEvent('storage', { ...value, storageArea }),
      );
    });

    flush();

    const expected = cold('--a-b', { a, b });
    expect(service.changes$).toBeObservable(expected);
  }));

  it('should emit on setItem', fakeAsync(() => {
    const a = {
      key: 'test_key',
      oldValue: null,
      newValue: 'a',
    };
    const b = {
      key: 'test_key',
      oldValue: 'a',
      newValue: 'b',
    };

    cold('--a-b', { a, b }).subscribe((value) => {
      service.setItem(value.key, value.newValue);
    });

    flush();

    const expected = cold('--a-b', { a, b });
    expect(service.changes$).toBeObservable(expected);
  }));

  it('should emit on removeItem', fakeAsync(() => {
    const a = {
      key: 'test_key',
      oldValue: null,
      newValue: 'a',
    };
    const b = {
      key: 'test_key',
      oldValue: 'a',
      newValue: null,
    };
    const fnA = () => service.setItem(a.key, a.newValue);
    const fnB = () => service.removeItem(b.key);

    cold('--a-b', { a: fnA, b: fnB }).subscribe((fn) => fn());

    flush();

    const expected = cold('--a-b', { a, b });
    expect(service.changes$).toBeObservable(expected);
  }));

  it('should emit on clear', fakeAsync(() => {
    cold('--a').subscribe(() => {
      localStorage.setItem('a', 'a');
      localStorage.setItem('b', 'b');
      service.clear();
    });

    flush();

    expect(service.changes$).toBeObservable(
      cold('--(ab)', {
        a: { key: 'a', oldValue: 'a', newValue: null },
        b: { key: 'b', oldValue: 'b', newValue: null },
      }),
    );
  }));

  it('should getItem', function () {
    localStorage.setItem('test_key', 'a');
    expect(service.getItem('test_key')).toEqual('a');
  });

  it('should ignore different storageArea', fakeAsync(() => {
    const a = {
      key: 'test_key',
      oldValue: null,
      newValue: 'a',
      storageArea: sessionStorage,
    };
    const b = {
      key: 'test_key',
      oldValue: null,
      newValue: 'a',
      storageArea: localStorage,
    };

    cold('--a-b', { a, b }).subscribe((data) =>
      window.dispatchEvent(new StorageEvent('storage', { ...data })),
    );

    flush();

    expect(service.changes$).toBeObservable(
      cold('----b', {
        b: { key: b.key, oldValue: b.oldValue, newValue: b.newValue },
      }),
    );
  }));
});
