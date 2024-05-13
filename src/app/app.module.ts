import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { IonicStorageModule } from '@ionic/storage';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';
import { TitleCasePipe } from '@angular/common';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
//import {MatDatepickerModule} from '@angular/material/datepicker';
// import { MatFormFieldModule , MatInputModule } from '@angular/material';
//import { MatMomentDateModule } from "@angular/material-moment-adapter";

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    IonicStorageModule.forRoot(),
    NoopAnimationsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    // MatFormFieldModule,
    // MatInputModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    Geolocation,
    SMS,
    AndroidPermissions,
    TitleCasePipe,
    CallNumber,
    {provide: MAT_DATE_LOCALE, useValue: 'en-GB'}

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
