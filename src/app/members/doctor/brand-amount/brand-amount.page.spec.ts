import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandAmountPage } from './brand-amount.page';

describe('BrandAmountPage', () => {
  let component: BrandAmountPage;
  let fixture: ComponentFixture<BrandAmountPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandAmountPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandAmountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
