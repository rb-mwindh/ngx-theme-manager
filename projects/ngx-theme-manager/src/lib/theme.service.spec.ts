import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from "@angular/router";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import {
  StorageChangeEvent,
  StorageService,
  ThemeRegistryService,
  ThemeStyleManagerService,
  ThemeTrackingService
} from "./internal";
import { Theme } from "./theme";
import { QUERY_PARAM, STORAGE_KEY, ThemeService } from "./theme.service";

const storageKey = 'test/current-theme';
const queryParam = 'theme';

const darkTheme: Theme = {
  id: 'dark',
  displayName: 'Dark',
} as const;

const lightTheme: Theme = {
  id: 'light',
  displayName: 'Light',
} as const;

const defaultTheme: Theme = {
  id: 'default',
  displayName: 'Default',
  defaultTheme: true,
} as const;

describe('ThemeService', () => {
  let service: ThemeService;
  let registry: ThemeRegistryService;
  let tracker: ThemeTrackingService;

  let subscription: Subscription;
  let storageChanges$: Subject<StorageChangeEvent>;
  let routeParams$: BehaviorSubject<ParamMap>;

  let storage: {
    changes$: Subject<StorageChangeEvent>;
    getItem: jest.Mock;
    setItem: jest.Mock;
  };

  let manager: {
    use: jest.Mock;
  };

  let router: {
    navigate: jest.Mock;
  };

  let activatedRoute: {
    snapshot: {
      queryParamMap: ParamMap;
    };
    queryParamMap: BehaviorSubject<ParamMap>;
  };

  beforeEach(() => {
    subscription = new Subscription();

    storageChanges$ = new Subject<StorageChangeEvent>();
    routeParams$ = new BehaviorSubject<ParamMap>(
      convertToParamMap({}),
    );

    storage = {
      changes$: storageChanges$,
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
    };

    manager = {
      use: jest.fn(),
    };

    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    activatedRoute = {
      snapshot: {
        queryParamMap: convertToParamMap({}),
      },
      queryParamMap: routeParams$,
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        ThemeRegistryService,
        ThemeTrackingService,
        { provide: ThemeStyleManagerService, useValue: manager },
        { provide: StorageService, useValue: storage },
        { provide: STORAGE_KEY, useValue: storageKey },
        { provide: QUERY_PARAM, useValue: queryParam },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    });
  });

  afterEach(() => {
    subscription.unsubscribe();
    storageChanges$.complete();
    routeParams$.complete();
  });

  function flush(): void {
    TestBed.tick();
  }

  describe('public state', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);
      service = TestBed.inject(ThemeService);
    });

    it('should expose registered themes', () => {
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      expect(service.themes()).toEqual([
        darkTheme,
        lightTheme,
      ]);
    });

    it('should expose themes registered after service creation', () => {
      registry.register(darkTheme);

      flush();

      registry.register(lightTheme);

      flush();

      expect(service.themes()).toEqual([
        darkTheme,
        lightTheme,
      ]);
    });

    it('should publish visible registry changes through themes$', () => {
      const emissions: Theme[][] = [];

      registry.register(darkTheme);

      subscription.add(
        service.themes$.subscribe((themes) => {
          emissions.push(themes);
        }),
      );

      flush();

      registry.register(lightTheme);

      flush();

      expect(emissions).toEqual([
        [darkTheme],
        [
          darkTheme,
          lightTheme,
        ],
      ]);
    });

    it('should expose the selected theme', () => {
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      service.selectTheme('light');

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should publish visible theme changes through currentTheme$', () => {
      const emissions: Array<string | null> = [];

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      subscription.add(
        service.currentTheme$.subscribe((theme) => {
          emissions.push(theme);
        }),
      );

      flush();

      service.selectTheme('light');

      flush();

      expect(emissions).toEqual([
        'dark',
        'light',
      ]);
    });
  });

  describe('initial theme selection', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);
      service = TestBed.inject(ThemeService);
    });

    it('should prefer the route theme', () => {
      activatedRoute.snapshot.queryParamMap =
        convertToParamMap({
          [queryParam]: 'light',
        });

      storage.getItem.mockReturnValue('dark');

      registry.registerAll([
        darkTheme,
        lightTheme,
        defaultTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should use the stored theme when no valid route theme exists', () => {
      storage.getItem.mockReturnValue('light');

      registry.registerAll([
        darkTheme,
        lightTheme,
        defaultTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should use the default theme when route and storage do not resolve', () => {
      registry.registerAll([
        darkTheme,
        defaultTheme,
        lightTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('default');
    });

    it('should use the first registered theme when no default theme exists', () => {
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('dark');
    });

    it('should ignore unknown route and storage themes', () => {
      activatedRoute.snapshot.queryParamMap =
        convertToParamMap({
          [queryParam]: 'unknown-route-theme',
        });

      storage.getItem.mockReturnValue(
        'unknown-storage-theme',
      );

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('dark');
    });

    it('should remain unselected when no themes are registered', () => {
      flush();

      expect(service.currentTheme()).toBeNull();
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should select an initial theme when themes are registered later', () => {
      flush();

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).toHaveBeenCalledWith('dark');
    });

    it('should retain an existing current theme', () => {
      tracker.setCurrentTheme('manual');

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      expect(service.currentTheme()).toBe('manual');
      expect(manager.use).toHaveBeenCalledWith('manual');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'manual',
      );
    });
  });

  describe('selectTheme', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      service = TestBed.inject(ThemeService);

      flush();

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a registered theme', () => {
      service.selectTheme('light');

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should activate the selected theme', () => {
      service.selectTheme('light');

      flush();

      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should persist the selected theme', () => {
      service.selectTheme('light');

      flush();

      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
    });

    it('should update the route parameter', () => {
      service.selectTheme('light');

      flush();

      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: {
          [queryParam]: 'light',
        },
        queryParamsHandling: 'merge',
        preserveFragment: true,
        replaceUrl: true,
      });
    });

    it('should not navigate when the route already contains the selected theme', () => {
      activatedRoute.snapshot.queryParamMap =
        convertToParamMap({
          [queryParam]: 'light',
        });

      service.selectTheme('light');

      flush();

      expect(service.currentTheme()).toBe('light');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore unknown themes', () => {
      service.selectTheme('unknown');

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not repeat visible synchronization when the current theme is selected again', () => {
      service.selectTheme('dark');

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should clear the current selection', () => {
      service.selectTheme(null);

      flush();

      expect(service.currentTheme()).toBeNull();
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('storage synchronization', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      service = TestBed.inject(ThemeService);

      flush();

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a registered theme received from storage', () => {
      storageChanges$.next({
        key: storageKey,
        oldValue: 'dark',
        newValue: 'light',
      });

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should ignore events for another storage key', () => {
      storageChanges$.next({
        key: 'another-key',
        oldValue: 'dark',
        newValue: 'light',
      });

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore unknown stored themes', () => {
      storageChanges$.next({
        key: storageKey,
        oldValue: 'dark',
        newValue: 'unknown',
      });

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should clear the selection when the stored value is removed', () => {
      storageChanges$.next({
        key: storageKey,
        oldValue: 'dark',
        newValue: null,
      });

      flush();

      expect(service.currentTheme()).toBeNull();
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should synchronize a valid stored theme with the style manager and route', () => {
      storageChanges$.next({
        key: storageKey,
        oldValue: 'dark',
        newValue: 'light',
      });

      flush();

      expect(manager.use).toHaveBeenCalledWith('light');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: {
          [queryParam]: 'light',
        },
        queryParamsHandling: 'merge',
        preserveFragment: true,
        replaceUrl: true,
      });
    });
  });

  describe('route synchronization', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);

      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      service = TestBed.inject(ThemeService);

      flush();

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a registered route theme', () => {
      const params = convertToParamMap({
        [queryParam]: 'light',
      });

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      flush();

      expect(service.currentTheme()).toBe('light');
    });

    it('should activate and persist a registered route theme', () => {
      const params = convertToParamMap({
        [queryParam]: 'light',
      });

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      flush();

      expect(manager.use).toHaveBeenCalledWith('light');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
    });

    it('should not navigate when the theme change originates from the route', () => {
      const params = convertToParamMap({
        [queryParam]: 'light',
      });

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      flush();

      expect(service.currentTheme()).toBe('light');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore an unknown route theme', () => {
      const params = convertToParamMap({
        [queryParam]: 'unknown',
      });

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore a missing route theme', () => {
      const params = convertToParamMap({});

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      flush();

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    describe('without storage synchronization', () => {
      beforeEach(() => {
        TestBed.overrideProvider(STORAGE_KEY, {
          useValue: null,
        });

        registry = TestBed.inject(ThemeRegistryService);
        tracker = TestBed.inject(ThemeTrackingService);
        service = TestBed.inject(ThemeService);
      });

      it('should neither persist themes nor react to storage events', () => {
        registry.registerAll([
          darkTheme,
          lightTheme,
        ]);

        flush();

        manager.use.mockClear();
        storage.setItem.mockClear();
        router.navigate.mockClear();

        service.selectTheme('light');

        flush();

        expect(service.currentTheme()).toBe('light');
        expect(manager.use).toHaveBeenCalledWith('light');
        expect(storage.setItem).not.toHaveBeenCalled();

        storageChanges$.next({
          key: storageKey,
          oldValue: 'light',
          newValue: 'dark',
        });

        flush();

        expect(service.currentTheme()).toBe('light');
      });
    });

    describe('without route synchronization', () => {
      beforeEach(() => {
        TestBed.overrideProvider(QUERY_PARAM, {
          useValue: null,
        });

        registry = TestBed.inject(ThemeRegistryService);
        tracker = TestBed.inject(ThemeTrackingService);
        service = TestBed.inject(ThemeService);
      });

      it('should neither navigate nor react to route events', () => {
        registry.registerAll([
          darkTheme,
          lightTheme,
        ]);

        flush();

        manager.use.mockClear();
        storage.setItem.mockClear();
        router.navigate.mockClear();

        service.selectTheme('light');

        flush();

        expect(service.currentTheme()).toBe('light');
        expect(manager.use).toHaveBeenCalledWith('light');
        expect(storage.setItem).toHaveBeenCalledWith(
          storageKey,
          'light',
        );
        expect(router.navigate).not.toHaveBeenCalled();

        const params = convertToParamMap({
          [queryParam]: 'dark',
        });

        activatedRoute.snapshot.queryParamMap = params;
        routeParams$.next(params);

        flush();

        expect(service.currentTheme()).toBe('light');
      });
    });

    describe('without Router', () => {
      beforeEach(() => {
        TestBed.overrideProvider(Router, {
          useValue: null,
        });

        registry = TestBed.inject(ThemeRegistryService);
        tracker = TestBed.inject(ThemeTrackingService);
        service = TestBed.inject(ThemeService);
      });

      it('should activate and persist selected themes', () => {
        registry.registerAll([
          darkTheme,
          lightTheme,
        ]);

        flush();

        manager.use.mockClear();
        storage.setItem.mockClear();

        service.selectTheme('light');

        flush();

        expect(service.currentTheme()).toBe('light');
        expect(manager.use).toHaveBeenCalledWith('light');
        expect(storage.setItem).toHaveBeenCalledWith(
          storageKey,
          'light',
        );
      });
    });

    describe('without ActivatedRoute', () => {
      beforeEach(() => {
        TestBed.overrideProvider(ActivatedRoute, {
          useValue: null,
        });

        registry = TestBed.inject(ThemeRegistryService);
        tracker = TestBed.inject(ThemeTrackingService);
        service = TestBed.inject(ThemeService);
      });

      it('should activate and persist selected themes', () => {
        storage.getItem.mockReturnValue('light');

        registry.registerAll([
          darkTheme,
          lightTheme,
        ]);

        flush();

        expect(service.currentTheme()).toBe('light');
        expect(manager.use).toHaveBeenCalledWith('light');
        expect(storage.setItem).toHaveBeenCalledWith(
          storageKey,
          'light',
        );
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('without Router and ActivatedRoute', () => {
      beforeEach(() => {
        TestBed.overrideProvider(Router, {
          useValue: null,
        });

        TestBed.overrideProvider(ActivatedRoute, {
          useValue: null,
        });

        registry = TestBed.inject(ThemeRegistryService);
        tracker = TestBed.inject(ThemeTrackingService);
        service = TestBed.inject(ThemeService);
      });

      it('should initialize, select, activate and persist themes', () => {
        storage.getItem.mockReturnValue('light');

        registry.registerAll([
          darkTheme,
          lightTheme,
        ]);

        flush();

        expect(service.currentTheme()).toBe('light');
        expect(manager.use).toHaveBeenCalledWith('light');
        expect(storage.setItem).toHaveBeenCalledWith(
          storageKey,
          'light',
        );

        manager.use.mockClear();
        storage.setItem.mockClear();

        service.selectTheme('dark');

        flush();

        expect(service.currentTheme()).toBe('dark');
        expect(manager.use).toHaveBeenCalledWith('dark');
        expect(storage.setItem).toHaveBeenCalledWith(
          storageKey,
          'dark',
        );
      });
    });
  });

  describe('destruction', () => {
    beforeEach(() => {
      registry = TestBed.inject(ThemeRegistryService);
      tracker = TestBed.inject(ThemeTrackingService);
      service = TestBed.inject(ThemeService);
    });

    it('should stop reacting to storage and route changes after destruction', () => {
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      flush();

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();

      TestBed.resetTestingModule();

      storageChanges$.next({
        key: storageKey,
        oldValue: 'dark',
        newValue: 'light',
      });

      const params = convertToParamMap({
        [queryParam]: 'light',
      });

      activatedRoute.snapshot.queryParamMap = params;
      routeParams$.next(params);

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
