import { Component, OnInit, Input, ViewChild } from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { ClinicService } from "src/app/services/clinic.service";
import { ToastService } from "src/app/shared/toast.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { SignupService } from "src/app/services/signup.service";
import * as moment from "moment";
import { Geolocation } from "@ionic-native/geolocation/ngx";
//import { validateConfig } from "@angular/router/src/config";
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';

import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
declare var google;

@Component({
  selector: "app-step2",
  templateUrl: "./step2.page.html",
  styleUrls: ["./step2.page.scss"]
})
export class Step2Page implements OnInit {
  //google:any;
  fg1: FormGroup;
  fg2: FormGroup;
  map;
  myMarker;
  uploading;
  resourceURL = environment.RESOURCE_URL;
  @ViewChild("mapElement", { static: true }) mapElement;
  @ViewChild('fileInput',{ static: true }) fileInput: any;
  DoctorId: any;
  latitude: any = 33.6328532;
  longitude: any = 72.93583679;
  section: boolean = false;
  isWeb: boolean;
  constructor(
    private formbuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private clinicService: ClinicService,
    private toastService: ToastService,
    private signupService: SignupService,
    private storage: Storage,
    private geolocation: Geolocation,
    private fileChooser: FileChooser,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer,
    private platform: Platform,
    private http: HttpClient,
  ) { 
    this.isWeb = !this.platform.is('cordova');
  }

