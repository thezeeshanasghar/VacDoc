import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { AlertService } from "src/app/services/alert.service";
import { ToastService } from "src/app/shared/toast.service";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { AndroidPermissions } from "@ionic-native/android-permissions/ngx";
import { CallNumber } from '@ionic-native/call-number/ngx';
import { TitleCasePipe } from '@angular/common';
import { SMS } from '@ionic-native/sms/ngx';
import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { Platform } from '@ionic/angular';
import { formattedError } from "@angular/compiler";
import { DoctorService } from "src/app/services/doctor.service";
import { VaccineService } from 'src/app/services/vaccine.service'; // Import the service

//declare var SMS: any;
@Component({
  selector: "app-vaccine-alert",
  templateUrl: "./vaccine-alert.page.html",
  styleUrls: ["./vaccine-alert.page.scss"],
  providers: [AndroidPermissions]
})
export class VaccineAlertPage implements OnInit {
  doctorId: any;
  clinicId: any;
  SMSKey: any;
  displayName: any;
  clinicName: any;
  clinicPhoneNumber: any;
  formattedDate: string;
  Childs: any;
  private readonly API_VACCINE = `${environment.BASE_URL}`;
  Messages = [];
  numOfDays: number = 0; // 0 means get alert for today, 5 means get alert for next five days, same as for -5
  selectedDate: string = new Date().toISOString();



  constructor(
    public loadingController: LoadingController,
    private alertService: AlertService,
    private doctorService: DoctorService,
    private toastService: ToastService,
    private storage: Storage,
    private androidPermissions: AndroidPermissions,
    private callNumber: CallNumber,
    private titlecasePipe: TitleCasePipe,
    private sms: SMS,
    private downloader: Downloader,
    public platform: Platform,
    private vaccineService: VaccineService
  ) {

  }




  async ngOnInit() {
    this.getAlerts(this.selectedDate);
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    await this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    await this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.storage.get(environment.MESSAGES).then(messages => { messages == null ? '' : this.Messages = messages });
    const formattedDate = this.formatDateToString(this.selectedDate);
    this.getAlerts(formattedDate);
    // ... other initializations ...
    await this.getChlid(this.numOfDays, formattedDate);
    await this.getdoctor();
  }

  // async getdoctor (){
  //   const doctorId = localStorage.getItem('docid');
  //   await this.doctorService.getDoctorProfile(this.doctorId).subscribe(
  //     res => {
  //       if (res.IsSuccess) {
  //           const doctorData = res.ResponseData;
  //           console.log("Doctor Data is ", res.ResponseData);
  //           console.log('Doctor ID:', doctorData.Id);
  //           const displayName = this.displayName;
  //           this.displayName = doctorData.DisplayName;



  //           console.log('Doctor Name:', doctorData.DisplayName);
  //           console.log('Doctor Email:', doctorData.Email);
  //           console.log('Doctor Phone:', doctorData.Phone);
  //           console.log('Doctor Specialization:', doctorData.Specialization);
  //           console.log('Doctor Address:', doctorData.Address);
  //           console.log('Doctor Address:', doctorData.Clinics.Name);



  //       }
  //     },
  //     err => {
  //       this.toastService.create(err, "danger");
  //     }
  //   );
  // }

