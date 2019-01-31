import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ClinicService } from '../services/clinic.service';
import { ToastService } from '../shared/toast.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-clinic-info',
  templateUrl: './clinic-info.page.html',
  styleUrls: ['./clinic-info.page.scss'],
})
export class ClinicInfoPage implements OnInit {

  clinics:any
  constructor(
    public loadingController: LoadingController,
    private api : ClinicService,
    private toast: ToastService,
    private storage: Storage,
  ) { }

  ngOnInit() {
    this.storage.get("DoctorID").then((val) => {
      this.getClin(val);
    });
  }

  async getClin(id) {
    const loading = await this.loadingController.create({
      message: 'Loading'
    });

    await loading.present();

    await this.api.getClinic(id).subscribe(
      res => {
        if (res.IsSuccess){
          this.clinics = res.ResponseData;
          console.log(this.clinics)
          loading.dismiss();
        }
        else{
          loading.dismiss();
          this.toast.create(res.Message);
        }
      },
      err => {
        loading.dismiss();
        this.toast.create(err);
      }
    );
  }
}
