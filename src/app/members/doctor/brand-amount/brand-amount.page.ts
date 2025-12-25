import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { BrandService, BrandAmountDTO } from 'src/app/services/brand.service';
import { ClinicService } from 'src/app/services/clinic.service'; 
import { PaService } from 'src/app/services/pa.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';

@Component({
  selector: 'app-brand-amount',
  templateUrl: './brand-amount.page.html',
  styleUrls: ['./brand-amount.page.scss'],
})
export class BrandAmountPage implements OnInit {
  brandAmounts: BrandAmountDTO[] = [];
  originalBrandAmounts: BrandAmountDTO[] = []; // Store original data for updates
  brandGroupMap: Map<string, BrandAmountDTO[]> = new Map(); // Map merged brands to originals
  fg: FormGroup
  clinics: any;
  selectedClinicId: any;
  doctorId: any;
  usertype: any; 
  online: Promise<any>;
  clinicId: any;
  constructor(
    public loadingController: LoadingController,
    private storage: Storage,
    private brandService: BrandService,
    private toastService: ToastService,
    public clinicService: ClinicService,
    private paService: PaService,
  ) { }

  async ngOnInit() {
    this.doctorId = await this.storage.get(environment.DOCTOR_Id);
    // console.log('Doctor ID:', this.doctorId);
    if (!this.doctorId) {
      console.error('Doctor ID not found');
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }
    this.usertype = await this.storage.get(environment.USER);
    // console.log('User Type:', this.usertype);
    this.clinicId = await this.storage.get(environment.CLINIC_Id);
    // console.log('Clinic ID:', this.clinicId);
    if (!this.doctorId) {
      console.error('Doctor ID not found');
      this.toastService.create('Doctor ID not found', 'danger');
      return;
    }
   await this.loadClinics();
  }

