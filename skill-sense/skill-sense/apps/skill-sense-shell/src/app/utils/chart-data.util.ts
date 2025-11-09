import { ChartConfiguration, ChartType } from 'chart.js';

/**
 * Chart Data Utilities
 *
 * Adapted from previous dashboard implementations.
 * Provides data transformation and chart configuration helpers.
 */

/**
 * Chart data structure
 */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Generate colors for charts
 */
export function generateChartColors(count: number): string[] {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#a855f7', // violet
  ];

  if (count <= colors.length) {
    return colors.slice(0, count);
  }

  // Generate additional colors if needed
  const result = [...colors];
  while (result.length < count) {
    const hue = (result.length * 137.508) % 360; // Golden angle
    result.push(`hsl(${hue}, 70%, 60%)`);
  }

  return result;
}

/**
 * Transform data to chart format
 */
export function transformToChartData(
  data: Array<{ label: string; value: number }>,
  label: string = 'Data'
): ChartData {
  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label,
        data: data.map(d => d.value),
        backgroundColor: generateChartColors(data.length),
      }
    ]
  };
}

/**
 * Create bar chart configuration
 */
export function createBarChartConfig(
  data: ChartData,
  options?: any
): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      ...options,
    },
  };
}

/**
 * Create pie/doughnut chart configuration
 */
export function createPieChartConfig(
  data: ChartData,
  type: 'pie' | 'doughnut' = 'pie',
  options?: any
): ChartConfiguration<'pie' | 'doughnut'> {
  return {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
        tooltip: {
          enabled: true,
        },
      },
      ...options,
    },
  };
}

/**
 * Create line chart configuration
 */
export function createLineChartConfig(
  data: ChartData,
  options?: any
): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      ...options,
    },
  };
}
