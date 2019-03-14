import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { LoadingController, Platform } from '@ionic/angular';
import { InvoiceService } from 'src/app/services/invoice.service';
import { ToastService } from 'src/app/shared/toast.service';
import * as moment from 'moment';

import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.page.html',
  styleUrls: ['./invoice.page.scss'],
})
export class InvoicePage implements OnInit {

  fg: FormGroup
  doctorId: any;
  constructor(
    public loadingController: LoadingController,
    public formBuilder: FormBuilder,
    public route: ActivatedRoute,
    private storage: Storage,
    private invoiceService: InvoiceService,
    private toastService: ToastService,
    private platform: Platform,
    private file: File,
    private ft: FileTransfer,
    private fileOpener: FileOpener,
    private document: DocumentViewer,


  ) { }

  ngOnInit() {

    this.fg = this.formBuilder.group({
      'ID': [this.route.snapshot.paramMap.get('id')],
      'IsBrand': [false],
      'IsConsultationFee': [false],
      'InvoiceDate': [],
      'DoctorID': [],
    })
    this.storage.get(environment.DOCTOR_ID).then((val) => {
      this.doctorId = val;
    });
  }

  // async sendRequestForInvoice() {
  //   this.fg.value.DoctorID = this.doctorId;
  //   this.fg.value.InvoiceDate = moment(this.fg.value.InvoiceDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
  //   console.log(this.fg.value);
  //   const loading = await this.loadingController.create({
  //     message: 'Loading'
  //   });
  //   await loading.present();
  //   await this.invoiceService.getInvoice()
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

  download() {
    let downloadUrl = 'https://devdactic.com/html/5-simple-hacks-LBT.pdf';
    let path = this.file.dataDirectory;
    const transfer = this.ft.create();

    transfer.download(downloadUrl, `${path}myfile.pdf`).then(entry => {
      let url = entry.toURL();

      if (this.platform.is('ios')) {
        this.document.viewDocument(url, 'application/pdf', {});
      }
      else {
        this.fileOpener.open(url, 'application/pdf');
      }
    });
  }

}
