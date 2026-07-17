import { Component } from '@angular/core';
import { PopoverController } from '@ionic/angular';

// Shown when "Customize" is picked on Add Child, only if the doctor has
// the "Allow Adult and Pregnancy" permission. Dismisses with the choice;
// the caller acts on the returned value.
@Component({
  selector: 'app-schedule-type-popover',
  templateUrl: './schedule-type-popover.component.html',
  styleUrls: ['./schedule-type-popover.component.scss'],
})
export class ScheduleTypePopoverComponent {
  constructor(private popoverController: PopoverController) {}

  choose(type: 'adult' | 'pregnancy' | 'blank') {
    this.popoverController.dismiss({ type });
  }
}