  async loadClinics() {
    try {
      const loading = await this.loadingController.create({
        message: 'Loading clinics...',
      });
      await loading.present();
      if (this.usertype.UserType === 'DOCTOR') {
        this.clinicService.getClinics(Number(this.doctorId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('Clinics:', this.clinics);
              this.selectedClinicId = this.clinicId || (this.clinics.length > 0 ? this.clinics[0].Id : null);
              console.log('Selected Clinic ID:', this.selectedClinicId);
              if (this.selectedClinicId) {
                this.getBrandAmount(this.selectedClinicId);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      } else if (this.usertype.UserType === 'PA') {
        this.paService.getPaClinics(Number(this.usertype.PAId)).subscribe({
          next: (response) => {
            loading.dismiss();
            if (response.IsSuccess) {
              this.clinics = response.ResponseData;
              console.log('PA Clinics:', this.clinics);
              this.selectedClinicId = (this.clinics.length > 0 ? this.clinics[0].Id : null);
              console.log('Selected PA Clinic ID:', this.selectedClinicId);
              if (this.selectedClinicId) {
                this.getBrandAmount(this.selectedClinicId);
              }
            } else {
              this.toastService.create(response.Message, 'danger');
            }
          },
          error: (error) => {
            loading.dismiss();
            console.error('Error fetching PA clinics:', error);
            this.toastService.create('Failed to load clinics', 'danger');
          },
        });
      }
    } catch (error) {
      console.error('Error in loadClinics:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  async getBrandAmount(id: string) {
    const loading = await this.loadingController.create({
      message: 'Loading...',
    });
    await loading.present();
    this.brandService.getBrandAmount(id).subscribe(
      (res: { IsSuccess: boolean; ResponseData: BrandAmountDTO[]; Message: string }) => {
        loading.dismiss();
        if (res.IsSuccess) {
          // Store original data
          this.originalBrandAmounts = res.ResponseData;
          
          // Group brands by base name (remove vaccine name in parentheses)
          const grouped = this.groupBrandsByBaseName(res.ResponseData);
          this.brandAmounts = grouped.sort((a, b) => a.BrandName.localeCompare(b.BrandName));
          console.log('Grouped Brand Amounts:', this.brandAmounts);
        } else {
          this.toastService.create(res.Message || 'Failed to fetch brand amounts', 'danger');
        }
      },
      (err) => {
        loading.dismiss();
        console.error('Error fetching brand amounts:', err);
        this.toastService.create('Failed to fetch brand amounts', 'danger');
      }
    );
  }

  // Group brands by base name (removing vaccine name in parentheses)
  private groupBrandsByBaseName(brands: BrandAmountDTO[]): BrandAmountDTO[] {
    const grouped = new Map<string, BrandAmountDTO[]>();
    this.brandGroupMap.clear(); // Reset the map
    
    // Group by base brand name
    brands.forEach(brand => {
      const baseName = this.extractBaseBrandName(brand.BrandName);
      if (!grouped.has(baseName)) {
        grouped.set(baseName, []);
      }
      grouped.get(baseName)!.push(brand);
    });

    // Merge grouped brands
    const result: BrandAmountDTO[] = [];
    grouped.forEach((brandGroup, baseName) => {
      if (brandGroup.length === 1) {
        // If only one brand with this name, keep as is but remove vaccine name from display
        const brand = { ...brandGroup[0] };
        brand.BrandName = baseName;
        brand.VaccineName = ''; // Clear vaccine name for display
        
        // Store mapping for updates
        this.brandGroupMap.set(baseName, [brandGroup[0]]);
        
        result.push(brand);
      } else {
        // Merge multiple brands with same base name
        const totalCount = brandGroup.reduce((sum, b) => sum + (b.Count || 0), 0);
        const totalPurchaseValue = brandGroup.reduce((sum, b) => sum + ((b.Count || 0) * (b.PurchasedAmt || 0)), 0);
        const totalSaleValue = brandGroup.reduce((sum, b) => sum + ((b.Count || 0) * (b.Amount || 0)), 0);
        
        // Calculate weighted averages
        const avgPurchasePrice = totalCount !== 0 ? totalPurchaseValue / totalCount : 0;
        const avgSalePrice = totalCount !== 0 ? totalSaleValue / totalCount : 0;
        
        // Use the first brand's IDs and merge the data
        const mergedBrand: BrandAmountDTO = {
          ...brandGroup[0],
          BrandName: baseName,
          VaccineName: '', // Combined brand, no specific vaccine
          Count: totalCount,
          PurchasedAmt: Math.round(avgPurchasePrice * 100) / 100, // Round to 2 decimals
          Amount: Math.round(avgSalePrice * 100) / 100 // Round to 2 decimals
        };
        
        // Store mapping for updates (map merged brand to all originals)
        this.brandGroupMap.set(baseName, brandGroup);
        
        result.push(mergedBrand);
      }
    });

    return result;
  }

  // Extract base brand name (remove content in parentheses)
  private extractBaseBrandName(brandName: string): string {
    // Remove anything in parentheses and trim
    return brandName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  }

  onClinicChange(event: any) {
    const clinicId = event.detail.value;
    console.log('Selected Clinic ID:', clinicId);
    this.getBrandAmount(clinicId);
  }

  async updateBrandAmount() {
    const loading = await this.loadingController.create({
      message: 'Updating...'
    });
    await loading.present();
    
    // Expand merged brands back to original entries with updated prices
    const brandsToUpdate: BrandAmountDTO[] = [];
    this.brandAmounts.forEach(displayedBrand => {
      const baseName = displayedBrand.BrandName;
      const originalBrands = this.brandGroupMap.get(baseName) || [];
      
      // Update each original brand with the new price from the merged display
      originalBrands.forEach(originalBrand => {
        brandsToUpdate.push({
          ...originalBrand,
          Amount: displayedBrand.Amount // Apply the updated sale price to all variants
        });
      });
    });
    
    console.log('Updating brands:', brandsToUpdate);
    
    await this.brandService.putBrandAmount(brandsToUpdate)
      .subscribe(res => {
        if (res.IsSuccess) {
          loading.dismiss();
          this.toastService.create("Successfully updated");
        }
        else {
          loading.dismiss();
          this.toastService.create(res.Message, 'danger');
        }
      }, (err) => {
        loading.dismiss();
        this.toastService.create(err, 'danger')
      });
  }
 
async downloadPDF() {
  try {
    const loading = await this.loadingController.create({
      message: 'Downloading PDF...'
    });
    await loading.present();
    // const doctorId = await this.storage.get(environment.DOCTOR_Id);
    this.brandService.downloadPdf(this.clinicId, { observe: 'response', responseType: 'blob' }).subscribe(
      (response) => {
        const blob = response.body;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `brand-report-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        loading.dismiss();
        this.toastService.create('PDF downloaded successfully', 'success');
      },
      error => {
        loading.dismiss();
        console.error('Error downloading PDF:', error);
        this.toastService.create('Failed to download PDF', 'danger');
      }
    );
  } catch (error) {
    console.error('Error in downloadPDF:', error);
    this.toastService.create('An unexpected error occurred', 'danger');
    this.loadingController.dismiss();
  }
}
}