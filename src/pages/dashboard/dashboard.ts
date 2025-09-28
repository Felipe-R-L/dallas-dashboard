import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, PercentPipe, NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

import {
  FirebaseService,
  Transaction,
  ImportedFile,
  Dataset,
} from '../../app/services/firebase.service';
import { PieChartComponent } from './charts/pie-chart';
import { LineChartComponent } from './charts/line-chart';
import { ModalComponent } from '../../app/components/modal/modal';
import { FileUploaderComponent } from '../../app/components/file-uploader/file-uploader';
import { CreateDatasetModalComponent } from '../../app/components/create-dataset-modal/create-dataset-modal';
import { DashboardFilterComponent } from '../../app/components/dashboard-filter/dashboard-filter';
import { DatasetsToOptionsPipe } from '../../app/pipes/dataset-to-options.pipe';
import { CustomSelectComponent } from '../../app/components/custom-select/custom-select';
import { SpreadsheetService } from '../../app/services/spreadsheet.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    PercentPipe,
    NgClass,
    FormsModule,
    AsyncPipe,
    DatePipe,
    PieChartComponent,
    LineChartComponent,
    ModalComponent,
    FileUploaderComponent,
    CreateDatasetModalComponent,
    DashboardFilterComponent,
    DatasetsToOptionsPipe,
    CustomSelectComponent,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private firebaseService = inject(FirebaseService);
  private spreadsheetService = inject(SpreadsheetService);

  activeTab: 'revenue' | 'expenses' | 'files' = 'revenue';
  grossRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  profitMargin = 0;
  averageTicket = 0;
  isUploadModalOpen = false;
  isCreateDatasetModalOpen = false;
  isProcessing = false;
  hasDatasets = true;
  activeDatasetId: string | null = null;
  uploadTargetDatasetId: string | null = null;

  revenueBySubcategoryData: { name: string; value: number }[] = [];
  revenueByPaymentMethodData: { name: string; value: number }[] = [];
  expensesBySubcategoryData: { name: string; value: number }[] = [];
  topExpensesData: { description: string; value: number }[] = [];
  dailyRevenueXAxis: string[] = [];
  lineChartSeries: { name: string; data: (number | null)[] }[] = [];

  datasets$: Observable<Dataset[]>;
  importedFiles$: Observable<ImportedFile[]> | null = null;

  private selectedFiles: File[] = [];

  constructor() {
    this.datasets$ = this.firebaseService.getDatasets().pipe(
      tap((datasets) => {
        this.hasDatasets = datasets.length > 0;
        if (this.hasDatasets && !this.activeDatasetId) {
          const firstDatasetId = datasets[0]?.id ?? null;
          this.activeDatasetId = firstDatasetId;
          this.uploadTargetDatasetId = firstDatasetId;
          if (firstDatasetId) {
            this.loadInitialData(firstDatasetId);
          }
        } else if (!this.hasDatasets) {
          this.resetDashboard();
        }
      }),
    );
  }

  ngOnInit(): void {}

  loadInitialData(datasetId: string): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.loadData(datasetId, firstDayOfMonth, today);
  }

  onDateRangeChange(filters: {
    datasetId: string | number;
    startDate: string;
    endDate: string;
  }): void {
    if (!filters.datasetId) return;
    this.activeDatasetId = filters.datasetId as string;

    // Converte as strings "AAAA-MM-DD" para objetos Date aqui
    const [startYear, startMonth, startDay] = filters.startDate.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);

    const [endYear, endMonth, endDay] = filters.endDate.split('-').map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    this.loadData(this.activeDatasetId, startDate, endDate);
  }

  private loadData(datasetId: string, startDate: Date, endDate: Date): void {
    // Garante que as horas cobrem o dia inteiro para a consulta
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    this.firebaseService
      .getTransactions(datasetId, startDate, endDate)
      .subscribe(({ revenues, expenses }) => {
        this.updateDashboard(revenues, expenses);
      });

    this.loadImportedFiles();
  }

  selectTab(tab: 'revenue' | 'expenses' | 'files'): void {
    this.activeTab = tab;
    if (this.activeDatasetId) {
      this.loadImportedFiles();
    }
  }

  loadImportedFiles(): void {
    if (this.activeDatasetId) {
      this.importedFiles$ = this.firebaseService.getImportedFiles(this.activeDatasetId);
    }
  }

  async deleteImportedFile(fileId: string): Promise<void> {
    if (!this.activeDatasetId) return;
    try {
      await this.firebaseService.deleteFileAndTransactions(this.activeDatasetId, fileId);
    } catch (error) {
      console.error('Erro ao apagar ficheiro:', error);
    }
  }

  async handleCreateDataset(name: string): Promise<void> {
    try {
      await this.firebaseService.createDataset(name);
      this.closeCreateDatasetModal();
    } catch (error) {
      console.error('Erro ao criar dataset:', error);
    }
  }

  onFilesEmitted(files: File[]): void {
    this.selectedFiles = files;
  }

  async processAndUploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0 || !this.uploadTargetDatasetId) return;
    this.isProcessing = true;
    try {
      for (const file of this.selectedFiles) {
        const transactions = await this.spreadsheetService.parseTransactionsFromFile(file);
        if (transactions.length > 0) {
          const fileInfo = {
            fileName: file.name,
            transactionCount: transactions.length,
            importedAt: Timestamp.now(),
          };
          await this.firebaseService.addFileAndTransactions(
            this.uploadTargetDatasetId,
            fileInfo,
            transactions,
          );
        }
      }
      this.closeUploadModal();
    } catch (error) {
      console.error('Erro durante o processamento dos arquivos:', error);
    } finally {
      this.isProcessing = false;
      this.selectedFiles = [];
    }
  }

  resetDashboard(): void {
    this.grossRevenue = 0;
    this.totalExpenses = 0;
    this.netProfit = 0;
    this.profitMargin = 0;
    this.averageTicket = 0;
    this.revenueBySubcategoryData = [];
    this.revenueByPaymentMethodData = [];
    this.expensesBySubcategoryData = [];
    this.topExpensesData = [];
    this.dailyRevenueXAxis = [];
    this.lineChartSeries = [];
    this.importedFiles$ = null;
  }

  openUploadModal(): void {
    this.isUploadModalOpen = true;
  }
  closeUploadModal(): void {
    this.isUploadModalOpen = false;
    this.selectedFiles = [];
  }
  openCreateDatasetModal(): void {
    this.isCreateDatasetModalOpen = true;
  }
  closeCreateDatasetModal(): void {
    this.isCreateDatasetModalOpen = false;
  }

  private updateDashboard(revenues: Transaction[], expenses: Transaction[]): void {
    this.grossRevenue = revenues.reduce((sum, item) => sum + item.value, 0);
    this.totalExpenses = expenses.reduce((sum, item) => sum + item.value, 0);
    this.netProfit = this.grossRevenue - this.totalExpenses;
    this.profitMargin = this.grossRevenue > 0 ? this.netProfit / this.grossRevenue : 0;
    this.averageTicket = revenues.length > 0 ? this.grossRevenue / revenues.length : 0;

    const revenueSubcategoryMap = new Map<string, number>();
    revenues.forEach((item) => {
      revenueSubcategoryMap.set(
        item.subcategory,
        (revenueSubcategoryMap.get(item.subcategory) || 0) + item.value,
      );
    });
    this.revenueBySubcategoryData = Array.from(revenueSubcategoryMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    const paymentMethodMap = new Map<string, number>();
    revenues.forEach((item) => {
      paymentMethodMap.set(
        item.paymentMethod,
        (paymentMethodMap.get(item.paymentMethod) || 0) + item.value,
      );
    });
    this.revenueByPaymentMethodData = Array.from(paymentMethodMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    const dailyRevenueMap = new Map<string, number>();
    revenues.forEach((item) => {
      dailyRevenueMap.set(item.issueDate, (dailyRevenueMap.get(item.issueDate) || 0) + item.value);
    });
    const sortedDaily = Array.from(dailyRevenueMap.entries()).sort((a, b) => {
      const [dayA, monthA, yearA] = a[0].split('/').map(Number);
      const [dayB, monthB, yearB] = b[0].split('/').map(Number);
      return (
        new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
      );
    });
    this.dailyRevenueXAxis = sortedDaily.map((item) => item[0]);
    const dailyValues = sortedDaily.map((item) => item[1]);
    const dailyRevenueSeries = dailyValues.map((v) => parseFloat(v.toFixed(2)));
    const trendlineSeries = this.calculateMovingAverage(dailyValues, 3);
    this.lineChartSeries = [
      { name: 'Faturamento', data: dailyRevenueSeries },
      { name: 'Tendência (Média Móvel 3 dias)', data: trendlineSeries },
    ];

    const expensesMap = new Map<string, number>();
    expenses.forEach((item) => {
      expensesMap.set(item.subcategory, (expensesMap.get(item.subcategory) || 0) + item.value);
    });
    this.expensesBySubcategoryData = Array.from(expensesMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));

    this.topExpensesData = [...expenses]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item) => ({ description: item.description, value: item.value }));
  }

  private calculateMovingAverage(data: number[], period: number): (number | null)[] {
    if (!data || data.length < period) return [];
    const result: number[] = [];
    for (let i = 0; i <= data.length - period; i++) {
      const sum = data.slice(i, i + period).reduce((a, b) => a + b, 0);
      result.push(parseFloat((sum / period).toFixed(2)));
    }
    return Array(period - 1)
      .fill(null)
      .concat(result);
  }
}
