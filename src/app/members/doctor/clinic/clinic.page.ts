import { Component } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";
import { AlertService } from "src/app/shared/alert.service";

@Component({
  selector: "app-clinic",
  templateUrl: "./clinic.page.html",
  styleUrls: ["./clinic.page.scss"]
})
export class ClinicPage {
  //clinics: any;
 // dispclinics: any = [];
  //doctorId: number;
  //clinicId: any;
  onlineclinic: any;

  constructor(
    public loadingController: LoadingController,
    public clinicService: ClinicService,
    private toastService: ToastService,
    private storage: Storage,
    private router: Router,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    //  this.clinics = this.clinicService.clinics;
    // await this.storage.get(environment.DOCTOR_Id).then(docId => {
    //   this.doctorId = docId;
    // });
    // await this.storage.get(environment.CLINIC_Id).then(clinicId => {
    //   this.clinicId = clinicId;
    // });
    // await this.storage.get(environment.CLINICS).then(clinics => {
    //   this.clinics = clinics;
    // });
    console.log(this.clinicService.clinics);
    console.log(this.clinicService.doctorId);
   // if (!this.clinicService.clinics) this.getClinics();
  }

  // async getClinics() {
  //   const loading = await this.loadingController.create({ message: "Loading" });
  //   await loading.present();

  //   await this.clinicService.getClinics(this.doctorId).subscribe(
  //     res => {
  //       loading.dismiss();
  //       if (res.IsSuccess) {
  //         this.clinicService.clinics = res.ResponseData;
  //         this.storage.set(environment.CLINICS, this.clinicService.clinics);
  //         for (let i = 0; i < this.clinicService.clinics.length; i++) {
  //           if (this.clinicService.clinics[i].IsOnline) {
  //             this.storage.set(
  //               environment.CLINIC_Id,
  //               this.clinicService.clinics[i].Id
  //             );
  //           }
  //         }
  //         //  this.ngOnInit();
  //       } else {
  //         loading.dismiss();
  //         this.toastService.create(res.Message, "danger");
  //       }
  //     },
  //     err => {
  //       loading.dismiss();
  //       this.toastService.create(err, "danger");
  //     }
  //   );
  // }

  async setOnlineClinic(setclinicId) {
    if (!setclinicId)
      this.toastService.create("Synchronise Your Data to set Online", "danger");
    else {
      const loading = await this.loadingController.create({
        message: "Loading"
      });
      await loading.present();

      // set new online clinic
      this.onlineclinic = this.clinicService.clinics.find(
        x => x.Id === setclinicId
      );
      this.onlineclinic.IsOnline = true;
      let clinicindex = this.clinicService.clinics.findIndex(
        x => x.Id === setclinicId
      );
      this.clinicService.clinics.splice(clinicindex, 1, this.onlineclinic);

      // set previous clinic offline
      let clinic = await this.clinicService.clinics.find(
        x => x.Id === this.clinicService.OnlineClinicId
      );
      clinic.IsOnline = false;
      var oclinicindex = await this.clinicService.clinics.findIndex(
        x => x.Id === clinic.Id
      );
      this.clinicService.clinics.splice(oclinicindex, 1, clinic);

      this.clinicService.OnlineClinicId = setclinicId;
      this.storage.set(environment.CLINIC_Id, setclinicId);
      this.storage.set(environment.CLINICS, this.clinicService.clinics);

      // let data = { 'DoctorId': this.doctorId, 'Id': clinicId, 'IsOnline': 'true' }
      // await this.clinicService.changeOnlineClinic(data)
      //   .subscribe(res => {
      //     if (res.IsSuccess) {
      //       loading.dismiss();
      //       this.router.navigate(['/members/dashboard']);
      //     }
      //     else {
      //       this.toastService.create(res.Message)
      //     }

      //   }, (err) => {
      //     this.toastService.create(err);
      //   });
      loading.dismiss();
    }
  }

  alertDeleteClinic(id) {
    this.alertService
      .confirmAlert("Are you sure you want to delete this ?")
      .then(yes => {
        if (yes) {
          this.deleteClinic(id);
        }
      });
  }

  async deleteClinic(id) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();
    let clinic = this.clinicService.clinics.find(x => x.Id === id);
    clinic.Isdeleted = true;
    console.log(clinic);
    // for all clinics
    var clinicindex = await this.clinicService.clinics.findIndex( x => x.Id === id);
    this.clinicService.clinics.splice(clinicindex, 1);
    // // for displayed clinics
    // var dispclinicindex = await this.clinics.findIndex(x => x.Id === id);
    // this.dispclinics.splice(dispclinicindex, 1);
    console.log(this.clinicService.clinics);
    this.clinicService.clinics.push(clinic);
    this.storage.set(environment.CLINICS, this.clinicService.clinics);
    loading.dismiss();

    // await this.clinicService.deleteClinic(id).subscribe(
    //   res => {
    //     if (res.IsSuccess == true) {
    //       this.router.navigate(['/members/doctor/clinic']);
    //       loading.dismiss();
    //     }
    //     else {
    //       loading.dismiss();
    //       this.toastService.create(res.Message, 'danger');
    //     }
    //   },
    //   err => {
    //     loading.dismiss();
    //     this.toastService.create(err, 'danger')
    //   }
    // );
  }
}
