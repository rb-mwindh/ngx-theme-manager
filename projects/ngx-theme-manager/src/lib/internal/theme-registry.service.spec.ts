import { TestBed } from "@angular/core/testing";
import { Theme } from "../theme";
import { ThemeRegistryService } from "./theme-registry.service";

describe('ThemeRegistryService', () => {
  let service: ThemeRegistryService;

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

    it('should contain registered themes', () => {
      const theme: Theme = {
        id: 'dark',
        displayName: 'Dark',
      };

      service.register(theme);

      expect(service.themes()).toEqual([theme]);
    });

    it('should update synchronously', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);

      service.register({
        id: 'light',
        displayName: 'Light',
      });

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);
    });
  });

  describe('themes$', () => {
    it('should initially emit an empty collection', () => {
      const next = jest.fn();

      const subscription = service.themes$.subscribe(next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith([]);

      subscription.unsubscribe();
    });

    it('should emit registered themes', () => {
      const emissions: Array<readonly Theme[]> = [];

      const subscription = service.themes$.subscribe((themes) => {
        emissions.push(themes);
      });

      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      service.register({
        id: 'light',
        displayName: 'Light',
      });

      expect(emissions).toEqual([
        [],
        [
          {
            id: 'dark',
            displayName: 'Dark',
          },
        ],
        [
          {
            id: 'dark',
            displayName: 'Dark',
          },
          {
            id: 'light',
            displayName: 'Light',
          },
        ],
      ]);

      subscription.unsubscribe();
    });

    it('should immediately emit the current collection to late subscribers', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith([
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);

      subscription.unsubscribe();
    });

    it('should provide the same state to multiple subscribers', () => {
      const firstSubscriber = jest.fn();
      const secondSubscriber = jest.fn();

      const firstSubscription =
        service.themes$.subscribe(firstSubscriber);

      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      const secondSubscription =
        service.themes$.subscribe(secondSubscriber);

      service.register({
        id: 'light',
        displayName: 'Light',
      });

      expect(firstSubscriber.mock.calls).toEqual([
        [[]],
        [
          [
            {
              id: 'dark',
              displayName: 'Dark',
            },
          ],
        ],
        [
          [
            {
              id: 'dark',
              displayName: 'Dark',
            },
            {
              id: 'light',
              displayName: 'Light',
            },
          ],
        ],
      ]);

      expect(secondSubscriber.mock.calls).toEqual([
        [
          [
            {
              id: 'dark',
              displayName: 'Dark',
            },
          ],
        ],
        [
          [
            {
              id: 'dark',
              displayName: 'Dark',
            },
            {
              id: 'light',
              displayName: 'Light',
            },
          ],
        ],
      ]);

      firstSubscription.unsubscribe();
      secondSubscription.unsubscribe();
    });
  });

  describe('register', () => {
    it('should register a theme', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      expect(service.has('dark')).toBe(true);
      expect(service.get('dark')).toEqual({
        id: 'dark',
        displayName: 'Dark',
      });
    });

    it('should ignore null', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.register(null);

      expect(service.themes()).toEqual([]);
      expect(next).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();
    });

    it('should ignore undefined', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.register(undefined);

      expect(service.themes()).toEqual([]);
      expect(next).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();
    });

    it('should ignore a theme without an id', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.register({
        id: '',
        displayName: 'Invalid theme',
      });

      expect(service.themes()).toEqual([]);
      expect(next).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();
    });

    it('should merge a theme with an existing theme', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
        description: 'Original description',
        defaultTheme: false,
      });

      service.register({
        id: 'dark',
        displayName: 'Dark theme',
        defaultTheme: true,
      });

      expect(service.get('dark')).toEqual({
        id: 'dark',
        displayName: 'Dark theme',
        description: 'Original description',
        defaultTheme: true,
      });

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark theme',
          description: 'Original description',
          defaultTheme: true,
        },
      ]);
    });

    it('should preserve the registration order when updating a theme', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      service.register({
        id: 'light',
        displayName: 'Light',
      });

      service.register({
        id: 'dark',
        description: 'Updated',
      });

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
          description: 'Updated',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);
    });

    it('should not emit when the registered theme did not change', () => {
      const theme: Theme = {
        id: 'dark',
        displayName: 'Dark',
        description: 'Dark theme',
        defaultTheme: true,
      };

      service.register(theme);

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.register({ ...theme });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith([theme]);

      subscription.unsubscribe();
    });

    it('should update both the signal and observable', () => {
      const emissions: Array<readonly Theme[]> = [];

      const subscription = service.themes$.subscribe((themes) => {
        emissions.push(themes);
      });

      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);

      expect(emissions).toEqual([
        [],
        [
          {
            id: 'dark',
            displayName: 'Dark',
          },
        ],
      ]);

      subscription.unsubscribe();
    });
  });

  describe('registerAll', () => {
    it('should register multiple themes', () => {
      service.registerAll([
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);
    });

    it('should publish only once for multiple changed themes', () => {
      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.registerAll([
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenNthCalledWith(1, []);
      expect(next).toHaveBeenNthCalledWith(2, [
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      subscription.unsubscribe();
    });

    it('should ignore null, undefined and themes without an id', () => {
      service.registerAll([
        null,
        undefined,
        {
          id: '',
          displayName: 'Invalid',
        },
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);
    });

    it('should merge themes with existing registrations', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
        description: 'Original description',
      });

      service.registerAll([
        {
          id: 'dark',
          displayName: 'Updated dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Updated dark',
          description: 'Original description',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);
    });

    it('should not emit when none of the themes changed', () => {
      const themes: Theme[] = [
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ];

      service.registerAll(themes);

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.registerAll(
        themes.map((theme) => ({ ...theme })),
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(themes);

      subscription.unsubscribe();
    });
  });

  describe('unregister', () => {
    it('should unregister a registered theme', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      service.unregister({
        id: 'dark',
      });

      expect(service.has('dark')).toBe(false);
      expect(service.get('dark')).toBeNull();
      expect(service.themes()).toEqual([]);
    });

    it('should emit the changed collection', () => {
      service.registerAll([
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.unregister({
        id: 'dark',
      });

      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenNthCalledWith(1, [
        {
          id: 'dark',
          displayName: 'Dark',
        },
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);
      expect(next).toHaveBeenNthCalledWith(2, [
        {
          id: 'light',
          displayName: 'Light',
        },
      ]);

      subscription.unsubscribe();
    });

    it('should ignore null', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.unregister(null);

      expect(service.has('dark')).toBe(true);
      expect(next).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();
    });

    it('should ignore undefined', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.unregister(undefined);

      expect(service.has('dark')).toBe(true);
      expect(next).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();
    });

    it('should not emit when the theme is not registered', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      const next = jest.fn();
      const subscription = service.themes$.subscribe(next);

      service.unregister({
        id: 'light',
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(service.themes()).toEqual([
        {
          id: 'dark',
          displayName: 'Dark',
        },
      ]);

      subscription.unsubscribe();
    });
  });

  describe('get', () => {
    it('should return a registered theme', () => {
      const theme: Theme = {
        id: 'dark',
        displayName: 'Dark',
      };

      service.register(theme);

      expect(service.get('dark')).toEqual(theme);
    });

    it('should return null for an unknown theme', () => {
      expect(service.get('unknown')).toBeNull();
    });

    it('should return null for null', () => {
      expect(service.get(null)).toBeNull();
    });

    it('should return null for an empty id', () => {
      expect(service.get('')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for a registered theme', () => {
      service.register({
        id: 'dark',
        displayName: 'Dark',
      });

      expect(service.has('dark')).toBe(true);
    });

    it('should return false for an unknown theme', () => {
      expect(service.has('unknown')).toBe(false);
    });

    it('should return false for null', () => {
      expect(service.has(null)).toBe(false);
    });

    it('should return false for an empty id', () => {
      expect(service.has('')).toBe(false);
    });
  });
});