  async getdoctor() {
    const doctorId = localStorage.getItem('docid');
    await this.doctorService.getDoctorProfile(this.doctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          const doctorData = res.ResponseData;
          console.log("Doctor Data is ", res.ResponseData);

          // Doctor Information
          console.log('Doctor ID:', doctorData.Id);
          console.log('Doctor Name:', doctorData.DisplayName);
          console.log('Doctor Email:', doctorData.Email);
          console.log('Doctor Phone:', doctorData.Phone);
          console.log('Doctor Specialization:', doctorData.Specialization);
          console.log('Doctor Address:', doctorData.Address);

          this.displayName = doctorData.DisplayName;

          // Clinic Information
          if (doctorData.Clinics && doctorData.Clinics.length > 0) {
            doctorData.Clinics.forEach((clinic, index) => {
              console.log(`Clinic ${index + 1} Data:`);
              console.log('Clinic ID:', clinic.Id);
              console.log('Clinic Name:', clinic.Name);
              console.log('Clinic Address:', clinic.Address);
              console.log('Clinic Phone:', clinic.PhoneNumber);
              console.log('Clinic Email:', clinic.Email);

              if (clinic.Staff && clinic.Staff.length > 0) {
                console.log(`Clinic ${index + 1} Staff:`);
                clinic.Staff.forEach((staff, staffIndex) => {
                  console.log(`Staff Member ${staffIndex + 1}:`, staff.Name);
                });
              }

              console.log('-------------------'); // Separator between clinics
            });

            // Store the first clinic's name (or adjust as needed)
            this.clinicName = doctorData.Clinics[0].Name;
            this.clinicPhoneNumber = doctorData.Clinics[0].PhoneNumber;
          } else {
            console.log('No clinic data available');
          }
        } else {
          console.log("Failed to get doctor data");
        }
      },
      err => {
        console.error('Error fetching doctor data:', err);
        this.toastService.create(err, "danger");
      }
    );
  }
  // Get childs get from server
  async getChlid(numOfDays: number, formattedDate: string) {

    this.numOfDays = numOfDays;
    this.formattedDate = formattedDate;
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();


    await this.alertService.getChild(this.formattedDate, this.numOfDays, this.clinicId).subscribe(
      res => {


        if (res.IsSuccess) {
          this.Childs = "";
          this.Childs = res.ResponseData;



          loading.dismiss();
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

  async sendemails() {
    const loading = await this.loadingController.create({
      message: "sending emails"
    });
    await loading.present();
    await this.alertService.sendEmailToAll(this.numOfDays, this.clinicId).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("emails sent successfull", "success");
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

  downloadcsv() {
    let query = "";
    this.Childs.map(x => x.Child.Id).forEach(id => {
      query += 'arr[]=' + id + '&';
    });

    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      var url = `${this.API_VACCINE}child/downloadcsv?${query}`;
      window.open(url);
    }
    else {
      var request: DownloadRequest = {
        uri: `${this.API_VACCINE}child/downloadcsv?${query}`,
        title: 'Chil dAlerts CSV',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
        // notificationVisibility: 0,
        destinationInExternalFilesDir: {
          dirType: 'Downloads',
          subPath: 'Child Alerts.csv'
        }
      };
      this.downloader.download(request)
        .then((location: string) => console.log('File downloaded at:' + location))
        .catch((error: any) => console.error(error));
    }
  }

  async sendSMS(child: any) {
    const loading = await this.loadingController.create({
      message: "Loading"
    });
    await loading.present();

    for (let i = 0; i < child.length; i++) {
      let message = this.generateSMS(child[i]);
    }
    loading.dismiss();
  }

  generateSMS(schedule) {
    var sms1 = 'Reminder: Vaccination for ';
    sms1 += schedule.Child.Name + ' is due on ' + schedule.Date;
    sms1 += ' (' + schedule.Dose.Name + ' )';
    return sms1;
  }

  // send Alert Msg to childs
  async sendAlertMsg(id, childMobile, message) {

    if (this.SMSKey == 0) {
      await this.alertService
        .sendIndividualAlertMsg(this.numOfDays, id)
        .subscribe(
          res => {
            if (res.IsSuccess) {
              //loading.dismiss();
              this.toastService.create("Alerts has been sent successfully");
            } else {
              //loading.dismiss();
              this.toastService.create('Error: Failed to send alert\nTry again', 'danger', false, 3000);
            }
          },
          err => {
            //loading.dismiss();
            this.toastService.create('Error: Server failure', 'danger', false, 3000);
          }
        );
    } else {
      this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.SEND_SMS)
        .then(
          success => {
            if (!success.hasPermission) {
              this.androidPermissions
                .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
                .then(
                  success => {
                    this.sendMessage(childMobile, message);
                  },
                  err => {
                    console.error(err);
                  }
                );
            } else {
              this.sendMessage(childMobile, message);
            }
          },
          err => {
            this.androidPermissions
              .requestPermission(this.androidPermissions.PERMISSION.SEND_SMS)
              .then(
                success => {
                  this.sendMessage(childMobile, message);
                },
                err => {
                  console.error(err);
                }
              );
          }
        );
    }
  }

  async sendMessage(childMobile, message) {
    this.sms.send('+92' + childMobile, message)
      .then(() => {
        let obj = { 'toNumber': '+92' + childMobile, 'message': message, 'created': Date.now(), 'status': true };
        this.Messages.push(obj);
        this.storage.set(environment.MESSAGES, this.Messages);
        this.toastService.create("Message Sent Successful");
      }).catch((error) => {
        //console.log("The Message is Failed",error);
        this.toastService.create("Message Sent Failed", "danger");
        let obj = { 'toNumber': '+92' + childMobile, 'message': message, 'created': Date.now(), 'status': false };
        this.Messages.push(obj);
        this.storage.set(environment.MESSAGES, this.Messages);
      });
  }

  callFunction(celnumber: string) {
    // Ensure the phone number is in the correct format
    const formattedNumber = celnumber.startsWith('0') ? celnumber : `0${celnumber}`;
    this.callNumber.callNumber(formattedNumber, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }
  // checkSmsPermission(): any {
  //   this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.SEND_SMS)
  //     .then((success) => {
  //       if (success.hasPermission) {
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     },
  //       err => {
  //         this.requestSmsPermissions();
  //       }
  //     );
  // }
  // requestSmsPermissions() {
  //   this.androidPermissions.requestPermissions(this.androidPermissions.PERMISSION.SEND_SMS)
  //     .then((success) => {
  //       if (success.hasPermission) {
  //         // return true;
  //       } else {
  //         // return false;
  //       }
  //     },
  //       err => {
  //         this.toastService.create('Error: ' + err.message)
  //       }
  //     );
  // }
  async sendMsgsThroughList() {
    let listMessages: any;
    const loading = await this.loadingController.create({
      message: "Loading Messages"
    });
    await loading.present();
    await this.alertService.sendMsgsThroughDictionary(0, this.clinicId).subscribe(
      (response) => {
        if (response.IsSuccess) {
          this.toastService.create('Success: Generated messages', 'success', false, 3000);
          listMessages = response.ResponseData;
          this.sendMessagesToChildren(listMessages);
          loading.dismiss();
        }
        else {
          this.toastService.create('Error: Failed to generate messages\nTry Again', 'danger', false, 6000);
          loading.dismiss();
        }
      },
      (err) => {
        this.toastService.create('Error: Server failure', 'danger', false, 3000);
        loading.dismiss();
      }
    );
  }

  async sendMessagesToChildren(listMessages: any) {
    const loading = await this.loadingController.create({
      message: "Sending Messages"
    });
    await loading.present();

    await listMessages.forEach(element => {
      this.sendAlertMsg(element.ChildId, element.MobileNumber, element.SMS);
    });

    loading.dismiss();

  }

  openWhatsApp(mobileNumber: string, childName: string, doseName: string, child: any) {
    console.log('Child ID:', child.Child.Id); // Debugging line
    console.log('Selected Date:', this.selectedDate); // Debugging line
    if (child.isMessageSent) {
      alert('You have already sent the alert for this child.');
      return;
    }

    this.vaccineService.getDosesForChild(child.Child.Id, this.selectedDate).subscribe(response => {
      if (response.IsSuccess && response.ResponseData) {
        const doseNames = response.ResponseData.map(dose => dose.Name).join(', ');
        const childName = child.Child.Name;
        const message = encodeURIComponent(`Reminder: Vaccination ${doseNames}, of ${childName} is due. Please confirm your appointment. Thanks!\n${this.displayName}, Baby Medics\nPhone Number ${this.clinicPhoneNumber}\nLogin and check your record at https://vaccinationcenter.com`);
        const formattedPatientNumber = mobileNumber.startsWith('+92') ? mobileNumber : `+92${mobileNumber.replace(/^0/, '')}`;
        let whatsappUrl: string;
        if (this.platform.is('android') || this.platform.is('ios')) {
          whatsappUrl = `whatsapp://send?phone=${formattedPatientNumber}&text=${message}`;
        } else {
          whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPatientNumber}&text=${message}`;
        }
        window.open(whatsappUrl, '_system');
      } else {
        console.error('API Response Error: No doses available or ResponseData is undefined.', response); // More detailed error logging
      }
    }, error => {
      console.error('Error fetching doses:', error);
    });
    child.isMessageSent = true;
  }

  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);  // Months are 0-based
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    console.log('Selected Date:', this.selectedDate);
    this.getAlerts(this.selectedDate);
  }
  getAlerts(date: string) {
    const formattedDate = this.formatDateToString(date);

    this.getChlid(0, formattedDate);
  }

  async openDatePicker() {
    const dateTimeElement = document.querySelector('ion-datetime');
    await dateTimeElement.open();
  }

}