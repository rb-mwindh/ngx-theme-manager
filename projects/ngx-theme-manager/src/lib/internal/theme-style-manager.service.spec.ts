import { ContentObserver } from "@angular/cdk/observers";
import { DOCUMENT } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { ThemeRegistryService } from "./theme-registry.service";
import {
  applyThemeIdentifier,
  extractThemeAnnotations,
  ThemeStyleManagerService,
  turnOff,
  turnOn,
  unwrap
} from "./theme-style-manager.service";

describe('ThemeStyleManagerService', () => {
  let document: Document;
  let observerChanges$: Subject<MutationRecord[]>;
  let contentObserver: {
    observe: jest.Mock;
  };
  let themeRegistry: {
    registerAll: jest.Mock;
  };

  beforeEach(() => {
    observerChanges$ = new Subject<MutationRecord[]>();

    contentObserver = {
      observe: jest.fn().mockReturnValue(observerChanges$),
    };

    themeRegistry = {
      registerAll: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeStyleManagerService,
        {
          provide: ContentObserver,
          useValue: contentObserver,
        },
        {
          provide: ThemeRegistryService,
          useValue: themeRegistry,
        },
      ],
    });

    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document.head
      .querySelectorAll(
        'style[data-test-theme-style-manager]',
      )
      .forEach((element) => {
        element.remove();
      });

    observerChanges$.complete();
  });

  function createStyle(
    content: string,
    attributes: Record<string, string> = {},
  ): HTMLStyleElement {
    const element = document.createElement('style');

    element.setAttribute(
      'data-test-theme-style-manager',
      '',
    );

    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });

    element.textContent = content;
    document.head.appendChild(element);

    return element;
  }

  function createService(): ThemeStyleManagerService {
    return TestBed.inject(ThemeStyleManagerService);
  }

  it('should create', () => {
    const service = createService();

    expect(service).toBeDefined();
  });

  it('should observe the document head', () => {
    createService();

    expect(contentObserver.observe).toHaveBeenCalledTimes(1);
    expect(contentObserver.observe).toHaveBeenCalledWith(
      document.head,
    );
  });

  it('should scan existing style elements on creation', () => {
    const style = createStyle(`
      /*
       * @@id dark
       * @@displayName Dark
       */
    `);

    createService();

    expect(style.getAttribute('data-theme')).toBe('dark');
    expect(style.hasAttribute('data-no-theme')).toBe(false);
    expect(style.media).toBe('none');

    expect(themeRegistry.registerAll).toHaveBeenCalledTimes(1);
    expect(themeRegistry.registerAll).toHaveBeenCalledWith([
      {
        id: 'dark',
        displayName: 'Dark',
        description: undefined,
        defaultTheme: false,
      },
    ]);
  });

  it('should scan newly added style elements after a content change', () => {
    createService();

    themeRegistry.registerAll.mockClear();

    const style = createStyle(`
      /*
       * @@id light
       * @@displayName Light
       */
    `);

    observerChanges$.next([
      { addedNodes: [style] } as unknown as MutationRecord,
    ]);

    expect(style.getAttribute('data-theme')).toBe('light');
    expect(style.media).toBe('none');

    expect(themeRegistry.registerAll).toHaveBeenCalledTimes(1);
    expect(themeRegistry.registerAll).toHaveBeenCalledWith([
      {
        id: 'light',
        displayName: 'Light',
        description: undefined,
        defaultTheme: false,
      },
    ]);
  });

  it('should register multiple newly discovered themes together', () => {
    createStyle(`
      /*
       * @@id dark
       * @@displayName Dark
       */
    `);

    createStyle(`
      /*
       * @@id light
       * @@displayName Light
       * @@default
       */
    `);

    createService();

    expect(themeRegistry.registerAll).toHaveBeenCalledTimes(1);
    expect(themeRegistry.registerAll).toHaveBeenCalledWith([
      {
        id: 'dark',
        displayName: 'Dark',
        description: undefined,
        defaultTheme: false,
      },
      {
        id: 'light',
        displayName: 'Light',
        description: undefined,
        defaultTheme: true,
      },
    ]);
  });

  it('should mark styles without theme annotations as non-theme styles', () => {
    const style = createStyle(`
      body {
        color: black;
      }
    `);

    createService();

    expect(style.hasAttribute('data-theme')).toBe(false);
    expect(style.hasAttribute('data-no-theme')).toBe(true);

    expect(themeRegistry.registerAll).toHaveBeenCalledWith([]);
  });

  it('should not process an already identified theme style again', () => {
    const style = createStyle(
      `
        /*
         * @@id dark
         * @@displayName Dark
         */
      `,
      {
        'data-theme': 'dark',
      },
    );

    createService();

    expect(style.getAttribute('data-theme')).toBe('dark');
    expect(themeRegistry.registerAll).toHaveBeenCalledWith([]);
  });

  it('should not process a style marked as a non-theme again', () => {
    const style = createStyle(
      `
        /*
         * @@id dark
         */
      `,
      {
        'data-no-theme': '',
      },
    );

    createService();

    expect(style.hasAttribute('data-theme')).toBe(false);
    expect(style.hasAttribute('data-no-theme')).toBe(true);
    expect(themeRegistry.registerAll).toHaveBeenCalledWith([]);
  });

  it('should stop reacting to observer changes after destruction', () => {
    createService();

    themeRegistry.registerAll.mockClear();

    const style = createStyle(`
      /*
       * @@id dark
       */
    `);

    TestBed.resetTestingModule();
    observerChanges$.next([]);

    expect(style.hasAttribute('data-theme')).toBe(false);
    expect(themeRegistry.registerAll).not.toHaveBeenCalled();
  });

  describe('use', () => {
    it('should activate the selected theme', () => {
      const darkStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
          media: 'none',
        },
      );

      const lightStyle = createStyle(
        '',
        {
          'data-theme': 'light',
          media: 'none',
        },
      );

      const service = createService();

      service.use('dark');

      expect(darkStyle.hasAttribute('media')).toBe(false);
      expect(lightStyle.media).toBe('none');
    });

    it('should deactivate all themes except the selected theme', () => {
      const darkStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
        },
      );

      const lightStyle = createStyle(
        '',
        {
          'data-theme': 'light',
        },
      );

      const service = createService();

      service.use('light');

      expect(darkStyle.media).toBe('none');
      expect(lightStyle.hasAttribute('media')).toBe(false);
    });

    it('should activate all style elements belonging to the selected theme', () => {
      const firstDarkStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
          media: 'none',
        },
      );

      const secondDarkStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
          media: 'none',
        },
      );

      const lightStyle = createStyle(
        '',
        {
          'data-theme': 'light',
        },
      );

      const service = createService();

      service.use('dark');

      expect(firstDarkStyle.hasAttribute('media')).toBe(false);
      expect(secondDarkStyle.hasAttribute('media')).toBe(false);
      expect(lightStyle.media).toBe('none');
    });

    it('should deactivate all theme styles for an unknown theme', () => {
      const darkStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
        },
      );

      const lightStyle = createStyle(
        '',
        {
          'data-theme': 'light',
        },
      );

      const service = createService();

      service.use('unknown');

      expect(darkStyle.media).toBe('none');
      expect(lightStyle.media).toBe('none');
    });

    it('should process undiscovered styles before activating a theme', () => {
      const service = createService();

      themeRegistry.registerAll.mockClear();

      const darkStyle = createStyle(`
        /*
         * @@id dark
         * @@displayName Dark
         */
      `);

      service.use('dark');

      expect(darkStyle.getAttribute('data-theme')).toBe('dark');
      expect(darkStyle.hasAttribute('media')).toBe(false);

      expect(themeRegistry.registerAll).toHaveBeenCalledWith([
        {
          id: 'dark',
          displayName: 'Dark',
          description: undefined,
          defaultTheme: false,
        },
      ]);
    });

    it('should ignore non-theme style elements when activating a theme', () => {
      const regularStyle = createStyle(`
        body {
          color: black;
        }
      `);

      const themeStyle = createStyle(
        '',
        {
          'data-theme': 'dark',
          media: 'none',
        },
      );

      const service = createService();

      service.use('dark');

      expect(regularStyle.hasAttribute('media')).toBe(false);
      expect(regularStyle.hasAttribute('data-no-theme')).toBe(true);
      expect(themeStyle.hasAttribute('media')).toBe(false);
    });
  });
});

