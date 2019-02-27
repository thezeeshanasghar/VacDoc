import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicePage } from './invoice.page';

describe('InvoicePage', () => {
  let component: InvoicePage;
  let fixture: ComponentFixture<InvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoicePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
