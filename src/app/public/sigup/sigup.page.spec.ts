import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SigupPage } from './sigup.page';

describe('SigupPage', () => {
  let component: SigupPage;
  let fixture: ComponentFixture<SigupPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SigupPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SigupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
