import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.page.html',
  styleUrls: ['./invoice.page.scss'],
})
export class InvoicePage implements OnInit {

  fg: FormGroup
  constructor(
    public formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.fg = this.formBuilder.group({
      
    })
  }

}
