import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
})
export class MembersPage implements OnInit {

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
      title: 'Doctors',
      url: '/members/doctor',
      icon: 'medkit'
    },
    {
      title: 'Patients',
      url: '/members/child',
      icon: 'man'
    },
    {
      title: 'Messages',
      url: '/members/message',
      icon: 'mail'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
