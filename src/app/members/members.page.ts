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
    },
    {
      title: 'Brand Inventory',
      url: '/members/doctor/brand-inventory',
      icon: 'locate'
    },
    {
      title: 'Brand Amount',
      url: '/members/doctor/brand-amount',
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
    this.storage.clear();
  }
}
