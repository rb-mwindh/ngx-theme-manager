import { TestBed } from "@angular/core/testing";
import { Theme } from "../theme";
import { ThemeRegistryService } from "./theme-registry.service";

describe('ThemeRegistryService', () => {
  let service: ThemeRegistryService;

  const darkTheme: Theme = {
    id: 'dark',
    displayName: 'Dark',
    description: 'Dark theme',
    defaultTheme: false,
  };

  const lightTheme: Theme = {
    id: 'light',
    displayName: 'Light',
    description: 'Light theme',
    defaultTheme: true,
  };

  function flush(): void {
    TestBed.tick();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeRegistryService],
    });

    service = TestBed.inject(ThemeRegistryService);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  describe('themes', () => {
    it('should initially contain no themes', () => {
      expect(service.themes()).toEqual([]);
    });

    it('should expose registered themes', () => {
      service.register(darkTheme);
      service.register(lightTheme);

      expect(service.themes()).toEqual(
        expect.arrayContaining([darkTheme, lightTheme]),
      );
      expect(service.themes()).toHaveLength(2);
    });
  });

  describe('themes$', () => {
    it('should expose the initial collection', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      flush();

      expect(next).toHaveBeenCalledWith([]);

      subscription.unsubscribe();
    });

    it('should expose changes to registered themes', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      flush();

      service.register(darkTheme);
      flush();

      expect(next).toHaveBeenLastCalledWith([darkTheme]);

      service.register(lightTheme);
      flush();

      expect(next).toHaveBeenLastCalledWith(
        expect.arrayContaining([darkTheme, lightTheme]),
      );

      subscription.unsubscribe();
    });

    it('should expose removals from the registry', () => {
      service.registerAll([darkTheme, lightTheme]);
      flush();

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      flush();

      service.unregister(darkTheme);
      flush();

      expect(next).toHaveBeenLastCalledWith([lightTheme]);

      subscription.unsubscribe();
    });

    it('should provide the current collection to late subscribers', () => {
      service.register(darkTheme);
      flush();

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      flush();

      expect(next).toHaveBeenCalledWith([darkTheme]);

      subscription.unsubscribe();
    });
  });

  describe('register', () => {
    it('should register a theme', () => {
      service.register(darkTheme);

      expect(service.get('dark')).toEqual(darkTheme);
      expect(service.has('dark')).toBe(true);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      [
        'a theme without an id',
        {
          ...darkTheme,
          id: '',
        },
      ],
    ])('should ignore %s', (_description, theme) => {
      service.register(theme);

      expect(service.themes()).toEqual([]);
    });

    it('should merge a theme with an existing registration', () => {
      service.register(darkTheme);

      service.register({
        id: 'dark',
        displayName: 'Updated Dark',
        defaultTheme: true,
      });

      expect(service.get('dark')).toEqual({
        id: 'dark',
        displayName: 'Updated Dark',
        description: 'Dark theme',
        defaultTheme: true,
      });
    });
  });

  describe('registerAll', () => {
    it('should register multiple themes', () => {
      service.registerAll([darkTheme, lightTheme]);

      expect(service.themes()).toEqual(
        expect.arrayContaining([darkTheme, lightTheme]),
      );
      expect(service.themes()).toHaveLength(2);
    });

    it('should ignore invalid entries and register valid themes', () => {
      service.registerAll([
        undefined,
        null,
        {
          ...darkTheme,
          id: '',
        },
        lightTheme,
      ]);

      expect(service.themes()).toEqual([lightTheme]);
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      service.registerAll([darkTheme, lightTheme]);
    });

    it('should unregister a theme', () => {
      service.unregister(darkTheme);

      expect(service.has('dark')).toBe(false);
      expect(service.get('dark')).toBeNull();
      expect(service.has('light')).toBe(true);
    });

    it('should identify the theme to remove by its id', () => {
      service.unregister({
        id: 'dark',
        displayName: 'Different',
        defaultTheme: true,
      });

      expect(service.has('dark')).toBe(false);
      expect(service.has('light')).toBe(true);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      [
        'an unknown theme',
        {
          id: 'unknown',
          displayName: 'Unknown',
          defaultTheme: false,
        },
      ],
    ])('should ignore %s', (_description, theme) => {
      service.unregister(theme);

      expect(service.has('dark')).toBe(true);
      expect(service.has('light')).toBe(true);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      service.register(darkTheme);
    });

    it('should return a registered theme', () => {
      expect(service.get('dark')).toEqual(darkTheme);
    });

    it.each([
      ['an unknown id', 'unknown'],
      ['null', null],
      ['an empty id', ''],
    ])('should return null for %s', (_description, id) => {
      expect(service.get(id)).toBeNull();
    });
  });

  describe('has', () => {
    beforeEach(() => {
      service.register(darkTheme);
    });

    it('should return true for a registered theme', () => {
      expect(service.has('dark')).toBe(true);
    });

    it.each([
      ['an unknown id', 'unknown'],
      ['null', null],
      ['an empty id', ''],
    ])('should return false for %s', (_description, id) => {
      expect(service.has(id)).toBe(false);
    });
  });
});
