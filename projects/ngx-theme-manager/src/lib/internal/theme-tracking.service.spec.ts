import { TestBed } from "@angular/core/testing";
import { ThemeTrackingService } from "./theme-tracking.service";

describe('ThemeTrackingService', () => {
  let service: ThemeTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeTrackingService],
    });

    service = TestBed.inject(ThemeTrackingService);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  describe('currentTheme', () => {
    it('should initially be null', () => {
      expect(service.currentTheme()).toBeNull();
    });

    it('should return the currently selected theme', () => {
      service.setCurrentTheme('dark');

      expect(service.currentTheme()).toBe('dark');
    });

    it('should update synchronously', () => {
      service.setCurrentTheme('dark');

      expect(service.currentTheme()).toBe('dark');

      service.setCurrentTheme('light');

      expect(service.currentTheme()).toBe('light');
    });

    it('should support clearing the current theme', () => {
      service.setCurrentTheme('dark');
      service.setCurrentTheme(null);

      expect(service.currentTheme()).toBeNull();
    });
  });

  describe('currentTheme$', () => {
    it('should initially emit null', () => {
      const next = jest.fn();

      const subscription = service.currentTheme$.subscribe(next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(null);

      subscription.unsubscribe();
    });

    it('should emit the currently selected theme', () => {
      const emittedThemes: Array<string | null> = [];

      const subscription = service.currentTheme$.subscribe((theme) => {
        emittedThemes.push(theme);
      });

      service.setCurrentTheme('dark');

      expect(emittedThemes).toEqual([
        null,
        'dark',
      ]);

      subscription.unsubscribe();
    });

    it('should immediately emit the current theme to late subscribers', () => {
      service.setCurrentTheme('dark');

      const next = jest.fn();
      const subscription = service.currentTheme$.subscribe(next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith('dark');

      subscription.unsubscribe();
    });

    it('should emit subsequent theme changes', () => {
      const emittedThemes: Array<string | null> = [];

      const subscription = service.currentTheme$.subscribe((theme) => {
        emittedThemes.push(theme);
      });

      service.setCurrentTheme('dark');
      service.setCurrentTheme('light');
      service.setCurrentTheme(null);

      expect(emittedThemes).toEqual([
        null,
        'dark',
        'light',
        null,
      ]);

      subscription.unsubscribe();
    });

    it('should not emit the same theme twice in a row', () => {
      const emittedThemes: Array<string | null> = [];

      const subscription = service.currentTheme$.subscribe((theme) => {
        emittedThemes.push(theme);
      });

      service.setCurrentTheme('dark');
      service.setCurrentTheme('dark');
      service.setCurrentTheme('light');
      service.setCurrentTheme('light');

      expect(emittedThemes).toEqual([
        null,
        'dark',
        'light',
      ]);

      subscription.unsubscribe();
    });

    it('should provide the same state to multiple subscribers', () => {
      const firstSubscriber = jest.fn();
      const secondSubscriber = jest.fn();

      const firstSubscription =
        service.currentTheme$.subscribe(firstSubscriber);

      service.setCurrentTheme('dark');

      const secondSubscription =
        service.currentTheme$.subscribe(secondSubscriber);

      service.setCurrentTheme('light');

      expect(firstSubscriber.mock.calls).toEqual([
        [null],
        ['dark'],
        ['light'],
      ]);

      expect(secondSubscriber.mock.calls).toEqual([
        ['dark'],
        ['light'],
      ]);

      firstSubscription.unsubscribe();
      secondSubscription.unsubscribe();
    });
  });

  describe('setCurrentTheme', () => {
    it('should update both the signal and the observable', () => {
      const emittedThemes: Array<string | null> = [];

      const subscription = service.currentTheme$.subscribe((theme) => {
        emittedThemes.push(theme);
      });

      service.setCurrentTheme('dark');

      expect(service.currentTheme()).toBe('dark');
      expect(emittedThemes).toEqual([
        null,
        'dark',
      ]);

      subscription.unsubscribe();
    });

    it('should not publish an unchanged value', () => {
      const next = jest.fn();

      service.setCurrentTheme('dark');

      const subscription = service.currentTheme$.subscribe(next);

      service.setCurrentTheme('dark');

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith('dark');

      subscription.unsubscribe();
    });
  });
});
