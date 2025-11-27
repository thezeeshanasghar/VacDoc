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
import { DoctorService } from "src/app/services/doctor.service";
import { VaccineService } from 'src/app/services/vaccine.service'; 
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";

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
  numOfDays: number = 0;
  selectedDate: string = new Date().toISOString();
  usertype: any;
  clinics: any;
  allClinicIds: number[] = []; // Store all clinic IDs for the user

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
    private vaccineService: VaccineService,
    public clinicService: ClinicService,
    private paService: PaService
  ) {}

  async ngOnInit() {
    this.getAlerts(this.selectedDate);
    await this.storage.get(environment.DOCTOR_Id).then(val => {
      this.doctorId = val;
    });
    this.usertype = await this.storage.get(environment.USER);
    await this.storage.get(environment.CLINIC_Id).then(clinicId => {
      this.clinicId = clinicId;
    });
    await this.storage.get(environment.SMS).then(val => {
      this.SMSKey = val;
    });
    this.storage.get(environment.MESSAGES).then(messages => { messages == null ? '' : this.Messages = messages });
    const formattedDate = this.formatDateToString(this.selectedDate);
    this.getAlerts(formattedDate);
    await this.getChlid(this.numOfDays, formattedDate);
    await this.getdoctor();
    await this.loadClinics();
  }

  async getdoctor() {
    const doctorId = localStorage.getItem('docid');
    await this.doctorService.getDoctorProfile(this.doctorId).subscribe(
      res => {
        if (res.IsSuccess) {
          const doctorData = res.ResponseData;
          // console.log("Doctor Data is ", res.ResponseData);
          // console.log('Doctor ID:', doctorData.Id);
          // console.log('Doctor Name:', doctorData.DisplayName);
          // console.log('Doctor Email:', doctorData.Email);
          // console.log('Doctor Phone:', doctorData.Phone);
          // console.log('Doctor Specialization:', doctorData.Specialization);
          // console.log('Doctor Address:', doctorData.Address);
          this.displayName = doctorData.DisplayName;
          if (doctorData.Clinics && doctorData.Clinics.length > 0) {
            doctorData.Clinics.forEach((clinic, index) => {
              // console.log(`Clinic ${index + 1} Data:`);
              // console.log('Clinic ID:', clinic.Id);
              // console.log('Clinic Name:', clinic.Name);
              // console.log('Clinic Address:', clinic.Address);
              // console.log('Clinic Phone:', clinic.PhoneNumber);
              // console.log('Clinic Email:', clinic.Email);
              if (clinic.Staff && clinic.Staff.length > 0) {
                // console.log(`Clinic ${index + 1} Staff:`);
                clinic.Staff.forEach((staff, staffIndex) => {
                  // console.log(`Staff Member ${staffIndex + 1}:`, staff.Name);
                });
              }
              // console.log('-------------------'); 
            });
            this.clinicName = doctorData.Clinics[0].Name;
            this.clinicPhoneNumber = doctorData.Clinics[0].PhoneNumber;
          } else {
            // console.log('No clinic data available');
          }
        } else {
          // console.log("Failed to get doctor data");
        }
      },
      err => {
        console.error('Error fetching doctor data:', err);
        this.toastService.create(err, "danger");
      }
    );
  }

   async loadClinics() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('Doctor Clinics:', this.clinics);
              
              // Store all clinic IDs for fetching alerts
              this.allClinicIds = this.clinics.map(clinic => clinic.Id);
              console.log('All Clinic IDs for Doctor:', this.allClinicIds);
              
              // Fetch alerts from ALL clinics for doctors
              if (this.allClinicIds.length > 0) {
                this.getAllClinicsAlerts(this.numOfDays, this.formattedDate);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('PA Clinics:', this.clinics);
              
              // Store all clinic IDs for fetching alerts
              this.allClinicIds = this.clinics.map(clinic => clinic.Id);
              console.log('All Clinic IDs for PA:', this.allClinicIds);
              
              // Fetch alerts from ALL clinics for PAs
              if (this.allClinicIds.length > 0) {
                this.getAllClinicsAlerts(this.numOfDays, this.formattedDate);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }


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

  // New method to fetch alerts from all clinics
  async getAllClinicsAlerts(numOfDays: number, formattedDate: string) {
    this.numOfDays = numOfDays;
    this.formattedDate = formattedDate;
    
    if (!this.allClinicIds || this.allClinicIds.length === 0) {
      this.toastService.create("No clinics available", "danger");
      return;
    }

    const loading = await this.loadingController.create({
      message: "Loading alerts from all clinics..."
    });
    await loading.present();

    try {
      // Create an array of observables for all clinic requests
      const requests = this.allClinicIds.map(clinicId =>
        this.alertService.getChild(this.formattedDate, this.numOfDays, clinicId.toString())
      );

      // Use forkJoin to wait for all requests to complete
      const { forkJoin } = await import('rxjs');
      
      forkJoin(requests).subscribe(
        (responses: any[]) => {
          // Combine all successful responses
          let allChildren = [];
          responses.forEach(res => {
            if (res.IsSuccess && res.ResponseData) {
              allChildren = allChildren.concat(res.ResponseData);
            }
          });

          this.Childs = allChildren;
          loading.dismiss();
          console.log(`Loaded ${allChildren.length} alerts from ${this.allClinicIds.length} clinics`);
        },
        err => {
          loading.dismiss();
          this.toastService.create("Error loading alerts", "danger");
          console.error("Error fetching alerts:", err);
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create("Error loading alerts", "danger");
      console.error("Error in getAllClinicsAlerts:", error);
    }
  }

  async sendemails() {
    const loading = await this.loadingController.create({
      message: "sending emails"
    });
    await loading.present();
    
    // Send emails for all clinics
    try {
      const { forkJoin } = await import('rxjs');
      const emailRequests = this.allClinicIds.map(clinicId =>
        this.alertService.sendEmailToAll(this.numOfDays, clinicId)
      );
      
      forkJoin(emailRequests).subscribe(
        (responses: any[]) => {
          loading.dismiss();
          const successCount = responses.filter(res => res.IsSuccess).length;
          if (successCount > 0) {
            this.toastService.create(`Emails sent successfully to ${successCount} clinic(s)`, "success");
          } else {
            this.toastService.create("Failed to send emails", "danger");
          }
        },
        err => {
          loading.dismiss();
          this.toastService.create(err, "danger");
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create("Error sending emails", "danger");
    }
  }

  async sendemail(child: any) {
    console.log(child);
    console.log(child[0].ChildId);
    const loading = await this.loadingController.create({
      message: "sending email"
    });
    await loading.present();
    await this.alertService.sendEmailSingle(child[0].ChildId).subscribe(
      res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("email sent successfully", "success");
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
        title: 'Child Alerts CSV',
        description: '',
        mimeType: '',
        visibleInDownloadsUi: true,
        notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
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

  async sendAlertMsg(id, childMobile, message) {
    if (this.SMSKey == 0) {
      await this.alertService
        .sendIndividualAlertMsg(this.numOfDays, id)
        .subscribe(
          res => {
            if (res.IsSuccess) {
              this.toastService.create("Alerts has been sent successfully");
            } else {
              this.toastService.create('Error: Failed to send alert\nTry again', 'danger', false, 3000);
            }
          },
          err => {
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
        this.toastService.create("Message Sent Failed", "danger");
        let obj = { 'toNumber': '+92' + childMobile, 'message': message, 'created': Date.now(), 'status': false };
        this.Messages.push(obj);
        this.storage.set(environment.MESSAGES, this.Messages);
      });
  }

  callFunction(celnumber: string) {
    const formattedNumber = celnumber.startsWith('0') ? celnumber : `0${celnumber}`;
    this.callNumber.callNumber(formattedNumber, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  async sendMsgsThroughList() {
    let allMessages: any[] = [];
    const loading = await this.loadingController.create({
      message: "Loading Messages"
    });
    await loading.present();
    
    // Send messages for all clinics
    try {
      const { forkJoin } = await import('rxjs');
      const messageRequests = this.allClinicIds.map(clinicId =>
        this.alertService.sendMsgsThroughDictionary(0, clinicId.toString())
      );
      
      forkJoin(messageRequests).subscribe(
        (responses: any[]) => {
          responses.forEach(response => {
            if (response.IsSuccess && response.ResponseData) {
              allMessages = allMessages.concat(response.ResponseData);
            }
          });
          
          if (allMessages.length > 0) {
            this.toastService.create('Success: Generated messages', 'success', false, 3000);
            this.sendMessagesToChildren(allMessages);
          } else {
            this.toastService.create('Error: No messages generated', 'danger', false, 6000);
          }
          loading.dismiss();
        },
        (err) => {
          this.toastService.create('Error: Server failure', 'danger', false, 3000);
          loading.dismiss();
        }
      );
    } catch (error) {
      loading.dismiss();
      this.toastService.create('Error loading messages', 'danger');
    }
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
  if (child.isMessageSent) {
    alert('You have already sent the alert for this child.');
    return;
  }
  this.vaccineService.getDosesForChild(child.Child.Id, this.formatDateToString(this.selectedDate), this.clinicId).subscribe(
    (response) => {
      if (response.IsSuccess && response.ResponseData) {
        const doseNames = response.ResponseData.map((dose: any) => dose.Name).join(', ');
        const mobile = response.ResponseData[0].CountryCode + mobileNumber;
        const childName = child.Child.Name;
        const clinicName = response.ResponseData[0] && response.ResponseData[0].Clinic ? response.ResponseData[0].Clinic.Name : 'Unknown Clinic';
        const clinicPhoneNumber = response.ResponseData[0] && response.ResponseData[0].Clinic ? response.ResponseData[0].Clinic.PhoneNumber : 'Unknown Phone Number';
        const password = child.Child.User.Password ? child.Child.User.Password : '******';
        const message = encodeURIComponent(
          `Reminder: Vaccination ${doseNames} for ${childName} is due. Please confirm your appointment.\n` +
          `Clinic: ${clinicName}\nPhone: ${clinicPhoneNumber}\n` +
          `You can view your complete vaccination record at https://vaccinationcentre.com\nMobile: ${mobileNumber || ''}\nPassword: ${password}\n` +
          `Thanks, ${this.displayName}`
        );
        let whatsappUrl: string;
        if (this.platform.is('android') || this.platform.is('ios')) {
          whatsappUrl = `whatsapp://send?phone=${mobile}&text=${message}`;
        } else {
          whatsappUrl = `https://web.whatsapp.com/send?phone=+${mobile}&text=${message}`;
        }
        window.open(whatsappUrl, '_system');
      } else {
        console.error('API Response Error: No doses available or ResponseData is undefined.', response);
      }
    },
    (error) => {
      console.error('Error fetching doses:', error);
    }
  );
  child.isMessageSent = true;
}

  formatDateToString(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onDateChange(event: any) {
    this.selectedDate = event.value;
    console.log('Selected Date:', this.selectedDate);
    this.getAlerts(this.selectedDate);
  }

  getAlerts(date: string) {
    const formattedDate = this.formatDateToString(date);
    // Always fetch from all clinics
    this.getAllClinicsAlerts(0, formattedDate);
  }
}