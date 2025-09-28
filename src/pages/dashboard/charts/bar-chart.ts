/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, type OnDestroy } from '@angular/core';
import { EChartsOption } from 'echarts';
import { BaseChartComponent } from '../../../app/components/base-chart/base-chart';

@Component({
  selector: 'app-bar-chart',
  imports: [],
  styles: [],
  template: '<div id="bar-chart" class="d-flex" style="width: 100%; height: 400px"></div>',
})
export class BarChartComponent extends BaseChartComponent implements OnDestroy {
  override chartOptions: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      top: '15%',
      left: '7%',
      right: '3%',
      bottom: '10%',
      containLabel: true,
    },
    title: {
      text: '',
      left: '3%',
    },
    xAxis: [
      {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisTick: {
          alignWithLabel: true,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
      },
    ],
    series: [
      {
        name: 'Direct',
        type: 'bar',
        barWidth: '60%',
        data: [10, 52, 200, 334, 390, 330, 220],
      },
    ],
  } as const;

  override chartId = 'bar-chart';
}
