import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildPage } from './child.page';

describe('ChildPage', () => {
  let component: ChildPage;
  let fixture: ComponentFixture<ChildPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
