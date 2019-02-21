import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VaccineAlertPage } from './vaccine-alert.page';

describe('VaccineAlertPage', () => {
  let component: VaccineAlertPage;
  let fixture: ComponentFixture<VaccineAlertPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VaccineAlertPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VaccineAlertPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
