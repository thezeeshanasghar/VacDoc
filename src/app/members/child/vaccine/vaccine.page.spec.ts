import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VaccinePage } from './vaccine.page';

describe('VaccinePage', () => {
  let component: VaccinePage;
  let fixture: ComponentFixture<VaccinePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VaccinePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VaccinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
