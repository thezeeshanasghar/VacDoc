import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddfollowupPage } from './addfollowup.page';

describe('AddfollowupPage', () => {
  let component: AddfollowupPage;
  let fixture: ComponentFixture<AddfollowupPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddfollowupPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddfollowupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
