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

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [],
  template: '<div [id]="chartId" style="width: 100%; height: 400px;"></div>', // Adicionei altura
})
export class BaseChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() chartOptions: EChartsOption = {};
  @Input() chartId = 'chart';

  chart: echarts.ECharts | undefined;

  // O ChartThemeService não é mais necessário
  constructor() {}

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
  }

  private buildChart(): void {
    const chartDom = document.getElementById(this.chartId);
    if (chartDom) {
      // Diga ao ECharts para usar o tema 'shine' na inicialização
      this.chart = echarts.init(chartDom, 'shine');
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
  }
}
