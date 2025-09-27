import { Component } from '@angular/core';
import { BarChartComponent } from './components/bar-chart/bar-chart';
@Component({
  selector: 'app-dashboard',
  imports: [BarChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
