import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CinfoPage } from './cinfo.page';

describe('CinfoPage', () => {
  let component: CinfoPage;
  let fixture: ComponentFixture<CinfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CinfoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
