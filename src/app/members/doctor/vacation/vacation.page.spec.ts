import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationPage } from './vacation.page';

describe('VacationPage', () => {
  let component: VacationPage;
  let fixture: ComponentFixture<VacationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VacationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VacationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
