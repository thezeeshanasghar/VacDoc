import { Component, OnInit } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ToastService } from "src/app/shared/toast.service";
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

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
  constructor(
    private loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions
  ) {}

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
     
  }
  async ionViewDidEnter(){
   // console.log(this.clinicService.clinics);
  
    this.storage.set(environment.SMS, 0);
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS).then(
      result => {
        if(!result.hasPermission){
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.SEND_SMS);
        }
      }
    );
  }
  async getClinics() {
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();

    await this.clinicService.getClinics(this.doctorId).subscribe(
      res => {
        loading.dismiss();
        if (res.IsSuccess) {
          this.Clinics = res.ResponseData;
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
    // await this.storage.get(environment.CLINICS).then(clinics => {
    //   this.clinics = clinics;
    // });
    // console.log(this.clinics);
    // for new clinics
  //   this.clinicService.clinics.forEach(item => {
  //     if (!item.Id && !item.Isdeleted) this.NewClinics.push(item);
  //     if (item.Id && item.Isdeleted) this.DelClinics.push(item);
  //   });
  //   console.log(this.NewClinics);
  //   console.log(this.DelClinics);
  //   const loading = await this.loadingController.create({
  //     message: "Loading"
  //   });
  //   await loading.present();
  //   if (this.NewClinics.length > 0) {
  //     this.NewClinics.forEach(element => {
  //       this.addNewClinic(element);
  //     });
  //   }
  //   if (this.DelClinics.length > 0) {
  //     this.DelClinics.forEach(element => {
  //       this.deleteClinic(element.Id);
  //     });
  //   }
  //   this.clinicService.getClinics(this.clinicService.doctorId);
  //   loading.dismiss();
  //   this.toastService.create("successfully added");
  // }

  // async addNewClinic(data) {
    
  //     console.log(data);
  //     this.toastService.create("successfully added");
  //     await this.clinicService.addClinic(data).subscribe(
  //       res => {
  //         if (res.IsSuccess) {
  //           // this.toastService.create("successfully added");
  //         } else {
  //           //  loading.dismiss();
  //           //  this.toastService.create(res.Message, "danger");
  //         }
  //       },
  //       err => {
  //         //  loading.dismiss();
  //         this.toastService.create(err, "danger");
  //       }
  //     );
    
  }

  async deleteClinic(id) {
    // const loading = await this.loadingController.create({
    //   message: "Loading"
    // });
    // await loading.present();
    this.storage.set(environment.CLINICS, this.Clinics);
    // loading.dismiss();

    await this.clinicService.deleteClinic(id).subscribe(
      res => {
        if (res.IsSuccess) {
          // loading.dismiss();
        } else {
          // loading.dismiss();
          this.toastService.create(res.Message, "danger");
        }
      },
      err => {
        // loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
}
