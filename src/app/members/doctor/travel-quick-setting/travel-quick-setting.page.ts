import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import { DoseService } from "src/app/services/dose.service";
import { ToastService } from "src/app/shared/toast.service";

@Component({
  selector: "app-travel-quick-setting",
  templateUrl: "./travel-quick-setting.page.html",
  styleUrls: ["./travel-quick-setting.page.scss"]
})
export class TravelQuickSettingPage implements OnInit {
  readonly MAX = 4;
  doctorId: number;
  allDoses: any[] = [];
  selected: any[] = [];
  search = "";

  constructor(
    private storage: Storage,
    private doseService: DoseService,
    private toastService: ToastService,
    public loadingController: LoadingController
  ) {}

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    if (!this.doctorId) {
      return;
    }
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    this.doseService.getDoses().subscribe(
      res => {
        this.allDoses = res && res.IsSuccess ? res.ResponseData : [];
        this.doseService.getTravelQuick(this.doctorId).subscribe(
          r2 => {
            loading.dismiss();
            const ids = r2 && r2.IsSuccess && r2.ResponseData ? r2.ResponseData : [];
            this.selected = ids.map(q => ({ Id: q.DoseId, Name: q.DoseName }));
          },
          () => loading.dismiss()
        );
      },
      () => loading.dismiss()
    );
  }

  get results(): any[] {
    const q = (this.search || "").trim().toLowerCase();
    if (!q) {
      return [];
    }
    return this.allDoses
      .filter(d => !this.isSelected(d.Id) && (d.Name || "").toLowerCase().indexOf(q) !== -1)
      .slice(0, 30);
  }

  isSelected(doseId: number): boolean {
    return this.selected.some(s => s.Id === doseId);
  }

  add(dose: any) {
    if (this.selected.length >= this.MAX) {
      this.toastService.create("You can choose at most " + this.MAX + " vaccines.", "danger");
      return;
    }
    this.selected.push({ Id: dose.Id, Name: dose.Name });
    this.search = "";
  }

  remove(index: number) {
    this.selected.splice(index, 1);
  }

  async save() {
    const loading = await this.loadingController.create({ message: "Saving" });
    await loading.present();
    this.doseService.saveTravelQuick(this.doctorId, this.selected.map(s => s.Id)).subscribe(
      res => {
        loading.dismiss();
        this.toastService.create(res.IsSuccess ? "Travel quick select saved." : res.Message, res.IsSuccess ? "success" : "danger");
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }
}
