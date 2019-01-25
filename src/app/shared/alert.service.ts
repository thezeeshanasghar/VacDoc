import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private alertCtrl: AlertController) {
  }

  confirmAlert(message: string, header?: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const confirm = await this.alertCtrl.create({
        header: header || 'Confirm',
        message: message,
        buttons: [{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            confirm.dismiss().then(() => resolve(false));
            return false;
          }
        }, {
          text: 'Yes',
          handler: () => {
            confirm.dismiss().then(() => resolve(true));
            return false;
          }
        }]
      });
      return confirm.present();
    });
  }

  async simpleAlert(message: string, header?: string) {
    const alert = await this.alertCtrl.create({
      header: header || 'Alert',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
