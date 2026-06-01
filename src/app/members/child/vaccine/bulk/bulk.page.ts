import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { BulkService } from "src/app/services/bulk.service";
import { ToastService } from "src/app/shared/toast.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Storage } from "@ionic/storage";
import { environment } from "src/environments/environment";
import * as moment from "moment";
import { AlertController } from "@ionic/angular";
import { VaccineService } from "src/app/services/vaccine.service";
import { ChildService } from "src/app/services/child.service";
import { StockService } from "src/app/services/stock.service";
import { ClinicService } from "src/app/services/clinic.service";
import { PaService } from "src/app/services/pa.service";

@Component({
  selector: "app-bulk",
  templateUrl: "./bulk.page.html",
  styleUrls: ["./bulk.page.scss"]
})
export class BulkPage implements OnInit {
  childId: any;
  doctorId: any;
  currentDate: any;
  currentDate1: any;
  bulkData: any;
  fg: FormGroup;
  todaydate: any;
  BrandIds: any[] = [];
  ohfSelections: boolean[] = [];
  brandSearchTerms: string[] = [];
  filteredBrandOptions: any[][] = [];
  customActionSheetOptions: any = {
    header: "Select Brand",
    cssClass: "action-sheet-class"
  };
  usertype: any;
  paId: number = null;
  allowInventory: boolean = true;
  childType: string = "";
  paymentMode: string = 'Cash';
  onlineService: string = '';
  clinicPAs: any[] = [];
  paymentCollectorPaId: number = null;
  childData: any = null;

  // Per-row inventory state
  manufacturerValues: string[] = [];
  availableBatchLotsPerRow: any[][] = [];
  availableLotsPerRow: string[][] = [];
  availableExpiriesPerRow: string[][] = [];
  selectedLotsPerRow: string[] = [];
  selectedExpiriesPerRow: string[] = [];

  // Clinic mismatch
  clinicId: any = null;
  onlineClinicId: any = null;
  onlineClinicName: string = "";
  onlineClinicDoctorId: any = null;

  private getTodayIsoDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  get isTravelType(): boolean {
    return (this.childType || "").toLowerCase() === "travel";
  }

  private applyTravelGivenDateToday(): void {
    if (this.isTravelType && this.fg) {
      this.fg.controls["GivenDate"].setValue(this.getTodayIsoDate());
    }
  }

  private isInfiniteVaccineElement(element: any): boolean {
    const dose = element && element.Dose ? element.Dose : null;
    const vaccine = dose && dose.Vaccine ? dose.Vaccine : null;
    const isInfiniteFlag = !!(vaccine && vaccine.isInfinite);
    const doseName = ((dose && dose.Name) || "").toString().toLowerCase();
    const vaccineName = ((vaccine && vaccine.Name) || "").toString().toLowerCase();
    const fullName = `${doseName} ${vaccineName}`;
    return (
      isInfiniteFlag ||
      doseName.startsWith("flu") ||
      doseName.startsWith("typhoid") ||
      fullName.includes("vitamin a")
    );
  }

  private resolveNextDoseGapDays(element: any): number {
    const dose = element && element.Dose ? element.Dose : null;
    const doseName = ((dose && dose.Name) || "").toString().toLowerCase();
    const minGap = Number(dose && dose.MinGap);
    if (!isNaN(minGap) && minGap > 0) { return minGap; }
    const maxAge = Number(dose && dose.MaxAge);
    if (!isNaN(maxAge) && maxAge > 0) { return maxAge; }
    if (doseName.startsWith("typhoid")) { return 1095; }
    if (doseName.startsWith("flu") || doseName.startsWith("vitamin a")) { return 365; }
    return 0;
  }

  constructor(
    private loadingController: LoadingController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private bulkService: BulkService,
    private toastService: ToastService,
    private storage: Storage,
    public alertController: AlertController,
    private vaccineService: VaccineService,
    private childService: ChildService,
    private stockService: StockService,
    private clinicService: ClinicService,
    private paService: PaService
  ) {}

