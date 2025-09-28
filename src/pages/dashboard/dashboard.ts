import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, PercentPipe, NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

import { PieChartComponent } from './charts/pie-chart';
import { LineChartComponent } from './charts/line-chart';

import {
  FirebaseService,
  Transaction,
  ImportedFile,
  Dataset,
} from '../../app/services/firebase.service';
import { SpreadsheetService } from '../../app/services/spreadsheet.service';
import { ModalComponent } from '../../app/components/modal/modal';
import { FileUploaderComponent } from '../../app/components/file-uploader/file-uploader';
import { CreateDatasetModalComponent } from '../../app/components/create-dataset-modal/create-dataset-modal';
import { DashboardFilterComponent } from '../../app/components/dashboard-filter/dashboard-filter';
import { DatasetsToOptionsPipe } from '../../app/pipes/dataset-to-options.pipe';
import { CustomSelectComponent } from '../../app/components/custom-select/custom-select';

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
  activeTab: 'revenue' | 'expenses' | 'files' = 'revenue';

  grossRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  profitMargin = 0;
  averageTicket = 0;

  revenueBySubcategoryData: { name: string; value: number }[] = [];
  revenueByPaymentMethodData: { name: string; value: number }[] = [];
  expensesBySubcategoryData: { name: string; value: number }[] = [];
  topExpensesData: { description: string; value: number }[] = [];
  dailyRevenueXAxis: string[] = [];
  lineChartSeries: { name: string; data: (number | null)[] }[] = [];

  isUploadModalOpen = false;
  isCreateDatasetModalOpen = false;
  isProcessing = false;

  datasets$: Observable<Dataset[]>;
  importedFiles$: Observable<ImportedFile[]> | null = null;
  activeDatasetId: string | null = null;
  uploadTargetDatasetId: string | null = null;
  hasDatasets = true;

  private selectedFiles: File[] = [];
  private dateRange = {
    startDate: '2024-12-01',
    endDate: '2024-12-31',
  };

  constructor(
    private firebaseService: FirebaseService,
    private spreadsheetService: SpreadsheetService,
  ) {
    this.datasets$ = this.firebaseService.getDatasets().pipe(
      tap((datasets) => {
        this.hasDatasets = datasets.length > 0;
        if (this.hasDatasets && !this.activeDatasetId) {
          this.activeDatasetId = datasets[0]?.id ?? null;
          this.uploadTargetDatasetId = datasets[0]?.id ?? null;
          this.loadDataForCurrentDataset();
        } else if (!this.hasDatasets) {
          this.resetDashboard();
        }
      }),
    );
  }

  ngOnInit(): void {}

  loadDataForCurrentDataset(): void {
    if (!this.activeDatasetId) return;
    this.loadData(this.activeDatasetId, this.dateRange);
    if (this.activeTab === 'files') {
      this.loadImportedFiles();
    }
  }

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.dateRange = range;
    this.loadDataForCurrentDataset();
  }

  onDatasetChange(): void {
    this.loadDataForCurrentDataset();
  }

  private loadData(datasetId: string, range: { startDate: string; endDate: string }): void {
    const endDate = new Date(range.endDate);
    endDate.setDate(endDate.getDate() + 1);

    this.firebaseService
      .getTransactions(datasetId, new Date(range.startDate), endDate)
      .subscribe(({ revenues, expenses }) => {
        this.updateDashboard(revenues, expenses);
      });
  }

  selectTab(tab: 'revenue' | 'expenses' | 'files'): void {
    this.activeTab = tab;
    if (tab === 'files') {
      this.loadImportedFiles();
    }
  }

  loadImportedFiles(): void {
    if (this.activeDatasetId) {
      this.importedFiles$ = this.firebaseService.getImportedFiles(this.activeDatasetId);
    }
  }

  async deleteImportedFile(fileId: string): Promise<void> {
    if (
      !this.activeDatasetId ||
      !confirm(
        'Tem a certeza que quer apagar este ficheiro e todas as suas transações? Esta ação é irreversível.',
      )
    ) {
      return;
    }
    try {
      await this.firebaseService.deleteFileAndTransactions(this.activeDatasetId, fileId);
      alert('Ficheiro e transações apagados com sucesso.');
      this.loadImportedFiles();
    } catch (error) {
      console.error('Erro ao apagar ficheiro:', error);
      alert('Ocorreu um erro ao apagar o ficheiro.');
    }
  }

  async handleCreateDataset(name: string): Promise<void> {
    try {
      const docRef = await this.firebaseService.createDataset(name);
      this.activeDatasetId = docRef.id;
      this.uploadTargetDatasetId = docRef.id;
      this.closeCreateDatasetModal();
      this.loadDataForCurrentDataset();
    } catch (error) {
      console.error('Erro ao criar dataset:', error);
      alert('Ocorreu um erro ao criar a empresa.');
    }
  }
  onFilesEmitted(files: File[]): void {
    this.selectedFiles = files;
  }

  async processAndUploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0 || !this.uploadTargetDatasetId) {
      console.error('Nenhum arquivo selecionado ou nenhuma empresa alvo.');
      return;
    }

    this.isProcessing = true;

    try {
      for (const file of this.selectedFiles) {
        console.log(`Processando o arquivo: ${file.name}`);

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
          console.log(
            `Arquivo ${file.name} e ${transactions.length} transações salvas com sucesso!`,
          );
        } else {
          console.warn(`Nenhuma transação encontrada no arquivo: ${file.name}`);
        }
      }

      alert('Todos os arquivos foram processados com sucesso!');
      this.closeUploadModal();
    } catch (error) {
      console.error('Ocorreu um erro durante o processamento dos arquivos:', error);
      alert('Ocorreu um erro ao processar os arquivos. Verifique o console para mais detalhes.');
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