describe('applyThemeIdentifier', () => {
  let element: HTMLStyleElement;

  beforeEach(() => {
    element = document.createElement('style');
  });

  it('should apply the theme identifier', () => {
    const result = applyThemeIdentifier(element, 'dark');

    expect(result).toBe(true);
    expect(element.getAttribute('data-theme')).toBe('dark');
    expect(element.hasAttribute('data-no-theme')).toBe(false);
  });

  it('should mark the element as a non-theme without an identifier', () => {
    const result = applyThemeIdentifier(element);

    expect(result).toBe(false);
    expect(element.hasAttribute('data-theme')).toBe(false);
    expect(element.hasAttribute('data-no-theme')).toBe(true);
  });

  it('should mark the element as a non-theme for an empty identifier', () => {
    const result = applyThemeIdentifier(element, '');

    expect(result).toBe(false);
    expect(element.hasAttribute('data-theme')).toBe(false);
    expect(element.hasAttribute('data-no-theme')).toBe(true);
  });
});

describe('turnOff', () => {
  it('should set the media attribute to none', () => {
    const element = document.createElement('style');

    turnOff(element);

    expect(element.media).toBe('none');
    expect(element.getAttribute('media')).toBe('none');
  });
});

describe('turnOn', () => {
  it('should remove the media attribute', () => {
    const element = document.createElement('style');
    element.media = 'none';

    turnOn(element);

    expect(element.hasAttribute('media')).toBe(false);
    expect(element.media).toBe('');
  });
});

