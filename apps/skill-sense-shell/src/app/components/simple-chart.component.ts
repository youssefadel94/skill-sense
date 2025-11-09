import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartType, registerables } from 'chart.js';
import {
  ChartData,
  createBarChartConfig,
  createPieChartConfig,
  createLineChartConfig,
  transformToChartData
} from '../utils/chart-data.util';

Chart.register(...registerables);

/**
 * SimpleChart Component
 *
 * A reusable chart component supporting multiple chart types.
 */
@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="simple-chart-container"
      [attr.style]="style || defaultStyle">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .simple-chart-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  `]
})
export class SimpleChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() data: ChartData | Array<{ label: string; value: number }> = { labels: [], datasets: [] };
  @Input() dataLabel: string = 'Data';
  @Input() style?: string;
  @Input() options?: any;

  defaultStyle = 'padding: 20px; background-color: white; border-radius: 8px;';

  private chart?: Chart;

  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['type']) && this.chart) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private renderChart(): void {
    if (!this.canvasRef?.nativeElement) {
      console.warn('[SimpleChart] Canvas element not ready');
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Transform data if needed
    const chartData = this.isTransformedData(this.data)
      ? this.data
      : transformToChartData(this.data as Array<{ label: string; value: number }>, this.dataLabel);

    // Create chart configuration based on type
    let config;
    switch (this.type) {
      case 'bar':
        config = createBarChartConfig(chartData, this.options);
        break;
      case 'pie':
        config = createPieChartConfig(chartData, 'pie', this.options);
        break;
      case 'doughnut':
        config = createPieChartConfig(chartData, 'doughnut', this.options);
        break;
      case 'line':
        config = createLineChartConfig(chartData, this.options);
        break;
      default:
        config = createBarChartConfig(chartData, this.options);
    }

    // Create chart
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, config as any);
    }
  }

  private isTransformedData(data: any): data is ChartData {
    return data && 'labels' in data && 'datasets' in data;
  }
}
