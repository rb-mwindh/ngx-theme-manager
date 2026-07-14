import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-theming',
  template: '',
  styleUrls: ['./theme-a.scss', './theme-b.scss', './theme-c.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class AppThemingComponent {}
