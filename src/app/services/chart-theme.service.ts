import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as echarts from 'echarts';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ChartThemeService {
  private themePath = '/shine.js';

  constructor(private http: HttpClient) {}

  loadTheme(): Observable<any> {
    return this.http.get(this.themePath).pipe(
      tap((theme: any) => {
        echarts.registerTheme('default-theme', theme);
      }),
    );
  }
}
