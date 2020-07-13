import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  toast: HTMLIonToastElement;

  constructor(public toastCtrl: ToastController) { }

  async create(message: string, color = "success", ok = false, duration = 3000) {
    if (this.toast) {
      this.toast.dismiss();
    }

    this.toast = await this.toastCtrl.create({
      message,
      color: color,
      duration: ok ? null : duration,
      position: 'bottom',
      // showCloseButton: ok,
      // closeButtonText: 'OK'
    });
    this.toast.present();
  }

}
