import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { AppThemingComponent } from './theming/app-theming.component';
import { AppThemePickerComponent } from './theming/app-theme-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    AppThemingComponent,
    AppThemePickerComponent,
  ],
  imports: [CommonModule, BrowserModule, RouterModule.forRoot([])],
  bootstrap: [AppComponent],
})
export class AppModule {}
