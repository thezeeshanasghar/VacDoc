import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowupPage } from './followup.page';

describe('FollowupPage', () => {
  let component: FollowupPage;
  let fixture: ComponentFixture<FollowupPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowupPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
