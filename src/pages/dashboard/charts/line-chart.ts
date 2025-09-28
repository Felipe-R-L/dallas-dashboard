import { Component, Input, OnChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { BaseChartComponent } from '../../../app/components/base-chart/base-chart';

interface ChartSeries {
  name: string;
  data: (number | null)[];
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  template: '<div [id]="chartId" class="w-full h-80"></div>',
})
export class LineChartComponent extends BaseChartComponent implements OnChanges {
  @Input() xAxisData: string[] = [];
  @Input() seriesData: ChartSeries[] = [];

  override chartId = 'line-chart';
  override chartOptions: EChartsOption = {};

  override ngOnChanges(): void {
    this.chartOptions = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: this.seriesData.map((s) => s.name),
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.xAxisData,
      },
      yAxis: { type: 'value' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      series: this.seriesData.map((s, index) => ({
        name: s.name,
        type: 'line',
        smooth: true,
        areaStyle: index === 0 ? {} : undefined,
        lineStyle: index > 0 ? { type: 'dashed' } : undefined,
        data: s.data,
      })),
    };
  }
}
