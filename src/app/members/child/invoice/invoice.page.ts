import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { LoadingController } from '@ionic/angular';
import { InvoiceService } from 'src/app/services/invoice.service';
import { ToastService } from 'src/app/shared/toast.service';
import * as moment from 'moment';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.page.html',
  styleUrls: ['./invoice.page.scss'],
})
export class InvoicePage implements OnInit {

  fg: FormGroup
  doctorId:any;
  constructor(
    public loadingController: LoadingController,
    public formBuilder: FormBuilder,
    public route: ActivatedRoute,
    private storage: Storage,
    private invoiceService: InvoiceService,
    private toastService: ToastService
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

  async sendRequestForInvoice() {
    this.fg.value.DoctorID = this.doctorId;
    this.fg.value.InvoiceDate = moment(this.fg.value.InvoiceDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    console.log(this.fg.value);
    const loading = await this.loadingController.create({
      message: 'Loading'
    });
    await loading.present();
    await this.invoiceService.getInvoice(this.fg.value)
      .subscribe(res => {
        if (res.IsSuccess) {

          loading.dismiss();
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message);
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err)
      });
  }

}