describe('extractThemeAnnotations', () => {
  it('should return null for undefined', () => {
    expect(extractThemeAnnotations(undefined)).toBeNull();
  });

  it('should return null for null', () => {
    expect(extractThemeAnnotations(null)).toBeNull();
  });

  it('should return null for an empty string', () => {
    expect(extractThemeAnnotations('')).toBeNull();
  });

  it('should return null without an id annotation', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@displayName Dark
         */
      `),
    ).toBeNull();
  });

  it('should extract the theme id', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@id dark
         */
      `),
    ).toEqual({
      id: 'dark',
      displayName: 'dark',
      description: undefined,
      defaultTheme: false,
    });
  });

  it('should extract all supported annotations', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@id dark
         * @@displayName Dark theme
         * @@description A dark application theme
         * @@default
         */
      `),
    ).toEqual({
      id: 'dark',
      displayName: 'Dark theme',
      description: 'A dark application theme',
      defaultTheme: true,
    });
  });

  it('should accept the defaultTheme annotation', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@id dark
         * @@defaultTheme
         */
      `),
    ).toEqual({
      id: 'dark',
      displayName: 'dark',
      description: undefined,
      defaultTheme: true,
    });
  });

  it('should use the id as display name when none is provided', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@id dark
         */
      `),
    ).toEqual({
      id: 'dark',
      displayName: 'dark',
      description: undefined,
      defaultTheme: false,
    });
  });

  it('should trim annotation values', () => {
    expect(
      extractThemeAnnotations(`
        /*
         * @@id       dark
         * @@displayName       Dark theme
         * @@description       Description
         */
      `),
    ).toEqual({
      id: 'dark',
      displayName: 'Dark theme',
      description: 'Description',
      defaultTheme: false,
    });
  });

  it('should only read annotation values until the end of the line', () => {
    expect(
      extractThemeAnnotations(
        [
          '@@id dark',
          '@@displayName Dark theme',
          '@@description First line',
          'Second line',
        ].join('\n'),
      ),
    ).toEqual({
      id: 'dark',
      displayName: 'Dark theme',
      description: 'First line',
      defaultTheme: false,
    });
  });
});

describe('unwrap', () => {
  it('should return the first captured group', () => {
    expect(unwrap(/@@id\s+(.+)/.exec('@@id dark'))).toBe(
      'dark',
    );
  });

  it('should trim the captured value', () => {
    expect(
      unwrap(/@@id\s+(.+)/.exec('@@id    dark   ')),
    ).toBe('dark');
  });

  it('should return undefined for null', () => {
    expect(unwrap(null)).toBeUndefined();
  });

  it('should return undefined for an empty captured value', () => {
    expect(unwrap(/(.*)/.exec(''))).toBeUndefined();
  });
});
