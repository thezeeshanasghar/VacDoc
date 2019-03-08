import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillPage } from './fill.page';

describe('FillPage', () => {
  let component: FillPage;
  let fixture: ComponentFixture<FillPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FillPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FillPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
