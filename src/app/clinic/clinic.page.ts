import { Component, OnInit } from '@angular/core';
import { ClinicService } from '../services/clinic.service';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clinic',
  templateUrl: './clinic.page.html',
  styleUrls: ['./clinic.page.scss'],
})
export class ClinicPage implements OnInit {

  clinics: any;
  constructor(
    private api: ClinicService,
    private storage: Storage,
    private loadingController: LoadingController,
    private router: Router
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

        this.clinics = res.ResponseData;
        console.log(this.clinics)
        loading.dismiss();
      },
      err => {
        console.log(err);
        loading.dismiss();
      }
    );
  }

  movehomepage(id){
    this.storage.set('ClinicID', id);
    this.router.navigate(['/home']);
  }
}
