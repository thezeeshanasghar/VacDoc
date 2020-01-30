import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { LoadingController, Platform } from '@ionic/angular';
import { InvoiceService } from 'src/app/services/invoice.service';
import { ToastService } from 'src/app/shared/toast.service';
import * as moment from 'moment';

import { FileTransfer , FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.page.html',
  styleUrls: ['./invoice.page.scss'],
})
export class InvoicePage implements OnInit {

  fg: FormGroup
  doctorId: any;
  private readonly API_INVOICE = `${environment.BASE_URL}child/`;
  constructor(
    public loadingController: LoadingController,
    public formBuilder: FormBuilder,
    public route: ActivatedRoute,
    private storage: Storage,
    private invoiceService: InvoiceService,
    private toastService: ToastService,
    private platform: Platform,
    private file: File,
    private transfer: FileTransfer,
    private fileOpener: FileOpener,
    private document: DocumentViewer,
    private filePath: FilePath,


  ) { 
    
  }

  ngOnInit() {

    this.fg = this.formBuilder.group({
      'Id': [this.route.snapshot.paramMap.get('id')],
      'IsBrand': [false],
      'IsConsultationFee': [false],
      'InvoiceDate': [],
      'DoctorId': [],
    })
    this.storage.get(environment.DOCTOR_Id).then((val) => {
      this.doctorId = val;
    });
  }

  // async sendRequestForInvoice() {
  //   this.fg.value.DoctorId = this.doctorId;
  //   this.fg.value.InvoiceDate = moment(this.fg.value.InvoiceDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
  //   console.log(this.fg.value);
  //   const loading = await this.loadingController.create({
  //     message: 'Loading'
  //   });
  //   await loading.present();
  //   await this.invoiceService.getInvoice(this.fg.value)
  //     .subscribe(res => {
  //       if (res.IsSuccess) {

  //         loading.dismiss();
  //       }
  //       else {
  //         loading.dismiss();
  //         this.toastService.create('hello', 'danger');
  //       }
  //     }, (err) => {
  //       loading.dismiss();
  //       this.toastService.create('err')
  //     });
  // }

  downloadInvoice() {
    this.fg.value.DoctorId = this.doctorId;
   // this.fg.value.InvoiceDate = moment(this.fg.value.InvoiceDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
   // this.fg.value.InvoiceDate = moment(this.fg.value.InvoiceDate, 'YYYY-MM-DD');
    console.log(this.fg.value);
    const fileTransfer: FileTransferObject = this.transfer.create();
    // let path = this.file.externalApplicationStorageDirectory;
    let path = this.file.externalDataDirectory;
    this.filePath.resolveNativePath(path)
   .then(filePath => path = filePath);
      const url = `${this.API_INVOICE}${this.fg.value.Id}/${this.fg.value.IsBrand}/
      ${this.fg.value.IsConsultationFee}/${this.fg.value.InvoiceDate}/${this.fg.value.DoctorId}/Download-Invoice-PDF`;
    fileTransfer.download( url , path + 'invoice.pdf').then((entry) => {
      let durl = entry.toURL();
     // this.document.viewDocument(durl , 'application/pdf', {});
     this.fileOpener.open(durl, 'application/pdf').then(() => console.log('File is opened'));
      console.log('download complete: ' + entry.toURL());
    }, (error) => {
      // handle error
    });
  }

}
