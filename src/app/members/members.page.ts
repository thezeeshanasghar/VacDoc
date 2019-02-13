import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ClinicService } from '../services/clinic.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
})
export class MembersPage implements OnInit {

  doctorID: any;
  clinicID: any;
  public appPages = [
    {
      title: 'Dashboard',
      url: '/members/dashboard',
      icon: 'home'
    },
    {
      title: 'Alerts',
      url: '/members/alert',
      icon: 'alert'
    },
    {
      title: 'Messages',
      url: '/members/message',
      icon: 'mail'
    },

  ];

  public doctorPages = [
    {
      title: 'Clinic',
      url: '/members/doctor/clinic',
      icon: 'moon'
    },
    {
      title: 'Edit Profile',
      url: '/members/doctor/profile',
      icon: 'create'
    },
    {
      title: 'Schedule',
      url: '/members/doctor/schedule',
      icon: 'recording'
    },
    {
      title: 'Vacation',
      url: '/members/doctor/vacation',
      icon: 'locate'
    }
  ];

  public childPages = [
    {
      title: 'Patients',
      url: '/members/child',
      icon: 'man'
    },
    {
      title: 'Add',
      url: '/members/child/add',
      icon: 'person-add'
    },
  ]

  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private clinicService: ClinicService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
  }
  clearStorage() {
    this.setOnlineClinic();
    this.storage.clear();
  }
  async setOnlineClinic() {
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorID = val;
    });

    this.storage.get(environment.CLINIC_ID).then((res) => {
      this.clinicID = res;
    });
    const loading = await this.loadingController.create({ message: 'Loading' });
    await loading.present();

    let data = { 'DoctorID': this.doctorID, 'ID': this.clinicID, 'IsOnline': 'false' }
    await this.clinicService.changeOnlineClinic(data)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message)
        }


      }, (err) => {
        loading.dismiss();
        this.toastService.create(err);
      });
  }
}
