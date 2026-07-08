import { Component } from '@angular/core';
import { PopoverController } from '@ionic/angular';

// Small menu anchored to the print icon, offering the two PDF variants.
// Dismisses with the chosen option; the caller acts on the returned value.
@Component({
  selector: 'app-pdf-options-popover',
  templateUrl: './pdf-options-popover.component.html',
  styleUrls: ['./pdf-options-popover.component.scss'],
})
export class PdfOptionsPopoverComponent {
  constructor(private popoverController: PopoverController) {}

  choose(includeFuture: boolean) {
    this.popoverController.dismiss({ includeFuture });
  }
}
