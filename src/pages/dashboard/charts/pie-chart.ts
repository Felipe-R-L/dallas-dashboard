import { Component, Input, OnChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { BaseChartComponent } from '../../../app/components/base-chart/base-chart';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [],

  template: `<div [id]="chartId" class="w-full h-80"></div>`,
})
export class PieChartComponent extends BaseChartComponent implements OnChanges {
  @Input() seriesData: { name: string; value: number }[] = [];
  @Input() uniqueId = 'default';

  override chartId = `pie-chart-${this.uniqueId}`;
  override chartOptions: EChartsOption = {};

  override ngOnChanges(): void {
    this.chartId = `pie-chart-${this.uniqueId}`;

    this.chartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          name: 'Valor',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: this.seriesData,
        },
      ],
    };
  }
}
