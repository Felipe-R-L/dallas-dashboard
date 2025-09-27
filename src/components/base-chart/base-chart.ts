import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import { ChartThemeService } from '../../services/chart-theme.service';

@Directive()
export abstract class BaseChartComponent implements AfterViewInit {
  @Input() chartId!: string;
  @Input() chartOptions!: EChartsOption;
  @Input() theme: string = 'default-theme';

  protected chartInstance!: echarts.ECharts;

  constructor(
    protected elRef: ElementRef,
    private chartThemeService: ChartThemeService,
  ) {}

  ngAfterViewInit(): void {
    const chartDom =
      this.elRef.nativeElement.querySelector('#' + this.chartId) || this.elRef.nativeElement;
    this.chartInstance = echarts.init(chartDom, this.theme);
    this.chartInstance.setOption(this.chartOptions);
    window.addEventListener('resize', () => {
      this.chartInstance.resize();
    });
  }

  updateChartOptions(options: EChartsOption): void {
    this.chartOptions = options;
    this.chartInstance && this.chartInstance.setOption(this.chartOptions);
  }
}
