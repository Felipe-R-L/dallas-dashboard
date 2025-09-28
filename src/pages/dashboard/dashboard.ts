import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, PercentPipe, NgClass } from '@angular/common';

import { PieChartComponent } from './charts/pie-chart';
import { LineChartComponent } from './charts/line-chart';
import { DateRangePickerComponent } from '../../app/components/date-range-picker/date-range-picker';
import { FirebaseService, Transaction } from '../../app/services/firebase';
import { FileUploaderComponent } from '../../app/components/file-uploader/file-uploader';
import { ModalComponent } from '../../app/components/modal/modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    PercentPipe,
    NgClass,
    PieChartComponent,
    LineChartComponent,
    DateRangePickerComponent,
    ModalComponent,
    FileUploaderComponent,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  activeTab: 'revenue' | 'expenses' = 'revenue';

  // KPIs
  grossRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  profitMargin = 0;
  averageTicket = 0;

  // Chart data properties
  revenueBySubcategoryData: { name: string; value: number }[] = [];
  revenueByPaymentMethodData: { name: string; value: number }[] = [];
  expensesBySubcategoryData: { name: string; value: number }[] = [];
  topExpensesData: { description: string; value: number }[] = [];
  dailyRevenueXAxis: string[] = [];
  lineChartSeries: { name: string; data: (number | null)[] }[] = [];

  // Modal state
  isUploadModalOpen = false;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    const defaultStartDate = '2024-12-01';
    const defaultEndDate = '2024-12-31';
    this.loadData({ startDate: defaultStartDate, endDate: defaultEndDate });
  }

  loadData(range: { startDate: string; endDate: string }): void {
    const endDate = new Date(range.endDate);
    endDate.setDate(endDate.getDate() + 1);

    this.firebaseService
      .getTransactions(new Date(range.startDate), endDate)
      .subscribe(({ revenue, expenses }) => {
        this.updateDashboard(revenue, expenses);
      });
  }

  private updateDashboard(revenue: Transaction[], expenses: Transaction[]): void {
    this.grossRevenue = revenue.reduce((sum, item) => sum + item.value, 0);
    this.totalExpenses = expenses.reduce((sum, item) => sum + item.value, 0);
    this.netProfit = this.grossRevenue - this.totalExpenses;
    this.profitMargin = this.grossRevenue > 0 ? this.netProfit / this.grossRevenue : 0;
    this.averageTicket = revenue.length > 0 ? this.grossRevenue / revenue.length : 0;

    const revenueubcategoryMap = new Map<string, number>();
    revenue.forEach((item) => {
      revenueubcategoryMap.set(
        item.subcategory,
        (revenueubcategoryMap.get(item.subcategory) || 0) + item.value,
      );
    });
    this.revenueBySubcategoryData = Array.from(revenueubcategoryMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    const paymentMethodMap = new Map<string, number>();
    revenue.forEach((item) => {
      paymentMethodMap.set(
        item.paymentMethod,
        (paymentMethodMap.get(item.paymentMethod) || 0) + item.value,
      );
    });
    this.revenueByPaymentMethodData = Array.from(paymentMethodMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    const dailyRevenueMap = new Map<string, number>();
    revenue.forEach((item) => {
      dailyRevenueMap.set(item.issueDate, (dailyRevenueMap.get(item.issueDate) || 0) + item.value);
    });
    const sortedDailyRevenue = Array.from(dailyRevenueMap.entries()).sort((a, b) => {
      const [dayA, monthA, yearA] = a[0].split('/').map(Number);
      const [dayB, monthB, yearB] = b[0].split('/').map(Number);
      return (
        new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
      );
    });

    this.dailyRevenueXAxis = sortedDailyRevenue.map((item) => item[0]);
    const dailyValues = sortedDailyRevenue.map((item) => item[1]);
    const dailyRevenueeries = dailyValues.map((v) => parseFloat(v.toFixed(2)));
    const trendlineSeries = this.calculateMovingAverage(dailyValues, 3);

    this.lineChartSeries = [
      { name: 'Faturamento', data: dailyRevenueeries },
      { name: 'Tendência (Média Móvel 3 dias)', data: trendlineSeries },
    ];

    const expensesSubcategoryMap = new Map<string, number>();
    expenses.forEach((item) => {
      expensesSubcategoryMap.set(
        item.subcategory,
        (expensesSubcategoryMap.get(item.subcategory) || 0) + item.value,
      );
    });
    this.expensesBySubcategoryData = Array.from(expensesSubcategoryMap.entries()).map(
      ([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }),
    );

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

  selectTab(tab: 'revenue' | 'expenses'): void {
    this.activeTab = tab;
  }

  openUploadModal(): void {
    this.isUploadModalOpen = true;
  }

  closeUploadModal(): void {
    this.isUploadModalOpen = false;
  }

  onFilesEmitted(files: File[]): void {
    console.log('Files received from uploader component:', files);
  }
}
