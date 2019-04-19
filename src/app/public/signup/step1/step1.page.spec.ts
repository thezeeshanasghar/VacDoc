import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1Page } from './step1.page';

describe('Step1Page', () => {
  let component: Step1Page;
  let fixture: ComponentFixture<Step1Page>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Step1Page ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Step1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
