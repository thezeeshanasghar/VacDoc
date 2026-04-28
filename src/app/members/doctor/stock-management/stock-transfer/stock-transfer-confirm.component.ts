import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-stock-transfer-confirm',
  templateUrl: './stock-transfer-confirm.component.html'
})
export class StockTransferConfirmComponent {
  @Input() fromClinicName: string;
  @Input() toClinicName: string;
  @Input() transferRows: any[];
  @Input() totalTransferValue: number;

  constructor(private modalCtrl: ModalController) {}

  cancel() {
    this.modalCtrl.dismiss({ confirmed: false });
  }

  confirm() {
    this.modalCtrl.dismiss({ confirmed: true });
  }
}
