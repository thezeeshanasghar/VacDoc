import { Component, OnInit } from "@angular/core";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-sms-setting",
  templateUrl: "./sms-setting.page.html",
  styleUrls: ["./sms-setting.page.scss"]
})
export class SMSSettingPage implements OnInit {
  constructor(private storage: Storage, private toastService: ToastService) {}

  ngOnInit() {}

  webSMS() {
    this.storage.set(environment.SMS, 0);
    this.toastService.create("successfully Change");
  }
  simSMS() {
    this.storage.set(environment.SMS, 1);
    this.toastService.create("successfully Change");
  }
}
