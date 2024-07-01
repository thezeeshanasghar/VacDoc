import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddschedulePage } from './addschedule.page';

describe('AddschedulePage', () => {
  let component: AddschedulePage;
  let fixture: ComponentFixture<AddschedulePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddschedulePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddschedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
