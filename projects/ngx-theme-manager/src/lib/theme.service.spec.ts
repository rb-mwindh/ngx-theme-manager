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

interface TestConfiguration {
  storageKey?: string | null;
  queryParam?: string | null;
  provideRouter?: boolean;
  provideActivatedRoute?: boolean;
}

describe('ThemeService', () => {
  const storageKey = 'test/current-theme';
  const queryParam = 'theme';

  const darkTheme: Theme = {
    id: 'dark',
    displayName: 'Dark',
  };

  const lightTheme: Theme = {
    id: 'light',
    displayName: 'Light',
  };

  const defaultTheme: Theme = {
    id: 'default',
    displayName: 'Default',
    defaultTheme: true,
  };

  let service: ThemeService;
  let registry: ThemeRegistryService;
  let tracker: ThemeTrackingService;

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

  let subscriptions: Subscription[];

  beforeEach(() => {
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

    subscriptions = [];

    configureTestingModule();
  });

  afterEach(() => {
    subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });

    storageChanges$.complete();
    routeParams$.complete();

    jest.restoreAllMocks();
  });

  function configureTestingModule(
    configuration: TestConfiguration = {},
  ): void {
    const {
      storageKey: configuredStorageKey = storageKey,
      queryParam: configuredQueryParam = queryParam,
      provideRouter = true,
      provideActivatedRoute = true,
    } = configuration;

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        ThemeRegistryService,
        ThemeTrackingService,
        {
          provide: ThemeStyleManagerService,
          useValue: manager,
        },
        {
          provide: StorageService,
          useValue: storage,
        },
        {
          provide: STORAGE_KEY,
          useValue: configuredStorageKey,
        },
        {
          provide: QUERY_PARAM,
          useValue: configuredQueryParam,
        },
        ...(provideActivatedRoute
          ? [
            {
              provide: ActivatedRoute,
              useValue: activatedRoute,
            },
          ]
          : []),
        ...(provideRouter
          ? [
            {
              provide: Router,
              useValue: router,
            },
          ]
          : []),
      ],
    });
  }

  function reconfigureTestingModule(
    configuration: TestConfiguration,
  ): void {
    TestBed.resetTestingModule();
    configureTestingModule(configuration);
  }

  function injectDependencies(): void {
    registry = TestBed.inject(ThemeRegistryService);
    tracker = TestBed.inject(ThemeTrackingService);
  }

  function createService(
    themes: Theme[] = [],
  ): ThemeService {
    injectDependencies();

    registry.registerAll(themes);

    service = TestBed.inject(ThemeService);

    return service;
  }

  function setRouteTheme(
    theme: string | null,
    emit = true,
  ): void {
    const parameters =
      theme === null
        ? {}
        : {
          [queryParam]: theme,
        };

    const paramMap = convertToParamMap(parameters);

    activatedRoute.snapshot.queryParamMap = paramMap;

    if (emit) {
      routeParams$.next(paramMap);
    }
  }

  function emitStorageChange(
    newValue: string | null,
    key = storageKey,
  ): void {
    storageChanges$.next({
      key,
      oldValue: null,
      newValue,
    });
  }

  it('should create', () => {
    createService();

    expect(service).toBeDefined();
  });

  describe('public state API', () => {
    it('should expose the registered themes as a signal', () => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.themes()).toEqual([
        darkTheme,
        lightTheme,
      ]);
    });

    it('should update the themes signal when a theme is registered', () => {
      createService([darkTheme]);

      registry.register(lightTheme);

      expect(service.themes()).toEqual([
        darkTheme,
        lightTheme,
      ]);
    });

    it('should expose the registered themes as an observable', () => {
      const emissions: Array<Theme[]> = [];

      createService([darkTheme]);

      subscriptions.push(
        service.themes$.subscribe((themes) => {
          emissions.push(themes);
        }),
      );

      registry.register(lightTheme);

      expect(emissions).toEqual([
        [darkTheme],
        [
          darkTheme,
          lightTheme,
        ],
      ]);
    });

    it('should expose the current theme as a signal', () => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
    });

    it('should expose the current theme as an observable', () => {
      const emissions: Array<string | null> = [];

      createService([
        darkTheme,
        lightTheme,
      ]);

      subscriptions.push(
        service.currentTheme$.subscribe((theme) => {
          emissions.push(theme);
        }),
      );

      service.selectTheme('light');

      expect(emissions).toEqual([
        'dark',
        'light',
      ]);
    });

    it('should expose the registry signal instance', () => {
      createService();

      expect(service.themes).toBe(registry.themes);
    });

    it('should expose the tracking signal instance', () => {
      createService();

      expect(service.currentTheme).toBe(
        tracker.currentTheme,
      );
    });
  });

  describe('initial theme selection', () => {
    it('should prefer the theme from the route', () => {
      setRouteTheme('light', false);
      storage.getItem.mockReturnValue('dark');

      createService([
        darkTheme,
        lightTheme,
        defaultTheme,
      ]);

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should use the stored theme when no route theme exists', () => {
      storage.getItem.mockReturnValue('light');

      createService([
        darkTheme,
        lightTheme,
        defaultTheme,
      ]);

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should use the default theme when route and storage are empty', () => {
      createService([
        darkTheme,
        defaultTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('default');
      expect(manager.use).toHaveBeenCalledWith('default');
    });

    it('should use the first theme when no default theme exists', () => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).toHaveBeenCalledWith('dark');
    });

    it('should ignore an unknown route theme', () => {
      setRouteTheme('unknown', false);

      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('dark');
    });

    it('should ignore an unknown stored theme', () => {
      storage.getItem.mockReturnValue('unknown');

      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('dark');
    });

    it('should prefer a valid stored theme over an invalid route theme', () => {
      setRouteTheme('unknown', false);
      storage.getItem.mockReturnValue('light');

      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('light');
    });

    it('should not select a theme while the registry is empty', () => {
      createService();

      expect(service.currentTheme()).toBeNull();
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should select the first theme registered after service creation', () => {
      createService();

      registry.register(darkTheme);

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).toHaveBeenCalledWith('dark');
    });

    it('should initialize only once', () => {
      createService();

      registry.register(darkTheme);
      registry.register(lightTheme);

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).toHaveBeenCalledTimes(1);
      expect(manager.use).toHaveBeenCalledWith('dark');
    });

    it('should retain an already selected theme', () => {
      injectDependencies();

      tracker.setCurrentTheme('manual');
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      service = TestBed.inject(ThemeService);

      expect(service.currentTheme()).toBe('manual');
    });

    it('should synchronize an already selected theme on creation', () => {
      injectDependencies();

      tracker.setCurrentTheme('manual');
      registry.registerAll([
        darkTheme,
        lightTheme,
      ]);

      service = TestBed.inject(ThemeService);

      expect(manager.use).toHaveBeenCalledWith('manual');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'manual',
      );
    });
  });

  describe('selectTheme', () => {
    beforeEach(() => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a registered theme', () => {
      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
    });

    it('should activate the selected theme styles', () => {
      service.selectTheme('light');

      expect(manager.use).toHaveBeenCalledTimes(1);
      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should persist the selected theme', () => {
      service.selectTheme('light');

      expect(storage.setItem).toHaveBeenCalledTimes(1);
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
    });

    it('should update the configured route parameter', () => {
      service.selectTheme('light');

      expect(router.navigate).toHaveBeenCalledTimes(1);
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

    it('should not navigate when the route already contains the theme', () => {
      setRouteTheme('light', false);

      service.selectTheme('light');

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore an unknown theme', () => {
      service.selectTheme('unknown');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore repeated selection of the current theme', () => {
      service.selectTheme('dark');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should clear the current theme when null is selected', () => {
      service.selectTheme(null);

      expect(service.currentTheme()).toBeNull();
    });

    it('should not activate, persist or navigate when null is selected', () => {
      service.selectTheme(null);

      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('storage synchronization', () => {
    beforeEach(() => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a theme changed in storage', () => {
      emitStorageChange('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should ignore storage changes for a different key', () => {
      emitStorageChange('light', 'another-key');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should ignore an unknown stored theme', () => {
      emitStorageChange('unknown');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should clear the current theme when the stored value is removed', () => {
      emitStorageChange(null);

      expect(service.currentTheme()).toBeNull();
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should synchronize a valid storage change with the route', () => {
      emitStorageChange('light');

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

    it('should write a valid storage change back without causing duplicate state emissions', () => {
      const emissions: Array<string | null> = [];

      subscriptions.push(
        service.currentTheme$.subscribe((theme) => {
          emissions.push(theme);
        }),
      );

      emitStorageChange('light');

      expect(emissions).toEqual([
        'dark',
        'light',
      ]);

      expect(storage.setItem).toHaveBeenCalledTimes(1);
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
    });
  });

  describe('route synchronization', () => {
    beforeEach(() => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();
    });

    it('should select a theme changed through the route', () => {
      setRouteTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
    });

    it('should persist a theme changed through the route', () => {
      setRouteTheme('light');

      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
    });

    it('should not navigate again after a route change', () => {
      setRouteTheme('light');

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore an unknown route theme', () => {
      setRouteTheme('unknown');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore a missing route parameter', () => {
      setRouteTheme(null);

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore repeated route selection of the current theme', () => {
      setRouteTheme('dark');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('disabled synchronization', () => {
    it('should work when storage synchronization is disabled', () => {
      reconfigureTestingModule({
        storageKey: null,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      storage.getItem.mockClear();
      storage.setItem.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(storage.getItem).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it('should work when storage synchronization uses an empty key', () => {
      reconfigureTestingModule({
        storageKey: '',
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      storage.getItem.mockClear();
      storage.setItem.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(storage.getItem).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it('should not react to storage events when storage synchronization is disabled', () => {
      reconfigureTestingModule({
        storageKey: null,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();

      emitStorageChange('light');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
    });

    it('should work when route synchronization is disabled', () => {
      reconfigureTestingModule({
        queryParam: null,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      router.navigate.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should work when route synchronization uses an empty parameter name', () => {
      reconfigureTestingModule({
        queryParam: '',
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      router.navigate.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not react to route changes when route synchronization is disabled', () => {
      reconfigureTestingModule({
        queryParam: null,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();

      setRouteTheme('light');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
    });
  });

  describe('optional router integration', () => {
    it('should work without Router and ActivatedRoute', () => {
      reconfigureTestingModule({
        provideRouter: false,
        provideActivatedRoute: false,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should work without Router', () => {
      reconfigureTestingModule({
        provideRouter: false,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should work without ActivatedRoute', () => {
      reconfigureTestingModule({
        provideActivatedRoute: false,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();

      service.selectTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
      expect(storage.setItem).toHaveBeenCalledWith(
        storageKey,
        'light',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should still resolve the stored theme without router services', () => {
      storage.getItem.mockReturnValue('light');

      reconfigureTestingModule({
        provideRouter: false,
        provideActivatedRoute: false,
      });

      createService([
        darkTheme,
        lightTheme,
      ]);

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).toHaveBeenCalledWith('light');
    });
  });

  describe('destruction', () => {
    beforeEach(() => {
      createService([
        darkTheme,
        lightTheme,
      ]);

      manager.use.mockClear();
      storage.setItem.mockClear();
      router.navigate.mockClear();

      service.ngOnDestroy();
    });

    it('should stop reacting to storage changes', () => {
      emitStorageChange('light');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should stop reacting to route changes', () => {
      setRouteTheme('light');

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should stop synchronizing direct tracker changes', () => {
      tracker.setCurrentTheme('light');

      expect(service.currentTheme()).toBe('light');
      expect(manager.use).not.toHaveBeenCalled();
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not initialize after destruction', () => {
      const emptyRegistryService =
        TestBed.inject(ThemeRegistryService);

      emptyRegistryService.register({
        id: 'another',
        displayName: 'Another',
      });

      expect(service.currentTheme()).toBe('dark');
      expect(manager.use).not.toHaveBeenCalled();
    });
  });
});
