import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CMsgPage } from './cmsg.page';

describe('CMsgPage', () => {
  let component: CMsgPage;
  let fixture: ComponentFixture<CMsgPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CMsgPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CMsgPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