  ngOnInit() {
    //this.ionViewDidEnte();
    // this.hello();
    // this.storage.get(environment.DOCTOR_Id).then(val => {
    //   this.DoctorId = val;
    // });
    this.fg1 = this.formbuilder.group({
      DoctorId: [null],
      Name: ['', Validators.compose([
        Validators.required,
        Validators.pattern(/^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/)
      ])],
      PhoneNumber: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(11),
          Validators.pattern("^([0-9]*)$")
        ])
      ),
      Address: [null],
      ConsultationFee: new FormControl(
        "",
        Validators.compose([
          Validators.required,
          Validators.pattern("^(0|[1-9][0-9]*)$")
        ])
      ),
      MonogramImage: [null],
      ClinicTimings: [null],
      Lat: [null],
      Long: [null]
    });

    this.fg2 = this.formbuilder.group({
      Monday: [true],
      MondayS1: [true],
      MondayS2: [true],
      Mstart: [null],
      Mstart2: [null],
      Mend: [null],
      Mend2: [null],

      Tuesday: [true],
      TuesdayS1: [true],
      TuesdayS2: [true],
      Tustart: [null],
      Tustart2: [null],
      Tuend: [null],
      Tuend2: [null],

      Wednesday: [true],
      WednesdayS1: [true],
      WednesdayS2: [true],
      Wstart: [null],
      Wstart2: [null],
      Wend: [null],
      Wend2: [null],

      Thursday: [true],
      ThursdayS1: [true],
      ThursdayS2: [true],
      Thstart: [null],
      Thstart2: [null],
      Thend: [null],
      Thend2: [null],

      Friday: [true],
      FridayS1: [true],
      FridayS2: [true],
      Fstart: [null],
      Fstart2: [null],
      Fend: [null],
      Fend2: [null],

      Saturday: [true],
      SaturdayS1: [true],
      SaturdayS2: [true],
      Sastart: [null],
      Sastart2: [null],
      Saend: [null],
      Saend2: [null],

      Sunday: [true],
      SundayS1: [true],
      SundayS2: [true],
      Sustart: [null],
      Sustart2: [null],
      Suend: [null],
      Suend2: [null]
    });
    this.ionViewDidEnte();
  }
  

  async uploadMonogram(event: Event) {
    if(this.isWeb){
      const fileInput = event.target as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        return;
      }


      const file = fileInput.files[0];
      const img = new Image();
      // Create a URL for the file
      const fileURL = URL.createObjectURL(file);
  
      // Set the Image object's src to the file URL
      img.src = fileURL;
      console.log(fileURL);
      
      img.onload = async () =>{
        console.log('Image Width:', img.naturalWidth);
        console.log('Image Height:', img.naturalHeight);
        console.log('Selected File:', file);
     
      if (file.size < 100000 && img.naturalHeight == 339 && img.naturalWidth == 1200) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          // Make sure to replace the URL below with your actual upload endpoint
          const uploadUrl = `${environment.BASE_URL}upload`;
          const response = await this.http.post(uploadUrl, formData).toPromise();
          const dbPath = response['dbPath']; // Adjust this based on your server response
          console.log('dbPath',dbPath)
          localStorage.setItem('dbPath',dbPath)

          // Handle success
          this.toastService.create('Successfully uploaded');
          // Update your form value or handle the uploaded file path as needed
        } catch (error) {
          console.error('Error uploading file:', error);
          this.toastService.create('Error uploading file', 'danger');
          this.fileInput.nativeElement.value = '';
        }
      } else {
        this.toastService.create('File size must be less than 100 KB', 'danger');
        this.fileInput.nativeElement.value = '';
      }
      }
    } 
    else{

      this.fileChooser.open().then(async uri => {
        console.log(uri);
        await this.filePath.resolveNativePath(uri).then(filePath => {
          //this.filesPath = filePath;
          this.uploading = true;
          this.file.resolveLocalFilesystemUrl(filePath).then(fileInfo => {
            let files = fileInfo as FileEntry;
            files.file(async success => {
              //this.fileType   = success.type;
              if (success.size < 100000) {
                let filesName = success.name;
                console.log(filesName);
                let options: FileUploadOptions = {
                  fileName: filesName
                }
                const fileTransfer: FileTransferObject = this.transfer.create();
                await fileTransfer.upload(uri, `${environment.BASE_URL}upload`                   , options)
                  .then((data) => {
                    // success
                    console.log(data);
                    this.toastService.create("successfully Uploaded");
                    this.uploading = false;
                    let dbPath = JSON.parse(data.response)
                    this.fg1.value.MonogramImage = dbPath.dbPath;
                    console.log('this.fg1.value.MonogramImage',this.fg1.value.MonogramImage);
                  }, (err) => {
                    console.log(err)
                    
                    // error
                  })
              }
              else
                this.toastService.create("File size must be less than 100 kb", "danger");
                this.fileInput.nativeElement.value = '';
                
            });
          }, err => {
            console.log(err);
            throw err;
          });
        }, err => {
          console.log(err);
          throw err;
        });
      }, err => {
        console.log(err);
        throw err;
      });
    }
  }
  // hello(): void {
  //   //Called after ngOnInit when the component's or directive's content has been initialized.
  //   //Add 'implements AfterContentInit' to the class.
  //   // this.map = new google.maps.Map(this.mapElement.nativeElement, {
  //   //   center: { lat: 33.632553, lng: 72.934592 },
  //   //   zoom: 15
  //   // });
  //   this.map = new google.maps.Map(this.mapElement.nativeElement, {
  //     center: { lat: this.latitude, lng: this.longitude },
  //     zoom: 15
  //   });
  //   // this.myMarker = new google.maps.Marker({
  //   //   position: { lat: 30.632553, lng: 72.934592 },
  //   //   draggable: true
  //   // });
  //   this.myMarker = new google.maps.Marker({
  //     position: { lat: this.latitude, lng: this.longitude },
  //     draggable: true
  //   });
  //   this.map.setCenter(this.myMarker.position);
  //   this.myMarker.setMap(this.map);

  //   google.maps.event.addListener(this.myMarker, "dragend", function (evt) {
  //     this.latitude = evt.latLng.lat().toFixed(3);
  //     this.longitude = evt.latLng.lng().toFixed(3);
  //     // this.lat = evt.latLng.lat().toFixed(3);
  //     // this.lng = evt.latLng.lng().toFixed(3);
  //   });
  // }
  ionViewDidEnte() {
    this.geolocation
      .getCurrentPosition()
      .then(resp => {
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
        console.log(this.latitude);
        // this.hello();
      })
      .catch(error => {
        console.log("Error getting location", error);
      });
  }

  setAllDaysValueStrat1() {
    this.fg2.controls["Tustart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Wstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Thstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Fstart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Sastart"].setValue(this.fg2.value.Mstart);
    this.fg2.controls["Sustart"].setValue(this.fg2.value.Mstart);
    this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
    this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
    this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
  }
  setAllDaysValueStrat2() {
    this.fg2.controls["Tustart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Wstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Thstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Fstart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Sastart2"].setValue(this.fg2.value.Mstart2);
    this.fg2.controls["Sustart2"].setValue(this.fg2.value.Mstart2);
    this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
    this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
    this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
  }

  setAllDaysValueEnd1() {
    this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Wend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Thend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Fend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Saend"].setValue(this.fg2.value.Mend);
    this.fg2.controls["Suend"].setValue(this.fg2.value.Mend);
    this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
    this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
    this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
  }

  setAllDaysValueEnd2() {
    this.fg2.controls["Tuend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Wend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Thend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Fend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Saend2"].setValue(this.fg2.value.Mend2);
    this.fg2.controls["Suend2"].setValue(this.fg2.value.Mend2);
    this.setTimeValidatorsTuesday(); this.setTimeValidatorsWed();
    this.setTimeValidatorsThu(); this.setTimeValidatorsFri();
    this.setTimeValidatorsSat(); this.setTimeValidatorsSun();
  }

  getdata() {
    // this.fg2.controls["Tuend"].setValue(this.fg2.value.Mend);
    this.fg1.value.DoctorId = this.DoctorId;
    // this.fg1.value.Lat = this.myMarker.lat;
    // this.fg1.value.Long = this.myMarker.lng;
    this.fg1.value.Lat = this.latitude;
    this.fg1.value.Long = this.longitude;
    const monogram=localStorage.getItem('dbPath')
    var ct = [];

    if (this.fg2.value.Monday) {
      if (this.fg2.value.MondayS1) {
        if (!this.fg2.value.Mstart) { 
          this.fg2.controls["Mstart"].setValue(''); 
        }
        if (!this.fg2.value.Mend) { 
          this.fg2.controls["Mend"].setValue(''); 
        }

        // Format start time
        if (this.fg2.value.Mstart) {
          let startTimeMoment = moment(this.fg2.value.Mstart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Mstart = startTimeMoment.isValid() ? startTimeMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Mstart = '';
        }

        // Format end time
        if (this.fg2.value.Mend) {
          let endTimeMoment = moment(this.fg2.value.Mend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Mend = endTimeMoment.isValid() ? endTimeMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Mend = '';
        }

        let obj = {
          Day: "Monday",
          StartTime: this.fg2.value.Mstart,
          EndTime: this.fg2.value.Mend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Monday
      if (this.fg2.value.MondayS2) {
        if (!this.fg2.value.Mstart2) { 
          this.fg2.controls["Mstart2"].setValue(''); 
        }
        if (!this.fg2.value.Mend2) { 
          this.fg2.controls["Mend2"].setValue(''); 
        }

        // Format start time for Session 2
        if (this.fg2.value.Mstart2) {
          let startTimeMoment2 = moment(this.fg2.value.Mstart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Mstart2 = startTimeMoment2.isValid() ? startTimeMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Mstart2 = '';
        }

        // Format end time for Session 2
        if (this.fg2.value.Mend2) {
          let endTimeMoment2 = moment(this.fg2.value.Mend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Mend2 = endTimeMoment2.isValid() ? endTimeMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Mend2 = '';
        }

        let obj1 = {
          Day: "Monday",
          StartTime: this.fg2.value.Mstart2,
          EndTime: this.fg2.value.Mend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Tuesday) {
      // For Session 1 on Tuesday
      if (this.fg2.value.TuesdayS1) {
        if (!this.fg2.value.Tustart) { 
          this.fg2.controls["Tustart"].setValue(''); 
        }
        if (!this.fg2.value.Tuend) { 
          this.fg2.controls["Tuend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Tuesday
        if (this.fg2.value.Tustart) {
          let startTimeTuesdayMoment = moment(this.fg2.value.Tustart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Tustart = startTimeTuesdayMoment.isValid() ? startTimeTuesdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Tustart = '';
        }
        
        // Format end time for Session 1 on Tuesday
        if (this.fg2.value.Tuend) {
          let endTimeTuesdayMoment = moment(this.fg2.value.Tuend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Tuend = endTimeTuesdayMoment.isValid() ? endTimeTuesdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Tuend = '';
        }
        
        let obj = {
          Day: "Tuesday",
          StartTime: this.fg2.value.Tustart,
          EndTime: this.fg2.value.Tuend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Tuesday
      if (this.fg2.value.TuesdayS2) {
        if (!this.fg2.value.Tustart2) { 
          this.fg2.controls["Tustart2"].setValue(''); 
        }
        if (!this.fg2.value.Tuend2) { 
          this.fg2.controls["Tuend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Tuesday
        if (this.fg2.value.Tustart2) {
          let startTimeTuesdayMoment2 = moment(this.fg2.value.Tustart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Tustart2 = startTimeTuesdayMoment2.isValid() ? startTimeTuesdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Tustart2 = '';
        }
        
        // Format end time for Session 2 on Tuesday
        if (this.fg2.value.Tuend2) {
          let endTimeTuesdayMoment2 = moment(this.fg2.value.Tuend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Tuend2 = endTimeTuesdayMoment2.isValid() ? endTimeTuesdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Tuend2 = '';
        }
        
        let obj1 = {
          Day: "Tuesday",
          StartTime: this.fg2.value.Tustart2,
          EndTime: this.fg2.value.Tuend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Wednesday) {
      // For Session 1 on Wednesday
      if (this.fg2.value.WednesdayS1) {
        if (!this.fg2.value.Wstart) { 
          this.fg2.controls["Wstart"].setValue(''); 
        }
        if (!this.fg2.value.Wend) { 
          this.fg2.controls["Wend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Wednesday
        if (this.fg2.value.Wstart) {
          let startTimeWednesdayMoment = moment(this.fg2.value.Wstart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Wstart = startTimeWednesdayMoment.isValid() ? startTimeWednesdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Wstart = '';
        }
        
        // Format end time for Session 1 on Wednesday
        if (this.fg2.value.Wend) {
          let endTimeWednesdayMoment = moment(this.fg2.value.Wend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Wend = endTimeWednesdayMoment.isValid() ? endTimeWednesdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Wend = '';
        }
        
        let obj = {
          Day: "Wednesday",
          StartTime: this.fg2.value.Wstart,
          EndTime: this.fg2.value.Wend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

     // For Session 2 on Wednesday
      if (this.fg2.value.WednesdayS2) {
        if (!this.fg2.value.Wstart2) { 
          this.fg2.controls["Wstart2"].setValue(''); 
        }
        if (!this.fg2.value.Wend2) { 
          this.fg2.controls["Wend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Wednesday
        if (this.fg2.value.Wstart2) {
          let startTimeWednesdayMoment2 = moment(this.fg2.value.Wstart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Wstart2 = startTimeWednesdayMoment2.isValid() ? startTimeWednesdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Wstart2 = '';
        }
        
        // Format end time for Session 2 on Wednesday
        if (this.fg2.value.Wend2) {
          let endTimeWednesdayMoment2 = moment(this.fg2.value.Wend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Wend2 = endTimeWednesdayMoment2.isValid() ? endTimeWednesdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Wend2 = '';
        }
        
        let obj1 = {
          Day: "Wednesday",
          StartTime: this.fg2.value.Wstart2,
          EndTime: this.fg2.value.Wend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Thursday) {
      // For Session 1 on Thursday
      if (this.fg2.value.ThursdayS1) {
        if (!this.fg2.value.Thstart) { 
          this.fg2.controls["Thstart"].setValue(''); 
        }
        if (!this.fg2.value.Thend) { 
          this.fg2.controls["Thend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Thursday
        if (this.fg2.value.Thstart) {
          let startTimeThursdayMoment = moment(this.fg2.value.Thstart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Thstart = startTimeThursdayMoment.isValid() ? startTimeThursdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Thstart = '';
        }
        
        // Format end time for Session 1 on Thursday
        if (this.fg2.value.Thend) {
          let endTimeThursdayMoment = moment(this.fg2.value.Thend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Thend = endTimeThursdayMoment.isValid() ? endTimeThursdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Thend = '';
        }
        
        let obj = {
          Day: "Thursday",
          StartTime: this.fg2.value.Thstart,
          EndTime: this.fg2.value.Thend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Thursday
      if (this.fg2.value.ThursdayS2) {
        if (!this.fg2.value.Thstart2) { 
          this.fg2.controls["Thstart2"].setValue(''); 
        }
        if (!this.fg2.value.Thend2) { 
          this.fg2.controls["Thend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Thursday
        if (this.fg2.value.Thstart2) {
          let startTimeThursdayMoment2 = moment(this.fg2.value.Thstart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Thstart2 = startTimeThursdayMoment2.isValid() ? startTimeThursdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Thstart2 = '';
        }
        
        // Format end time for Session 2 on Thursday
        if (this.fg2.value.Thend2) {
          let endTimeThursdayMoment2 = moment(this.fg2.value.Thend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Thend2 = endTimeThursdayMoment2.isValid() ? endTimeThursdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Thend2 = '';
        }
        
        let obj1 = {
          Day: "Thursday",
          StartTime: this.fg2.value.Thstart2,
          EndTime: this.fg2.value.Thend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Friday) {
      // For Session 1 on Friday
      if (this.fg2.value.FridayS1) {
        if (!this.fg2.value.Fstart) { 
          this.fg2.controls["Fstart"].setValue(''); 
        }
        if (!this.fg2.value.Fend) { 
          this.fg2.controls["Fend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Friday
        if (this.fg2.value.Fstart) {
          let startTimeFridayMoment = moment(this.fg2.value.Fstart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Fstart = startTimeFridayMoment.isValid() ? startTimeFridayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Fstart = '';
        }
        
        // Format end time for Session 1 on Friday
        if (this.fg2.value.Fend) {
          let endTimeFridayMoment = moment(this.fg2.value.Fend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Fend = endTimeFridayMoment.isValid() ? endTimeFridayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Fend = '';
        }
        
        let obj = {
          Day: "Friday",
          StartTime: this.fg2.value.Fstart,
          EndTime: this.fg2.value.Fend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Friday
      if (this.fg2.value.FridayS2) {
        if (!this.fg2.value.Fstart2) { 
          this.fg2.controls["Fstart2"].setValue(''); 
        }
        if (!this.fg2.value.Fend2) { 
          this.fg2.controls["Fend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Friday
        if (this.fg2.value.Fstart2) {
          let startTimeFridayMoment2 = moment(this.fg2.value.Fstart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Fstart2 = startTimeFridayMoment2.isValid() ? startTimeFridayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Fstart2 = '';
        }
        
        // Format end time for Session 2 on Friday
        if (this.fg2.value.Fend2) {
          let endTimeFridayMoment2 = moment(this.fg2.value.Fend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Fend2 = endTimeFridayMoment2.isValid() ? endTimeFridayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Fend2 = '';
        }
        
        let obj1 = {
          Day: "Friday",
          StartTime: this.fg2.value.Fstart2,
          EndTime: this.fg2.value.Fend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Saturday) {
      // For Session 1 on Saturday
      if (this.fg2.value.SaturdayS1) {
        if (!this.fg2.value.Sastart) { 
          this.fg2.controls["Sastart"].setValue(''); 
        }
        if (!this.fg2.value.Saend) { 
          this.fg2.controls["Saend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Saturday
        if (this.fg2.value.Sastart) {
          let startTimeSaturdayMoment = moment(this.fg2.value.Sastart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Sastart = startTimeSaturdayMoment.isValid() ? startTimeSaturdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Sastart = '';
        }
        
        // Format end time for Session 1 on Saturday
        if (this.fg2.value.Saend) {
          let endTimeSaturdayMoment = moment(this.fg2.value.Saend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Saend = endTimeSaturdayMoment.isValid() ? endTimeSaturdayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Saend = '';
        }
        
        let obj = {
          Day: "Saturday",
          StartTime: this.fg2.value.Sastart,
          EndTime: this.fg2.value.Saend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Saturday
      if (this.fg2.value.SaturdayS2) {
        if (!this.fg2.value.Sastart2) { 
          this.fg2.controls["Sastart2"].setValue(''); 
        }
        if (!this.fg2.value.Saend2) { 
          this.fg2.controls["Saend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Saturday
        if (this.fg2.value.Sastart2) {
          let startTimeSaturdayMoment2 = moment(this.fg2.value.Sastart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Sastart2 = startTimeSaturdayMoment2.isValid() ? startTimeSaturdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Sastart2 = '';
        }
        
        // Format end time for Session 2 on Saturday
        if (this.fg2.value.Saend2) {
          let endTimeSaturdayMoment2 = moment(this.fg2.value.Saend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Saend2 = endTimeSaturdayMoment2.isValid() ? endTimeSaturdayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Saend2 = '';
        }
        
        let obj1 = {
          Day: "Saturday",
          StartTime: this.fg2.value.Sastart2,
          EndTime: this.fg2.value.Saend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }

    if (this.fg2.value.Sunday) {
      // For Session 1 on Sunday
      if (this.fg2.value.SundayS1) {
        if (!this.fg2.value.Sustart) { 
          this.fg2.controls["Sustart"].setValue(''); 
        }
        if (!this.fg2.value.Suend) { 
          this.fg2.controls["Suend"].setValue(''); 
        }
        
        // Format start time for Session 1 on Sunday
        if (this.fg2.value.Sustart) {
          let startTimeSundayMoment = moment(this.fg2.value.Sustart, "YYYY-MM-DD HH:mm");
          this.fg2.value.Sustart = startTimeSundayMoment.isValid() ? startTimeSundayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Sustart = '';
        }
        
        // Format end time for Session 1 on Sunday
        if (this.fg2.value.Suend) {
          let endTimeSundayMoment = moment(this.fg2.value.Suend, "YYYY-MM-DD HH:mm");
          this.fg2.value.Suend = endTimeSundayMoment.isValid() ? endTimeSundayMoment.format("HH:mm") : '';
        } else {
          this.fg2.value.Suend = '';
        }
        
        let obj = {
          Day: "Sunday",
          StartTime: this.fg2.value.Sustart,
          EndTime: this.fg2.value.Suend,
          IsOpen: true,
          Session: 1
        };
        ct.push(obj);
      }

      // For Session 2 on Sunday
      if (this.fg2.value.SundayS2) {
        if (!this.fg2.value.Sustart2) { 
          this.fg2.controls["Sustart2"].setValue(''); 
        }
        if (!this.fg2.value.Suend2) { 
          this.fg2.controls["Suend2"].setValue(''); 
        }
        
        // Format start time for Session 2 on Sunday
        if (this.fg2.value.Sustart2) {
          let startTimeSundayMoment2 = moment(this.fg2.value.Sustart2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Sustart2 = startTimeSundayMoment2.isValid() ? startTimeSundayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Sustart2 = '';
        }
        
        // Format end time for Session 2 on Sunday
        if (this.fg2.value.Suend2) {
          let endTimeSundayMoment2 = moment(this.fg2.value.Suend2, "YYYY-MM-DD HH:mm");
          this.fg2.value.Suend2 = endTimeSundayMoment2.isValid() ? endTimeSundayMoment2.format("HH:mm") : '';
        } else {
          this.fg2.value.Suend2 = '';
        }
        
        let obj1 = {
          Day: "Sunday",
          StartTime: this.fg2.value.Sustart2,
          EndTime: this.fg2.value.Suend2,
          IsOpen: true,
          Session: 2
        };
        ct.push(obj1);
      }
    }
    ct = ct.filter(session => session.StartTime !== '' && session.EndTime !== '');
    this.fg1.value.ClinicTimings = ct;
    this.signupService.clinicData = this.fg1.value;
    this.router.navigate(["/signup/step3"]);
    //this.addNewClinic(this.fg1.value);
  }

  setTimeValidators() {
    if (this.fg2.value.MondayS1 && this.fg2.value.MondayS2) {
      const MEnd1 = Date.parse(this.fg2.value.Mend);
      const MStart2 = Date.parse(this.fg2.value.Mstart2);
      if (MStart2 <= MEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Mstart2"].setErrors(null);
    }

    if (this.fg2.value.MondayS1) {
      const MStart1 = Date.parse(this.fg2.value.Mstart);
      const MEnd1 = Date.parse(this.fg2.value.Mend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mstart"].setErrors(null);
      }
    }

    if (this.fg2.value.MondayS2) {
      const MStart2 = Date.parse(this.fg2.value.Mstart2);
      const MEnd2 = Date.parse(this.fg2.value.Mend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Mend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Mend"].setErrors(null);
      }
    }
  }

  setTimeValidatorsTuesday() {
    if (this.fg2.value.TuesdayS1 && this.fg2.value.TuesdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Tuend);
      const TuStart2 = Date.parse(this.fg2.value.Tustart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Tustart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tustart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Tustart2"].setErrors(null);
    }

    if (this.fg2.value.TuesdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Tustart);
      const MEnd1 = Date.parse(this.fg2.value.Tuend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Tustart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tustart"].setErrors(null);
      }
    }

    if (this.fg2.value.TuesdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Tustart2);
      const MEnd2 = Date.parse(this.fg2.value.Tuend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Tuend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Tuend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsWed() {
    if (this.fg2.value.WednesdayS1 && this.fg2.value.WednesdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Wend);
      const TuStart2 = Date.parse(this.fg2.value.Wstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        this.fg2.controls["Wstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Wstart2"].setErrors(null);
    }

    if (this.fg2.value.WednesdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Wstart);
      const MEnd1 = Date.parse(this.fg2.value.Wend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Wstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wstart"].setErrors(null);
      }
    }

    if (this.fg2.value.WednesdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Wstart2);
      const MEnd2 = Date.parse(this.fg2.value.Wend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Wend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Wend"].setErrors(null);
      }
    }
  }

  setTimeValidatorsThu() {
    if ((this.fg2.value.ThursdayS1) && (this.fg2.value.ThursdayS2)) {
      const TuEnd1 = Date.parse(this.fg2.value.Thend);
      const TuStart2 = Date.parse(this.fg2.value.Thstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Thstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Thstart2"].setErrors(null);
    }

    if (this.fg2.value.ThursdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Thstart);
      const MEnd1 = Date.parse(this.fg2.value.Thend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Thstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thstart"].setErrors(null);
      }
    }

    if (this.fg2.value.ThursdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Thstart2);
      const MEnd2 = Date.parse(this.fg2.value.Thend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Thend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Thend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsFri() {
    if (this.fg2.value.FridayS1 && this.fg2.value.FridayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Fend);
      const TuStart2 = Date.parse(this.fg2.value.Fstart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Fstart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fstart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Fstart2"].setErrors(null);
    }
    if (this.fg2.value.FridayS1) {
      const MStart1 = Date.parse(this.fg2.value.Fstart);
      const MEnd1 = Date.parse(this.fg2.value.Fend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Fstart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fstart"].setErrors(null);
      }
    }

    if (this.fg2.value.FridayS2) {
      const MStart2 = Date.parse(this.fg2.value.Fstart2);
      const MEnd2 = Date.parse(this.fg2.value.Fend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Fend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Fend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsSat() {
    if (this.fg2.value.SaturdayS1 && this.fg2.value.SaturdayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Saend);
      const TuStart2 = Date.parse(this.fg2.value.Sastart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Sastart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sastart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Sastart2"].setErrors(null);
    }

    if (this.fg2.value.SaturdayS1) {
      const MStart1 = Date.parse(this.fg2.value.Sastart);
      const MEnd1 = Date.parse(this.fg2.value.Saend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Sastart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sastart"].setErrors(null);
      }
    }

    if (this.fg2.value.SaturdayS2) {
      const MStart2 = Date.parse(this.fg2.value.Sastart2);
      const MEnd2 = Date.parse(this.fg2.value.Saend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Saend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Saend"].setErrors(null);
      }
    }
  }
  setTimeValidatorsSun() {
    if (this.fg2.value.SundayS1 && this.fg2.value.SundayS2) {
      const TuEnd1 = Date.parse(this.fg2.value.Suend);
      const TuStart2 = Date.parse(this.fg2.value.Sustart2);
      if (TuStart2 <= TuEnd1) {
        console.log(5);
        //Mstart2c.setValidators([Validators.maxLength(0)]);
        this.fg2.controls["Sustart2"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sustart2"].setErrors(null);
      }
    } else {
      this.fg2.controls["Sustart2"].setErrors(null);
    }
    if (this.fg2.value.SundayS1) {
      const MStart1 = Date.parse(this.fg2.value.Sustart);
      const MEnd1 = Date.parse(this.fg2.value.Suend);
      if (MEnd1 <= MStart1) {
        console.log(5);
        this.fg2.controls["Sustart"].setErrors({ required: true });
      } else {
        this.fg2.controls["Sustart"].setErrors(null);
      }
    }
    if (this.fg2.value.SundayS2) {
      const MStart2 = Date.parse(this.fg2.value.Sustart2);
      const MEnd2 = Date.parse(this.fg2.value.Suend2);
      if (MEnd2 <= MStart2) {
        console.log(5);
        this.fg2.controls["Suend"].setErrors({ required: true });
      } else {
        this.fg2.controls["Suend"].setErrors(null);
      }
    }
  }
 

  validation_messages = {
    Name: [{ type: "required", message: "Name is required." },
    { type: 'pattern', message: 'Please Enter Only Charecters in First Name.' }
    ],
    Address: [{ type: "required", message: "Address is required." }
    ],
    phoneNumber: [
      { type: "required", message: "Phone number is required" },

      {
        type: "minlength",
        message: "Phone Number must be at least 7 Digits long."
      },
      { type: "pattern", message: "Phone number must contain numeric digits" },
      {
        type: "maxlength",
        message: "Phone Number must be at least 11 Digits long."
      }
    ],
    ConsultationFee: [
      { type: "required", message: "ConsultationFee is required." },
      {
        type: "pattern",
        message: "Your Consultation Fee must contain positive number"
      }
    ],
    Mstart2: [
      { type: "required", message: "Session 2 Must Start after Session 1" }
    ],
    Mstart: [
      { type: "required", message: "End Time Must be after Start Time" }
    ],
    Mend: [{ type: "required", message: "End Time Must be after Start Time" }],
    Tustart2: [
      { type: "required", message: "Session 2 Must Start after Session 1" }
    ],
    Tustart: [
      { type: "required", message: "End Time Must be after Start Time" }
    ],
    Tuend: [{ type: "required", message: "End Time Must be after Start Time" }]
  };

}
