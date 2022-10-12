import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BirthdayAlertPage } from './birthday-alert.page';

describe('BirthdayAlertPage', () => {
  let component: BirthdayAlertPage;
  let fixture: ComponentFixture<BirthdayAlertPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BirthdayAlertPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BirthdayAlertPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
