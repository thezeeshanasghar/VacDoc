import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AgentService } from 'src/app/services/agent.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-agent-report',
  templateUrl: './agent-report.page.html',
  styleUrls: ['./agent-report.page.scss'],
})
export class AgentReportPage implements OnInit {
  agentId: any;
  agentName: string = '';
  phoneNumber: string = '';
  feePerClient: number = 0;

  fromDate: string = '';
  toDate: string = '';

  reportGenerated: boolean = false;
  clientCount: number = 0;
  totalFee: number = 0;
  clients: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private agentService: AgentService,
    private loadingCtrl: LoadingController,
    private toastService: ToastService
  ) {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fromDate = firstOfMonth.toISOString().slice(0, 10);
    this.toDate = today.toISOString().slice(0, 10);
  }

  ngOnInit() {
    this.agentId = this.route.snapshot.paramMap.get('id');
    this.loadAgentDetails();
  }

  loadAgentDetails() {
    this.agentService.getAllAgents().subscribe(
      (agents: any) => {
        const found = agents.find(function(a: any) {
          return (a.Id || a.id) == this.agentId;
        }.bind(this));
        if (found) {
          this.agentName = found.Name || found.name;
          this.phoneNumber = found.PhoneNumber || found.phoneNumber || '';
          this.feePerClient = found.ReferralFeePerClient || found.referralFeePerClient || 0;
        }
      },
      (err: any) => { console.error(err); }
    );
  }

  async generateReport() {
    if (!this.fromDate || !this.toDate) {
      this.toastService.create('Please select a date range', 'danger');
      return;
    }
    const loader = await this.loadingCtrl.create({ message: 'Generating report...' });
    await loader.present();
    this.agentService.getAgentReport(this.agentId, this.fromDate, this.toDate).subscribe(
      (data: any) => {
        this.agentName = data.AgentName || data.agentName || this.agentName;
        this.feePerClient = data.ReferralFeePerClient || data.referralFeePerClient || 0;
        this.clientCount = data.ClientCount || data.clientCount || 0;
        this.totalFee = data.TotalFee || data.totalFee || 0;
        this.clients = data.Clients || data.clients || [];
        this.reportGenerated = true;
        loader.dismiss();
      },
      (err: any) => {
        loader.dismiss();
        this.toastService.create('Failed to generate report', 'danger');
      }
    );
  }

  recordAsExpense() {
    this.toastService.create('Expense module coming soon — this will pre-fill the referral fee as an expense entry.', 'warning');
  }
}
