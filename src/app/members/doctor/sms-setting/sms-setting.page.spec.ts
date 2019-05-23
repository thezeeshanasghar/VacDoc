import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SMSSettingPage } from './sms-setting.page';

describe('SMSSettingPage', () => {
  let component: SMSSettingPage;
  let fixture: ComponentFixture<SMSSettingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SMSSettingPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SMSSettingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
