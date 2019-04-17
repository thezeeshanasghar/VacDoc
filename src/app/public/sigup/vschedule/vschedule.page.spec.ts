import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VschedulePage } from './vschedule.page';

describe('VschedulePage', () => {
  let component: VschedulePage;
  let fixture: ComponentFixture<VschedulePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VschedulePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VschedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
