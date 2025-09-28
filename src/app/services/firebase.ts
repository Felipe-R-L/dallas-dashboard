import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { expensesData } from '../../pages/dashboard/data/expenses';
import { revenuesData } from '../../pages/dashboard/data/revenue';

export interface Transaction {
  description: string;
  value: number;
  subcategory: string;
  paymentMethod: string;
  issueDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  getTransactions(
    startDate: Date,
    endDate: Date,
  ): Observable<{ revenue: Transaction[]; expenses: Transaction[] }> {
    const filteredRevenue = revenuesData.filter((item) => {
      const [day, month, year] = item.issueDate.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const filteredExpenses = expensesData.filter((item) => {
      const [day, month, year] = item.issueDate.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);
      return itemDate >= startDate && itemDate <= endDate;
    });

    return of({ revenue: filteredRevenue, expenses: filteredExpenses });
  }
}
