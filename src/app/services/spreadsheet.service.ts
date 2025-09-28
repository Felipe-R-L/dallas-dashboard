import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from './firebase.service';

type ParsedTransactions = Omit<Transaction, 'id' | 'fileId' | 'datasetId'>;

@Injectable({
  providedIn: 'root',
})
export class SpreadsheetService {
  async parseTransactionsFromFile(file: File): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(worksheet);

    json.forEach((row) => {
      const transaction: ParsedTransactions = {
        description: row['Descrição'] || 'N/A',
        type: (row['Tipo'] || '').toLowerCase() === 'receita' ? 'revenue' : 'expense',
        value: parseFloat((row['Valor liquido'] || '0').replace(',', '.')),
        subcategory: row['Subcategoria'] || 'Outros',
        paymentMethod: row['Forma de pagamento'] || 'N/A',
        issueDate: this.formatExcelDate(row['Data de lançamento']),
      };

      if (isNaN(transaction.value)) return;

      transactions.push(transaction as Transaction);
    });

    return transactions;
  }

  private formatExcelDate(excelDate: string | number): string {
    if (typeof excelDate === 'number') {
      const date = new Date(1900, 0, excelDate - 1);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return excelDate;
  }
}
