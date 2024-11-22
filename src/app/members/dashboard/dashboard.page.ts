import { Component, OnInit } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import {IonRouterOutlet, Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { App } = Plugins;


@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"]
})
export class DashboardPage implements OnInit {
  Clinics: any = [];
  clinic: any;
  doctorId: any;
  NewClinics: any = [];
  DelClinics: any = [];
  Messages: any = [];
  constructor(
    private loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    public platform: Platform,
    private routerOutlet: IonRouterOutlet
  ) { }

 async ngOnInit() {
  
  await this.storage.get(environment.DOCTOR_Id).then(docId => {
    this.doctorId = docId;
  });

  await this.storage.get(environment.ON_CLINIC).then(clinic => {
       this.clinic = clinic;
       if (this.clinic)
       {
        this.clinicService.updateClinic(this.clinic)
       }
       else{
         this.getClinics();
       }
     });

    //  var today  = Date.now();
    //  this.storage.get(environment.MESSAGES).then(messages => {messages==null?"": this.Messages = messages
    // });
    
    // if (this.Messages != null){
    //    console.log("called");
    //    this.Messages = this.Messages.filter(x=> (this.datediff(x.created , today) < 30));  //2505600000
    //    this.storage.set(environment.MESSAGES , this.Messages);
    //  }
  }
  async ionViewDidEnter(){
   // console.log(this.clinicService.clinics);  
   
    this.storage.set(environment.SMS, 1);
    if(!this.platform.is('desktop') && !this.platform.is('mobileweb')) {
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
        result => {
          if(!result.hasPermission){
            this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
          }
        }
      );
    }
   
  }

   datediff(first, second) {
     console.log(Math.round((second-first)/(1000*60*60*24)));
    return Math.round((second-first)/(1000*60*60*24));
}
  async getClinics() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();

    await this.clinicService.getClinics(this.doctorId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.Clinics = res.ResponseData;
          console.log( this.Clinics)
          this.storage.set(environment.CLINICS, this.Clinics);
          for (let i = 0; i < this.Clinics.length; i++) {
            if (this.Clinics[i].IsOnline) {
              this.storage.set(
                environment.CLINIC_Id,
                this.Clinics[i].Id
              );
              this.storage.set(
                environment.ON_CLINIC,
                this.Clinics[i]
              );
              this.clinicService.updateClinic(this.Clinics[i])
            }
          }
          //  this.ngOnInit();
        } else {
          loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  async uploadata() {
   
    
  }
  async getChildren() {
    console.log("Fetching children for the current month...");
    const loading = await this.loadingController.create({ message: "Loading Children..." });
    await loading.present();
  
    this.dashboardService.getThisMonthChild().subscribe(
      res => {
        loading.dismiss();
        if (res && res.CurrentMonthChildCount !== undefined) {
          console.log("Response received:", res);
          this.Children = res.CurrentMonthChildCount;
          console.log("Current Month Child Count:", this.Children);
        }
         else {
          console.error("Unexpected response format:", res);
          this.toastService.create("Failed to fetch child data", "danger");
        }
      },
      err => {
        loading.dismiss();
        console.error("Error while fetching data:", err);
        this.toastService.create("Error fetching child data", "danger");
      }
    );
  }
  }
}

