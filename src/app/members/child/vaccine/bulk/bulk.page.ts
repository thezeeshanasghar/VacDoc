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
import { FollowupService } from "src/app/services/followup.service";

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
  selectedValidityPerRow: string[] = [];

  // Per-row Route/Site state. Route = fixed from brand (read-only). Site = constrained by Route,
  // auto-distributed across doses, nurse-editable. Same ROUTE_SITES source of truth as fill.page.
  static readonly ROUTE_SITES: { [route: string]: string[] } = {
    Oral: ['Oral'],
    Intranasal: ['Intranasal'],
    ID: ['R Arm', 'L Arm'],
    IM: ['R Thigh', 'L Thigh', 'R Deltoid', 'L Deltoid'],
    SC: ['R Thigh', 'L Thigh', 'R Deltoid', 'L Deltoid'],
  };
  routeValues: string[] = [];
  siteValues: string[] = [];
  availableSitesPerRow: string[][] = [];
  siteLockedPerRow: boolean[] = [];

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
    private paService: PaService,
    private followupService: FollowupService
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
      IsPAApprove: [null]
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
        // Inventory is on only when the doctor allows it AND the online clinic has opted in.
        this.allowInventory = user.AllowInventory !== false
          && (!onlineClinic || onlineClinic.MaintainInventory !== false);
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
    this.selectedValidityPerRow = [];
    this.routeValues = [];
    this.siteValues = [];
    this.availableSitesPerRow = [];
    this.siteLockedPerRow = [];

    schedules.forEach((schedule: any, index: number) => {
      const brands = this.getSortedBrands(schedule);
      this.filteredBrandOptions[index] = brands;

      const scheduleBrandId = schedule && schedule.BrandId ? Number(schedule.BrandId) : null;
      const selectedBrand = scheduleBrandId
        ? brands.find((b: any) => b && Number(b.Id) === scheduleBrandId)
        : null;

      this.BrandIds[index] = selectedBrand ? selectedBrand.Id : null;
      this.brandSearchTerms[index] = selectedBrand ? selectedBrand.Name : "OHF";
      this.ohfSelections[index] = !selectedBrand;
      this.manufacturerValues[index] = selectedBrand ? (selectedBrand.Manufacturer || "") : "";
      this.routeValues[index] = selectedBrand ? (selectedBrand.Route || selectedBrand.route || "") : "";
      this.siteValues[index] = "";
      this.availableSitesPerRow[index] = [];
      this.siteLockedPerRow[index] = false;
      this.availableBatchLotsPerRow[index] = [];
      this.availableLotsPerRow[index] = [];
      this.availableExpiriesPerRow[index] = [];
      this.selectedLotsPerRow[index] = "";
      this.selectedExpiriesPerRow[index] = "";
      this.selectedValidityPerRow[index] = (schedule && schedule.Validity != null) ? String(schedule.Validity) : "";

      if (selectedBrand && this.BrandIds[index] && this.allowInventory) {
        this.loadBatchLotsForRow(index, Number(this.BrandIds[index]));
      }
    });

    this.recomputeSiteDistribution();
  }

  // Site helpers ------------------------------------------------------------------------

  private brandById(index: number, brandId: any): any {
    const brands = this.getSortedBrands(this.bulkData && this.bulkData[index]);
    return brands.find((b: any) => b && b.Id == brandId) || null;
  }

  private childAgeYears(): number | null {
    const dob = this.childData && this.childData.DOB;
    if (!dob) { return null; }
    const m = moment(dob, 'DD-MM-YYYY');
    if (!m.isValid()) { return null; }
    return moment().diff(m, 'years');
  }

  // "Fill R+L then other muscle": walk injectable (multi-site) rows in order and assign
  // R[base] -> L[base] -> R[other] -> L[other] -> wrap. Single-site rows (Oral/Intranasal) take
  // their forced site and are skipped from the rotation. No re-flow: a row the nurse already
  // changed (siteValues set to something other than its previous auto value) is left alone here
  // only on explicit override via selectBulkSite(); this method (re)seeds defaults.
  recomputeSiteDistribution(): void {
    const age = this.childAgeYears();
    const base = (age !== null && age >= 5) ? 'Deltoid' : 'Thigh';
    const other = base === 'Deltoid' ? 'Thigh' : 'Deltoid';
    // rotation order for multi-site muscle routes (IM/SC)
    const rotation = ['R ' + base, 'L ' + base, 'R ' + other, 'L ' + other];
    let rot = 0;

    const rows = (this.bulkData || []);
    rows.forEach((_row: any, i: number) => {
      const route = this.routeValues[i] || '';
      const sites = BulkPage.ROUTE_SITES[route] || [];
      this.availableSitesPerRow[i] = sites;

      if (sites.length === 0) {
        this.siteLockedPerRow[i] = false;
        this.siteValues[i] = '';
        return;
      }
      if (sites.length === 1) {
        this.siteLockedPerRow[i] = true;
        this.siteValues[i] = sites[0];
        return;
      }
      // Multi-site: prefer valid brand default, else next slot in the R+L rotation.
      this.siteLockedPerRow[i] = false;
      const brand = this.brandById(i, this.BrandIds[i]);
      const bDefault = brand ? (brand.SiteDefault || brand.siteDefault || '') : '';
      if (bDefault && sites.indexOf(bDefault) !== -1) {
        this.siteValues[i] = bDefault;
      } else {
        let pick = rotation[rot % rotation.length];
        if (sites.indexOf(pick) === -1) { pick = sites[0]; }
        this.siteValues[i] = pick;
        rot++;
      }
    });
  }

  // Recompute just one row's options + default after its brand changes (does not re-flow others).
  private computeRowSite(index: number): void {
    const route = this.routeValues[index] || '';
    const sites = BulkPage.ROUTE_SITES[route] || [];
    this.availableSitesPerRow[index] = sites;
    if (sites.length === 0) { this.siteLockedPerRow[index] = false; this.siteValues[index] = ''; return; }
    if (sites.length === 1) { this.siteLockedPerRow[index] = true; this.siteValues[index] = sites[0]; return; }
    this.siteLockedPerRow[index] = false;
    const brand = this.brandById(index, this.BrandIds[index]);
    const bDefault = brand ? (brand.SiteDefault || brand.siteDefault || '') : '';
    if (bDefault && sites.indexOf(bDefault) !== -1) { this.siteValues[index] = bDefault; return; }
    const age = this.childAgeYears();
    const muscle = (age !== null && age >= 5) ? 'Deltoid' : 'Thigh';
    let def = 'R ' + muscle;
    if (sites.indexOf(def) === -1) { def = sites[0]; }
    this.siteValues[index] = def;
  }

  // Chip tap handler for a bulk row.
  selectBulkSite(index: number, site: string): void {
    if (this.siteLockedPerRow[index]) { return; }
    this.siteValues[index] = site;
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
      this.routeValues[index] = "";
      this.computeRowSite(index);
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
    this.routeValues[index] = exactMatch ? (exactMatch.Route || exactMatch.route || "") : "";
    this.computeRowSite(index);

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
      this.routeValues[index] = "";
      this.computeRowSite(index);
      this.clearLotsAndExpiries(index);
      return;
    }

    this.ohfSelections[index] = false;
    const brands = this.getSortedBrands(this.bulkData && this.bulkData[index]);
    const selectedBrand = brands.find((b: any) => b && b.Name === this.brandSearchTerms[index]);
    this.BrandIds[index] = selectedBrand ? selectedBrand.Id : null;
    this.manufacturerValues[index] = selectedBrand ? (selectedBrand.Manufacturer || "") : "";
    this.routeValues[index] = selectedBrand ? (selectedBrand.Route || selectedBrand.route || "") : "";
    this.computeRowSite(index);

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
      this.routeValues[index] = "";
      this.computeRowSite(index);
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
      this.routeValues[index] = exactMatch.Route || exactMatch.route || "";
      this.computeRowSite(index);
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

  onValidityChange(index: number, event: any): void {
    const validityValue = event && event.detail ? event.detail.value : event;
    this.selectedValidityPerRow[index] = validityValue || "";
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
      const validityVal = this.isTravelType && this.selectedValidityPerRow[i]
        ? Number(this.selectedValidityPerRow[i])
        : null;

      brands.push({
        BrandId: this.ohfSelections[i] ? null : (this.BrandIds[i] || null),
        ScheduleId: element.Id,
        Manufacturer: manufacturerVal,
        Site: this.siteValues[i] || null,   // nurse-chosen site for this dose (Route re-derived on server)
        Lot: lotVal,
        Expiry: expiryVal,
        Validity: validityVal
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

  // v2 (§6.2a): backdated bulk give with real brands — ask ONCE for the whole batch whether the
  // vaccines came from our stock. Resolves 'stock' (deduct), 'historical' (no deduct), or 'cancel'.
  async askReRecordChoice(): Promise<'stock' | 'historical' | 'cancel'> {
    return new Promise(async resolve => {
      const alert = await this.alertController.create({
        header: 'These doses are backdated',
        message: 'Were these vaccines taken from your current stock, or are you just recording past doses?',
        backdropDismiss: false,
        buttons: [
          { text: 'Just recording — don\'t deduct', handler: () => resolve('historical') },
          { text: 'From our stock — deduct', handler: () => resolve('stock') }
        ]
      });
      await alert.present();
    });
  }

  // §10 twin echo: if any chosen brand in the batch has a case-only look-alike, confirm once
  // (listing them) before the give proceeds. Returns false to abort.
  async confirmTwinBrands(data: any): Promise<boolean> {
    if (!Array.isArray(data.ScheduleBrands)) { return true; }
    const chosenIds = data.ScheduleBrands.filter((b: any) => b && b.BrandId).map((b: any) => Number(b.BrandId));
    if (chosenIds.length === 0) { return true; }

    // Look up each chosen brand across the per-row option lists to read HasCaseTwin.
    const allBrands = ([] as any[]).concat(...(this.filteredBrandOptions || []));
    const twinNames: string[] = [];
    chosenIds.forEach(id => {
      const b = allBrands.find(x => x && Number(x.Id) === id);
      if (b && b.HasCaseTwin && twinNames.indexOf(b.Name) < 0) { twinNames.push(b.Name); }
    });
    if (twinNames.length === 0) { return true; }

    return await new Promise<boolean>(async resolve => {
      const alert = await this.alertController.create({
        header: 'Confirm the exact brand',
        message: `⚠ ${twinNames.map(n => `"${n}"`).join(', ')} ` +
                 `${twinNames.length > 1 ? 'each have' : 'has'} a look-alike with different ` +
                 `capitalisation. Make sure you picked the right one.`,
        buttons: [
          { text: 'Back', role: 'cancel', handler: () => resolve(false) },
          { text: 'Yes, correct', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  async fillVaccine(data: any) {
    if (!(await this.confirmTwinBrands(data))) {
      return;
    }

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

    // v2 deduction-decision prompt (§6.2a): a backdated bulk give containing at least one real
    // brand is ambiguous — ask ONCE for the whole batch. Today / OHF-only / pre-period batches
    // are auto-decided by the backend and never prompt. OHF entries in the batch are unaffected.
    const isBackdatedBulk = givenDate < currentDate;
    const hasRealBrand = Array.isArray(data.ScheduleBrands)
      && data.ScheduleBrands.some((b: any) => b && b.BrandId);
    if (isBackdatedBulk && hasRealBrand) {
      loading.dismiss();
      const choice = await this.askReRecordChoice();
      if (choice === 'cancel') { return; }
      data.ReRecordHistorical = (choice === 'historical');
      await loading.present();
    } else {
      data.ReRecordHistorical = null;
    }

    this.bulkService.updateVaccine(data).subscribe(
      async res => {
        if (res.IsSuccess) {
          this.toastService.create("Successfully Update");
          this.autoCreateFollowUpForBulk(() => {
            this.validationOfInfiniteVaccine();
            loading.dismiss();
          });
        } else if (res.IsWarning) {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Rule Violation',
            message: res.Message,
            buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                text: 'Ignore & Inject',
                handler: () => {
                  data.IgnoreMinAgeAtGiveTime = true;
                  data.IgnoreMinGapAtGiveTime = true;
                  data.IgnoreMaxAgeAtGiveTime = true;
                  this.bulkService.updateVaccine(data).subscribe(
                    res2 => {
                      if (res2.IsSuccess) {
                        this.toastService.create("Successfully Update");
                        this.autoCreateFollowUpForBulk(() => {
                          this.validationOfInfiniteVaccine();
                        });
                      } else {
                        this.toastService.create(this.getApiErrorMessage(res2, "Error: failed to fill vaccine"), "danger");
                      }
                    },
                    err2 => { this.toastService.create(this.getApiErrorMessage(err2, "Error: server failure"), "danger"); }
                  );
                }
              }
            ]
          });
          await alert.present();
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

  private autoCreateFollowUpForBulk(onDone: () => void): void {
    this.storage.get(environment.DOCTOR_Id).then(realDoctorId => {
      const today = moment().format('DD-MM-YYYY');
      // NextVisitDate is always null for auto-vaccine follow-up rows: vaccine
      // reminders are driven by the Schedule table, not by FollowUp.NextVisitDate.
      const payload = {
        ChildId: Number(this.childId),
        DoctorId: Number(realDoctorId),
        Disease: 'Vaccination',
        CurrentVisitDate: today,
        NextVisitDate: null,
        Weight: this.fg.value.Weight ? Number(this.fg.value.Weight) : null,
        Height: this.fg.value.Height ? Number(this.fg.value.Height) : null,
        OFC: this.fg.value.Circle ? Number(this.fg.value.Circle) : null,
      };
      this.followupService.addFollowupByChild(payload).subscribe(
        () => { onDone(); },
        err => { console.error('Auto follow-up create failed (bulk):', err); onDone(); }
      );
    });
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
      backdropDismiss: false,
      buttons: [
        { text: "Cancel", role: "cancel" },
        { text: "No: proceed with injection and use stock from online clinic", role: "use-online-stock" },
        { text: "Yes, Change", role: "change-clinic" }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    const role = result && result.role;

    if (role === "change-clinic") {
      return this.updatePatientBaseClinicToOnlineClinic();
    }
    if (role === "use-online-stock") {
      return true;
    }
    return false;
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
