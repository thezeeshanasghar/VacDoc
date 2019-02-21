import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowUpPage } from './follow-up.page';

describe('FollowUpPage', () => {
  let component: FollowUpPage;
  let fixture: ComponentFixture<FollowUpPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowUpPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowUpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
