import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-audit-popover',
  templateUrl: './audit-popover.component.html',
  styleUrls: ['./audit-popover.component.scss'],
})
export class AuditPopoverComponent {
  @Input() vaccine: any;

  constructor(private popoverController: PopoverController) {}

  dismiss() { this.popoverController.dismiss(); }
}