  ngOnInit() {
    this.childId = this.activatedRoute.snapshot.paramMap.get("id");

    const dateParam = this.activatedRoute.snapshot.paramMap.get("childId") || "";
    this.currentDate = new Date(dateParam);
    this.currentDate1 = (moment as any)(this.currentDate).format("YYYY-MM-DD");
    this.todaydate = (moment as any)(new Date(), "DD-MM-YYYY").format("YYYY-MM-DD");

    this.fg = this.formBuilder.group({
      DoctorId: [""],
      Id: [null],
      Weight: ["", [Validators.pattern("^[0-9.]*$")]],
      Height: ["", [Validators.pattern("^[0-9.]*$")]],
      Circle: ["", [Validators.pattern("^[0-9.]*$")]],
      BrandId0: [null],
      BrandId1: [null],
      BrandId2: [null],
      BrandId3: [null],
      GivenDate: this.currentDate,
      IsPAApprove: [null],
      Validity: [""]
    });

    this.applyTravelGivenDateToday();

    // Resolve storage AND child data together so clinicId is fully known before getBulk fires
    const childDataPromise = new Promise<void>((resolve) => {
      this.childService.getChildById(this.childId).subscribe(
        (res) => {
          if (res && res.IsSuccess && res.ResponseData) {
            this.childData = res.ResponseData;
            this.childType = (res.ResponseData.Type || "").toString();
            this.clinicId = this.resolveClinicId(res.ResponseData) || this.clinicId;
            this.applyTravelGivenDateToday();
          }
          resolve();
        },
        () => { this.childType = ""; resolve(); }
      );
    });

    Promise.all([
      this.storage.get(environment.DOCTOR_Id),
      this.storage.get(environment.USER),
      this.storage.get(environment.ON_CLINIC),
      this.storage.get(environment.CLINIC_Id),
      childDataPromise
    ]).then(([docId, user, onlineClinic, storedClinicId]) => {
      this.doctorId = docId;

      if (user) {
        this.usertype = user.UserType;
        this.allowInventory = user.AllowInventory !== false;
        if (user.UserType === "PA") {
          this.paId = Number(user.PAId) || null;
        } else if (user.UserType === "DOCTOR" && user.DoctorId) {
          this.doctorId = Number(user.DoctorId);
        }
        if (user.UserType === "DOCTOR" && user.DoctorId) {
          this.paService.getPAsByDoctorId(String(user.DoctorId)).subscribe(res => {
            if (res && res.IsSuccess && res.ResponseData) {
              this.clinicPAs = res.ResponseData;
            }
          });
        }
      }

      const onlineId = onlineClinic && onlineClinic.Id ? Number(onlineClinic.Id) : null;
      if (onlineId && !isNaN(onlineId)) { this.onlineClinicId = onlineId; }
      this.onlineClinicName = (onlineClinic && onlineClinic.Name) ? String(onlineClinic.Name) : "";
      const docIdFromClinic = onlineClinic && onlineClinic.DoctorId ? Number(onlineClinic.DoctorId) : null;
      if (docIdFromClinic && !isNaN(docIdFromClinic)) { this.onlineClinicDoctorId = docIdFromClinic; }

      const storedId = Number(storedClinicId);
      if (!this.clinicId && storedId && !isNaN(storedId)) { this.clinicId = storedId; }

      // All sources resolved — clinicId is guaranteed set before getBulk triggers batch/lot loading
      this.getBulk();
    });
  }

