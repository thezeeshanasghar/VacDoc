import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkPage } from './bulk.page';

describe('BulkPage', () => {
  let component: BulkPage;
  let fixture: ComponentFixture<BulkPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BulkPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BulkPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
