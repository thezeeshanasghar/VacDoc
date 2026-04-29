import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { HttpResponse } from '@angular/common/http';
import { ChildService } from 'src/app/services/child.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-immunization-card',
  templateUrl: './immunization-card.page.html',
  styleUrls: ['./immunization-card.page.scss']
})
export class ImmunizationCardPage implements OnInit {
  childId: number;
  childName: string = '';
  downloading: any = { front: false, vaccine: false, age: false };

  constructor(
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private childService: ChildService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.childId = Number(this.route.snapshot.paramMap.get('childId'));
    this.childName = this.route.snapshot.queryParamMap.get('name') || '';
  }

  async download(type: any) {
    this.downloading[type] = true;
    const loader = await this.loadingCtrl.create({ message: 'Generating PDF...' });
    await loader.present();

    this.childService.downloadImmunizationCard(this.childId, type).subscribe(
      (response: HttpResponse<Blob>) => {
        loader.dismiss();
        this.downloading[type] = false;
        const blob = new Blob([response.body], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const cd = response.headers.get('Content-Disposition');
        let filename = (this.childName || 'Child') + '_' + type + '_card.pdf';
        if (cd) {
          const m = /filename=(.*?)(;|$)/.exec(cd);
          if (m && m[1]) { filename = m[1].replace(/["']/g, ''); }
        }
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      () => {
        loader.dismiss();
        this.downloading[type] = false;
        this.toastService.create('Failed to download PDF', 'danger');
      }
    );
  }
}