  async getBulk() {
    const data = { ChildId: this.childId, Date: this.currentDate };
    const loading = await this.loadingController.create({ message: "Loading" });
    await loading.present();
    this.bulkService.getBulk(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.bulkData = res.ResponseData;
          this.initializeBrandSearch();
        } else {
          this.toastService.create(res.Message, "danger");
        }
        loading.dismiss();
      },
      err => {
        loading.dismiss();
        this.toastService.create(err, "danger");
      }
    );
  }

  private initializeBrandSearch(): void {
    const schedules: any[] = this.bulkData || [];
    this.brandSearchTerms = [];
    this.filteredBrandOptions = [];
    this.BrandIds = [];
    this.ohfSelections = [];
    this.manufacturerValues = [];
    this.availableBatchLotsPerRow = [];
    this.availableLotsPerRow = [];
    this.availableExpiriesPerRow = [];
    this.selectedLotsPerRow = [];
    this.selectedExpiriesPerRow = [];

    schedules.forEach((schedule: any, index: number) => {
      const brands = this.getSortedBrands(schedule);
      this.filteredBrandOptions[index] = brands;

      const scheduleBrandId = schedule && schedule.BrandId ? Number(schedule.BrandId) : null;
      const selectedBrand = scheduleBrandId
        ? brands.find((b: any) => b && Number(b.Id) === scheduleBrandId)
        : null;

      this.BrandIds[index] = selectedBrand ? selectedBrand.Id : null;
      this.brandSearchTerms[index] = selectedBrand ? selectedBrand.Name : "";
      this.ohfSelections[index] = false;
      this.manufacturerValues[index] = selectedBrand ? (selectedBrand.Manufacturer || "") : "";
      this.availableBatchLotsPerRow[index] = [];
      this.availableLotsPerRow[index] = [];
      this.availableExpiriesPerRow[index] = [];
      this.selectedLotsPerRow[index] = "";
      this.selectedExpiriesPerRow[index] = "";

      if (selectedBrand && this.BrandIds[index] && this.allowInventory) {
        this.loadBatchLotsForRow(index, Number(this.BrandIds[index]));
      }
    });
  }

  onBrandSearchChange(index: number, value: string): void {
    const term = (value || "").toString();
    this.brandSearchTerms[index] = term;
    const brands = this.getSortedBrands(this.bulkData && this.bulkData[index]);
    const normalized = term.toLowerCase().trim();

    if (normalized === "ohf") {
      this.ohfSelections[index] = true;
      this.BrandIds[index] = null;
      this.manufacturerValues[index] = "";
      this.clearLotsAndExpiries(index);
      return;
    }

    this.ohfSelections[index] = false;
    this.filteredBrandOptions[index] = normalized
      ? brands.filter((b: any) => ((b && b.Name) || "").toLowerCase().includes(normalized))
      : brands;

    const exactMatch = brands.find((b: any) => ((b && b.Name) || "").toLowerCase() === normalized);
    this.BrandIds[index] = exactMatch ? exactMatch.Id : null;
    this.manufacturerValues[index] = exactMatch ? (exactMatch.Manufacturer || "") : "";

    if (exactMatch && this.allowInventory) {
      this.loadBatchLotsForRow(index, Number(exactMatch.Id));
    } else {
      this.clearLotsAndExpiries(index);
    }
  }

  onBrandOptionSelected(index: number, selectedBrandName: string): void {
    this.brandSearchTerms[index] = selectedBrandName || "";
    if ((this.brandSearchTerms[index] || "").toLowerCase().trim() === "ohf") {
      this.ohfSelections[index] = true;
      this.BrandIds[index] = null;
      this.manufacturerValues[index] = "";
      this.clearLotsAndExpiries(index);
      return;
    }

    this.ohfSelections[index] = false;
    const brands = this.getSortedBrands(this.bulkData && this.bulkData[index]);
    const selectedBrand = brands.find((b: any) => b && b.Name === this.brandSearchTerms[index]);
    this.BrandIds[index] = selectedBrand ? selectedBrand.Id : null;
    this.manufacturerValues[index] = selectedBrand ? (selectedBrand.Manufacturer || "") : "";

    if (selectedBrand && this.BrandIds[index] && this.allowInventory) {
      this.loadBatchLotsForRow(index, Number(this.BrandIds[index]));
    } else {
      this.clearLotsAndExpiries(index);
    }
  }

  onBrandEnterKey(index: number, event: KeyboardEvent): void {
    event.preventDefault();
    const term = ((this.brandSearchTerms[index] || "") + "").toLowerCase().trim();
    if (!term) { return; }

    if (term === "ohf") {
      this.ohfSelections[index] = true;
      this.BrandIds[index] = null;
      this.brandSearchTerms[index] = "OHF";
      this.manufacturerValues[index] = "";
      this.clearLotsAndExpiries(index);
      return;
    }

    this.ohfSelections[index] = false;
    const brands = this.getSortedBrands(this.bulkData && this.bulkData[index]);
    const exactMatch = brands.find((b: any) => ((b && b.Name) || "").toLowerCase() === term);
    if (exactMatch) {
      this.brandSearchTerms[index] = exactMatch.Name;
      this.BrandIds[index] = exactMatch.Id;
      this.manufacturerValues[index] = exactMatch.Manufacturer || "";
      if (this.allowInventory) { this.loadBatchLotsForRow(index, Number(exactMatch.Id)); }
    }
  }

  private clearLotsAndExpiries(index: number): void {
    this.availableBatchLotsPerRow[index] = [];
    this.availableLotsPerRow[index] = [];
    this.availableExpiriesPerRow[index] = [];
    this.selectedLotsPerRow[index] = "";
    this.selectedExpiriesPerRow[index] = "";
  }

  private loadBatchLotsForRow(index: number, brandId: number): void {
    const clinicId = this.onlineClinicId || this.clinicId;
    if (!clinicId || !brandId) { this.clearLotsAndExpiries(index); return; }

    this.stockService.getBatchLotsByBrand(brandId, clinicId).subscribe(
      res => {
        const lots = (res && res.IsSuccess && res.ResponseData) ? res.ResponseData : [];
        const allLots: any[] = Array.isArray(lots) ? lots : [];

        // FEFO: sort by expiry date ascending
        allLots.sort((a: any, b: any) => {
          const dateA = a && a.Expiry ? new Date(a.Expiry).getTime() : Infinity;
          const dateB = b && b.Expiry ? new Date(b.Expiry).getTime() : Infinity;
          return dateA - dateB;
        });

        this.availableBatchLotsPerRow[index] = allLots;

        const seenLots: any = {};
        const uniqueLots: string[] = [];
        allLots.forEach((x: any) => {
          const lotStr = x && x.BatchLot ? String(x.BatchLot).trim() : "";
          if (lotStr && !seenLots[lotStr]) {
            seenLots[lotStr] = true;
            uniqueLots.push(lotStr);
          }
        });

        this.availableLotsPerRow[index] = uniqueLots;
        const firstLot = uniqueLots.length > 0 ? uniqueLots[0] : "";
        this.selectedLotsPerRow[index] = firstLot;
        this.refreshExpiriesForRow(index, firstLot);
      },
      () => { this.clearLotsAndExpiries(index); }
    );
  }

  onLotChange(index: number, event: any): void {
    const lotValue = event && event.detail ? event.detail.value : event;
    this.selectedLotsPerRow[index] = lotValue || "";
    this.refreshExpiriesForRow(index, this.selectedLotsPerRow[index]);
  }

  onExpiryChange(index: number, event: any): void {
    const expiryValue = event && event.detail ? event.detail.value : event;
    this.selectedExpiriesPerRow[index] = expiryValue || "";
  }

  private refreshExpiriesForRow(index: number, lotValue: string): void {
    if (!lotValue) {
      this.availableExpiriesPerRow[index] = [];
      this.selectedExpiriesPerRow[index] = "";
      return;
    }

    const allLots: any[] = this.availableBatchLotsPerRow[index] || [];
    const seen: any = {};
    const expiryKeys: string[] = [];
    allLots
      .filter((x: any) => (x && x.BatchLot ? String(x.BatchLot).trim() : "") === lotValue)
      .forEach((x: any) => {
        const key = this.toExpiryKey(x ? x.Expiry : null);
        if (key && !seen[key]) { seen[key] = true; expiryKeys.push(key); }
      });

    // FEFO: sort expiry dates ascending
    expiryKeys.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());

    this.availableExpiriesPerRow[index] = expiryKeys;
    const current = this.selectedExpiriesPerRow[index];
    if (!current || !expiryKeys.some((x) => x === current)) {
      this.selectedExpiriesPerRow[index] = expiryKeys.length > 0 ? expiryKeys[0] : "";
    }
  }

  private toExpiryKey(value: any): string {
    if (!value) { return ""; }
    const date = new Date(value);
    if (isNaN(date.getTime())) { return ""; }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  private getSortedBrands(schedule: any): any[] {
    const brands = (schedule && schedule.Brands) ? schedule.Brands : [];
    return [...brands].sort((a: any, b: any) =>
      ((a && a.Name) || "").toLowerCase().localeCompare(((b && b.Name) || "").toLowerCase())
    );
  }

  getBrandFieldHint(schedule: any, index: number): string {
    const vaccineName = ((schedule && schedule.Dose && schedule.Dose.Vaccine && schedule.Dose.Vaccine.Name) || "").trim();
    const doseName = ((schedule && schedule.Dose && schedule.Dose.Name) || "").trim();
    const doseOrder = schedule && schedule.Dose && schedule.Dose.DoseOrder
      ? `Dose ${schedule.Dose.DoseOrder}`
      : `Item ${index + 1}`;

    if (vaccineName && doseName && vaccineName.toLowerCase() !== doseName.toLowerCase()) {
      return `${doseOrder}: ${vaccineName} (${doseName})`;
    }
    if (doseName) { return `${doseOrder}: ${doseName}`; }
    if (vaccineName) { return `${doseOrder}: ${vaccineName}`; }
    return `${doseOrder}: Select brand`;
  }

  async onSubmit() {
    this.applyTravelGivenDateToday();

    const canProceed = await this.confirmAndHandleClinicMismatch();
    if (!canProceed) { return; }

    const brands: any[] = [];
    let i = 0;
    this.bulkData.forEach((element: any) => {
      const lotVal = this.allowInventory ? (this.selectedLotsPerRow[i] || "") : "";
      const expiryVal = this.allowInventory ? (this.selectedExpiriesPerRow[i] || null) : null;
      const manufacturerVal = this.manufacturerValues[i] || "";

      brands.push({
        BrandId: this.ohfSelections[i] ? null : (this.BrandIds[i] || null),
        ScheduleId: element.Id,
        Manufacturer: manufacturerVal,
        Lot: lotVal,
        Expiry: expiryVal
      });
      i++;
    });

    this.fg.value.IsPAApprove = this.usertype === "DOCTOR";

    var data: any = {
      Circle: this.fg.value.Circle,
      Date: this.fg.value.Date,
      DoctorId: this.doctorId,
      GivenDate: this.fg.value.GivenDate,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: true,
      ScheduleBrands: brands,
      Id: this.bulkData[0].Id,
      IsPAApprove: this.fg.value.IsPAApprove,
      Validity: this.isTravelType ? (this.fg.value.Validity || "") : null,
      PaymentMode: this.paymentMode,
      OnlineService: this.paymentMode === 'Online Transfer' ? this.onlineService : null,
      PaymentCollectorPaId: this.paymentCollectorPaId || null
    };
    if (this.usertype === 'PA' && this.paId) {
      data.PaId = this.paId;
    }

    this.fillVaccine(data);
  }

  isScheduleDateValid(): boolean {
    const today = new Date().toISOString().split("T")[0];
    const control = this.fg.get("GivenDate");
    const givenDate = control ? control.value : null;
    if (!givenDate) { return false; }
    const formattedDate = new Date(givenDate).toISOString().split("T")[0];
    return formattedDate > today;
  }

  async fillVaccine(data: any) {
    this.applyTravelGivenDateToday();
    data.GivenDate = (moment as any)(this.fg.value.GivenDate, "YYYY-MM-DD").format("DD-MM-YYYY");

    const loading = await this.loadingController.create({ message: "Filling Vaccine" });
    await loading.present();

    const givenDate = new Date(this.fg.value.GivenDate);
    const currentDate = new Date();
    givenDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (givenDate > currentDate) {
      this.toastService.create("Given date is not today. Cannot update injection.", "danger");
      loading.dismiss();
      return;
    }

    this.bulkService.updateVaccine(data).subscribe(
      res => {
        if (res.IsSuccess) {
          this.toastService.create("Successfully Update");
          this.validationOfInfiniteVaccine();
          loading.dismiss();
        } else {
          this.toastService.create(this.getApiErrorMessage(res, "Error: failed to fill vaccine"), "danger");
          loading.dismiss();
        }
      },
      err => {
        this.toastService.create(this.getApiErrorMessage(err, "Error: server failure"), "danger");
        loading.dismiss();
      }
    );
  }

  private getApiErrorMessage(source: any, fallback: string): string {
    const direct = source && source.Message;
    if (typeof direct === "string" && direct.trim()) { return direct; }
    const nested = source && source.error && source.error.Message;
    if (typeof nested === "string" && nested.trim()) { return nested; }
    return fallback;
  }

  async validationOfInfiniteVaccine() {
    const loading = await this.loadingController.create({ message: "Adding Infinite Vaccines" });
    await loading.present();

    const promises: Promise<void>[] = [];
    this.bulkData.forEach((element: any) => {
      if (this.isInfiniteVaccineElement(element)) {
        promises.push(this.addNewVaccineInScheduleTable(element));
      }
    });

    try {
      await Promise.all(promises);
      loading.dismiss();
      this.router.navigate(["/members/child/vaccine/" + this.childId]);
    } catch (error) {
      loading.dismiss();
      this.toastService.create("Error adding infinite vaccines", "danger");
      console.error("Error in validationOfInfiniteVaccine:", error);
    }
  }

  async addNewVaccineInScheduleTable(element: any): Promise<void> {
    const gapDays = this.resolveNextDoseGapDays(element);
    const scheduleDate: Date = this.calculateDateByMinGap(this.fg.value.GivenDate, gapDays);
    scheduleDate.setHours(0, 0, 0, 0);

    const scheduleDateText = (moment as any)(scheduleDate).format("DD-MM-YYYY");
    const givenDateText = (moment as any)(this.fg.value.GivenDate, ["YYYY-MM-DD", "DD-MM-YYYY", (moment as any).ISO_8601]).format("DD-MM-YYYY");

    const VaccineData = {
      Date: scheduleDateText,
      DoctorId: this.doctorId,
      GivenDate: givenDateText,
      Height: this.fg.value.Height,
      Weight: this.fg.value.Weight,
      IsDone: false,
      ChildId: this.childId,
      DoseId: element.Dose.Id,
      IsSkip: false
    };

    return new Promise((resolve, reject) => {
      this.vaccineService.AddChildSchedule(VaccineData).subscribe(
        res => {
          if (res.IsSuccess) {
            console.log(`Added infinite vaccine: ${element.Dose.Name}`);
            resolve();
          } else {
            const message = this.getApiErrorMessage(res, `Error: failed to add injection for ${element.Dose.Name}`);
            this.toastService.create(message, "danger");
            reject(new Error(message));
          }
        },
        err => {
          const message = this.getApiErrorMessage(err, `Error: server failure while adding ${element.Dose.Name}`);
          this.toastService.create(message, "danger");
          reject(new Error(message));
        }
      );
    });
  }

  // Clinic mismatch (mirrors fill.page.ts)
  private resolveClinicId(payload: any): any {
    if (!payload) { return null; }
    const raw =
      payload.ClinicId ||
      payload.clinicId ||
      (payload.Child && (payload.Child.ClinicId || payload.Child.clinicId)) ||
      (payload.child && (payload.child.ClinicId || payload.child.clinicId));
    const id = Number(raw);
    return id && !isNaN(id) ? id : null;
  }

  private getRegisteredClinicId(): any {
    return this.resolveClinicId(this.childData) || null;
  }

  private async confirmAndHandleClinicMismatch(): Promise<boolean> {
    // Re-read from storage to pick up any clinic switch that happened after page load
    const freshClinic = await this.storage.get(environment.ON_CLINIC);
    if (freshClinic && freshClinic.Id) {
      this.onlineClinicId = Number(freshClinic.Id);
      this.onlineClinicName = freshClinic.Name || "";
      this.onlineClinicDoctorId = Number(freshClinic.DoctorId) || this.onlineClinicDoctorId;
    }
    const onlineId = this.onlineClinicId || this.clinicId;
    const registeredId = this.getRegisteredClinicId();
    if (!onlineId || !registeredId || onlineId === registeredId) { return true; }

    const registeredName = await this.getClinicNameById(registeredId);
    const clinicDisplay = registeredName || `ID ${registeredId}`;
    const alert = await this.alertController.create({
      header: "Different Registered Clinic",
      message: `This patient is registered in a different clinic (${clinicDisplay}). Do you want to change the patient's base clinic to ${this.onlineClinicName || `ID ${onlineId}`} and continue?`,
      buttons: [
        { text: "No: proceed with injection and use stock from online clinic", role: "cancel" },
        { text: "Yes, Change", role: "confirm" }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result && result.role === "confirm") {
      return this.updatePatientBaseClinicToOnlineClinic();
    }
    return true;
  }

  private async getClinicNameById(clinicId: any): Promise<string> {
    return new Promise((resolve) => {
      this.clinicService.getClinicById(String(clinicId)).subscribe(
        (res) => {
          resolve(res && res.IsSuccess && res.ResponseData && res.ResponseData.Name
            ? String(res.ResponseData.Name)
            : "");
        },
        () => resolve("")
      );
    });
  }

  private async updatePatientBaseClinicToOnlineClinic(): Promise<boolean> {
    const onlineId = this.onlineClinicId || this.clinicId;
    const effectiveDoctorId = this.onlineClinicDoctorId || this.doctorId;

    if (!this.childId || !effectiveDoctorId || !onlineId) {
      this.toastService.create("Unable to change patient clinic. Missing clinic or doctor context.", "danger");
      return false;
    }

    const loading = await this.loadingController.create({ message: "Changing patient base clinic" });
    await loading.present();

    return new Promise((resolve) => {
      this.childService.updateChildClinicId(effectiveDoctorId, this.childId, onlineId).subscribe(
        () => {
          if (this.childData) { this.childData.ClinicId = onlineId; }
          this.toastService.create("Patient base clinic updated successfully.", "success");
          loading.dismiss();
          resolve(true);
        },
        (err) => {
          const message = (err && err.error) ? err.error : "Failed to update patient base clinic.";
          this.toastService.create(message, "danger");
          loading.dismiss();
          resolve(false);
        }
      );
    });
  }

  isSubmitDisabled(): boolean {
    return false;
  }

  private calculateDateByMinGap(date: any, days: number): Date {
    const baseDate = this.toLocalDate(date);
    const gapDays = !isNaN(Number(days)) ? Number(days) : 0;

    if (gapDays === 30 || gapDays === 31) { return this.addMonths(baseDate, 1); }
    if (gapDays === 150) { return this.addMonths(baseDate, 5); }
    if (gapDays === 84) { return this.addMonths(baseDate, 3); }
    if (gapDays === 3315) { return this.addMonths(this.addYears(baseDate, 9), 1); }
    if (gapDays === 3833) { return this.addMonths(this.addYears(baseDate, 10), 6); }
    if (gapDays >= 365 && gapDays <= 9125 && gapDays % 365 === 0) {
      return this.addYears(baseDate, Math.floor(gapDays / 365));
    }
    if (gapDays >= 168 && gapDays <= 334) { return this.addMonths(baseDate, Math.floor(gapDays / 28)); }
    if (gapDays >= 401 && gapDays <= 460) { return this.addMonths(baseDate, gapDays - 400); }
    if (gapDays >= 395 && gapDays <= 608) { return this.addMonths(baseDate, Math.floor(gapDays / 29)); }
    if (gapDays >= 639 && gapDays <= 1795) { return this.addMonths(baseDate, Math.floor(gapDays / 30)); }

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + gapDays);
    return nextDate;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addYears(date: Date, years: number): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private toLocalDate(input: any): Date {
    if (input instanceof Date) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    if (typeof input === "string") {
      const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
      const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
      let m = input.match(ddmmyyyy);
      if (m) { return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); }
      m = input.match(yyyymmdd);
      if (m) { return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); }
    }
    const fallback = new Date(input);
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
}
