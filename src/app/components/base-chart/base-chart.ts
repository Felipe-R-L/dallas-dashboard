// ... existing imports
import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ChartThemeService } from '../../services/chart-theme.service';

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [],
  template: '<div [id]="chartId"></div>',
})
export class BaseChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() chartOptions: EChartsOption = {};
  @Input() chartId = 'chart';

  chart: echarts.ECharts | undefined;

  private destroy$ = new Subject<void>();

  constructor(private readonly _chartThemeService: ChartThemeService) {}

  @HostListener('window:resize')
  onResize(): void {
    this.chart?.resize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartOptions'] && this.chart) {
      this.chart.setOption(this.chartOptions);
    }
  }

  ngAfterViewInit(): void {
    this.buildChart();
    this._chartThemeService
      .loadTheme()
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.destroyChart();
        this.buildChart();
      });
  }

  // NEW PUBLIC METHOD
  public updateOptions(): void {
    if (this.chart) {
      this.chart.setOption(this.chartOptions);
    }
  }

  private buildChart(): void {
    const chartDom = document.getElementById(this.chartId);
    if (chartDom) {
      this.chart = echarts.init(chartDom);
      this.chart.setOption(this.chartOptions);
    }
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.dispose();
      this.chart = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
