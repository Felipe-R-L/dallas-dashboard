import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import {
  Firestore,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  collectionData,
  addDoc,
  orderBy,
  DocumentReference,
  DocumentData,
} from '@angular/fire/firestore';

export interface ImportedFile {
  id?: string;
  fileName: string;
  transactionCount: number;
  importedAt: Timestamp;
}

export interface Dataset {
  id?: string;
  name: string;
}

export interface Transaction {
  id?: string;
  description: string;
  type: 'revenue' | 'expense';
  value: number;
  subcategory: string;
  paymentMethod: string;
  issueDate: string;
  timestamp?: Timestamp;
  datasetId: string;
  fileId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firestore: Firestore = inject(Firestore);

  getDatasets(): Observable<Dataset[]> {
    const datasetsCol = collection(this.firestore, 'datasets');
    return collectionData(datasetsCol, { idField: 'id' }) as Observable<Dataset[]>;
  }

  createDataset(name: string): Promise<DocumentReference<DocumentData>> {
    const datasetsCol = collection(this.firestore, 'datasets');
    return addDoc(datasetsCol, { name });
  }

  getTransactions(
    datasetId: string,
    startDate: Date,
    endDate: Date,
  ): Observable<{ revenues: Transaction[]; expenses: Transaction[] }> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('datasetId', '==', datasetId),

      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
    );

    return from(
      getDocs(q).then((snapshot) => {
        const allTransactions = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Transaction,
        );
        return {
          revenues: allTransactions.filter((t) => t.type === 'revenue'),
          expenses: allTransactions.filter((t) => t.type === 'expense'),
        };
      }),
    );
  }

  getImportedFiles(datasetId: string): Observable<ImportedFile[]> {
    const filesCol = collection(this.firestore, `datasets/${datasetId}/importedFiles`);
    const q = query(filesCol, orderBy('importedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<ImportedFile[]>;
  }

  async addFileAndTransactions(
    datasetId: string,
    fileInfo: Omit<ImportedFile, 'id'>,
    transactions: Omit<Transaction, 'id' | 'fileId'>[],
  ): Promise<void> {
    const batch = writeBatch(this.firestore);
    const filesCol = collection(this.firestore, `datasets/${datasetId}/importedFiles`);
    const newFileRef = doc(filesCol);

    batch.set(newFileRef, fileInfo);

    const transactionsCol = collection(this.firestore, 'transactions');
    transactions.forEach((transaction) => {
      const [day, month, year] = transaction.issueDate.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      const newDocRef = doc(transactionsCol);
      batch.set(newDocRef, {
        ...transaction,
        fileId: newFileRef.id,
        timestamp: Timestamp.fromDate(date),
      });
    });

    return batch.commit();
  }

  async deleteFileAndTransactions(datasetId: string, fileId: string): Promise<void> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('datasetId', '==', datasetId),
      where('fileId', '==', fileId),
    );
    const transactionsSnapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    transactionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    const fileRef = doc(this.firestore, `datasets/${datasetId}/importedFiles`, fileId);
    batch.delete(fileRef);

    return batch.commit();
  }
}
