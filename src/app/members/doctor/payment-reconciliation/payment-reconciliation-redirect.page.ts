import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-reconciliation-redirect',
  template: ''
})
export class PaymentReconciliationRedirectPage implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const queryParams: any = { view: 'cash' };
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('clinicId')) { queryParams.clinicId = qp.get('clinicId'); }
    if (qp.get('paId')) { queryParams.paId = qp.get('paId'); }
    this.router.navigate(['/members/doctor/pa-assignment-tracking'], { queryParams, replaceUrl: true });
  }
}
