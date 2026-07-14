import { TestBed } from "@angular/core/testing";
import { provideThemeManager } from "./provide-theme-manager";
import { QUERY_PARAM, STORAGE_KEY } from "./theme.service";

describe('provideThemeManager', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should keep the default token values when the function is not called', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(STORAGE_KEY)).toBe('ngx-theme-manager/current-theme');
    expect(TestBed.inject(QUERY_PARAM)).toBe('theme');
  });

  it('should keep the default token values when the function is called without arguments', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager()
      ]
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('ngx-theme-manager/current-theme');
    expect(TestBed.inject(QUERY_PARAM)).toBe('theme');
  });

  it('should provide the configured storage key and query parameter', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          storageKey: 'custom-storage-key',
          queryParam: 'custom-query-param',
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('custom-storage-key');
    expect(TestBed.inject(QUERY_PARAM)).toBe('custom-query-param');
  });

  it('should override only the storage key when only the storage key is provided', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          storageKey: 'custom-storage-key',
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('custom-storage-key');
    expect(TestBed.inject(QUERY_PARAM)).toBe('theme');
  });

  it('should override only the query parameter when only the query parameter is provided', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          queryParam: 'custom-query-param',
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('ngx-theme-manager/current-theme');
    expect(TestBed.inject(QUERY_PARAM)).toBe('custom-query-param');
  });

  it('should keep the default token values when options are explicitly undefined', () => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          storageKey: undefined,
          queryParam: undefined,
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('ngx-theme-manager/current-theme');
    expect(TestBed.inject(QUERY_PARAM)).toBe('theme');
  });

  it.each([null, ''])('should disable storage synchronization when the storage key is %p', (value) => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          storageKey: value,
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBeNull();
    expect(TestBed.inject(QUERY_PARAM)).toBe('theme');
  });

  it.each([null, ''])('should disable route synchronization when the query parameter is %p', (value) => {
    TestBed.configureTestingModule({
      providers: [
        provideThemeManager({
          queryParam: value,
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_KEY)).toBe('ngx-theme-manager/current-theme');
    expect(TestBed.inject(QUERY_PARAM)).toBeNull();
  });
});



