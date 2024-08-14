import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialCasePage } from './specialCase.page';

describe('SpecialCasePage', () => {
  let component: SpecialCasePage;
  let fixture: ComponentFixture<SpecialCasePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecialCasePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialCasePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
