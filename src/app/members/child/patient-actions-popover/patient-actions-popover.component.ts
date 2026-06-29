import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-patient-actions-popover',
  templateUrl: './patient-actions-popover.component.html',
  styleUrls: ['./patient-actions-popover.component.scss'],
})
export class PatientActionsPopoverComponent {
  @Input() canEdit: boolean;
  @Input() canMessage: boolean;
  @Input() canCall: boolean;
  @Input() canDelete: boolean;

  constructor(private popoverController: PopoverController) {}

  selectAction(action: string) {
    this.popoverController.dismiss(action);
  }
}
