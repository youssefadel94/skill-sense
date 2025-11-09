import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiService } from '../services/api.service';

Chart.register(...registerables);

interface TrendData {
  skill: string;
  category: string;
  demandChange: number; // percentage change
  currentDemand: number; // 0-100
  salaryRange: { min: number; max: number };
  growthRate: 'rising' | 'stable' | 'declining';
  jobOpenings: number;
}

interface CategoryTrend {
  category: string;
  skillCount: number;
  avgDemand: number;
  trending: boolean;
}

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="trends-container">
      <header class="page-header">
        <div>
          <h1>📈 Market Trends</h1>
          <p class="subtitle">Track skill demand and market insights</p>
        </div>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading market trends...</p>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (!loading && !error) {
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card trending">
            <div class="card-icon">🔥</div>
            <div class="card-content">
              <div class="card-value">{{ trendingSkills.length }}</div>
              <div class="card-label">Trending Skills</div>
            </div>
          </div>
          <div class="summary-card rising">
            <div class="card-icon">📈</div>
            <div class="card-content">
              <div class="card-value">{{ risingSkills.length }}</div>
              <div class="card-label">Rising Demand</div>
            </div>
          </div>
          <div class="summary-card stable">
            <div class="card-icon">⚖️</div>
            <div class="card-content">
              <div class="card-value">{{ stableSkills.length }}</div>
              <div class="card-label">Stable Skills</div>
            </div>
          </div>
          <div class="summary-card declining">
            <div class="card-icon">📉</div>
            <div class="card-content">
              <div class="card-value">{{ decliningSkills.length }}</div>
              <div class="card-label">Declining</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="chart-card">
            <h3>🔝 Top 10 Trending Skills</h3>
            <canvas #topSkillsChart></canvas>
          </div>

          <div class="chart-card">
            <h3>📊 Skills by Category</h3>
            <canvas #categoryChart></canvas>
          </div>
        </div>

        <div class="charts-section">
          <div class="chart-card full-width">
            <h3>📈 Demand Growth Over Time</h3>
            <canvas #demandChart></canvas>
          </div>
        </div>

        <!-- Trending Skills Table -->
        <div class="table-section">
          <h2>🔥 Hottest Skills Right Now</h2>
          <div class="table-container">
            <table class="trends-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Skill</th>
                  <th>Category</th>
                  <th>Demand</th>
                  <th>Change</th>
                  <th>Salary Range</th>
                  <th>Job Openings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (trend of topTrends; track trend.skill; let i = $index) {
                  <tr>
                    <td class="rank">{{ i + 1 }}</td>
                    <td class="skill-name">
                      <strong>{{ trend.skill }}</strong>
                    </td>
                    <td>
                      <span class="category-badge">{{ trend.category }}</span>
                    </td>
                    <td>
                      <div class="demand-bar">
                        <div class="demand-fill" [style.width.%]="trend.currentDemand"></div>
                        <span class="demand-text">{{ trend.currentDemand }}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        class="change-badge"
                        [class.positive]="trend.demandChange > 0"
                        [class.negative]="trend.demandChange < 0"
                      >
                        {{ trend.demandChange > 0 ? '+' : '' }}{{ trend.demandChange }}%
                      </span>
                    </td>
                    <td class="salary">
                      @if (trend.salaryRange && trend.salaryRange.min && trend.salaryRange.max) {
                        {{ '$' + trend.salaryRange.min }}k - {{ '$' + trend.salaryRange.max }}k
                      } @else {
                        N/A
                      }
                    </td>
                    <td class="openings">
                      {{ formatNumber(trend.jobOpenings) }}
                    </td>
                    <td>
                      <span class="status-badge" [class]="trend.growthRate">
                        {{ getGrowthIcon(trend.growthRate) }}
                        {{ trend.growthRate }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Category Insights -->
        <div class="insights-section">
          <h2>📋 Category Insights</h2>
          <div class="category-grid">
            @for (cat of categoryTrends; track cat.category) {
              <div class="category-card" [class.trending]="cat.trending">
                <h4>{{ cat.category }}</h4>
                @if (cat.trending) {
                  <span class="trending-badge">🔥 Trending</span>
                }
                <div class="category-stats">
                  <div class="stat">
                    <span class="stat-label">Skills:</span>
                    <span class="stat-value">{{ cat.skillCount }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Avg Demand:</span>
                    <span class="stat-value">{{ cat.avgDemand }}%</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .trends-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
    }

    .page-header h1 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 32px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .card-icon {
      font-size: 48px;
    }

    .card-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      line-height: 1;
    }

    .card-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }

    .chart-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-card h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
    }

    canvas {
      max-height: 300px;
    }

    .table-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .table-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .table-container {
      overflow-x: auto;
    }

    .trends-table {
      width: 100%;
      border-collapse: collapse;
    }

    .trends-table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e5e7eb;
    }

    .trends-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .trends-table tbody tr:hover {
      background: #f9fafb;
    }

    .rank {
      font-weight: bold;
      color: #667eea;
      width: 50px;
    }

    .skill-name strong {
      color: #333;
    }

    .category-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .demand-bar {
      position: relative;
      width: 100px;
      height: 20px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .demand-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
    }

    .demand-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .change-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .change-badge.positive {
      background: #d1fae5;
      color: #059669;
    }

    .change-badge.negative {
      background: #fee;
      color: #dc2626;
    }

    .salary {
      color: #059669;
      font-weight: 500;
      white-space: nowrap;
    }

    .openings {
      color: #666;
      font-weight: 500;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-badge.rising {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.stable {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .status-badge.declining {
      background: #fef3c7;
      color: #d97706;
    }

    .insights-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .insights-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .category-card {
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .category-card.trending {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      border-left-color: #ef4444;
    }

    .category-card h4 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 16px;
    }

    .trending-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #fee;
      color: #dc2626;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .category-stats {
      display: flex;
      gap: 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
    }

    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .charts-section {
        grid-template-columns: 1fr;
      }

      .table-container {
        overflow-x: scroll;
      }
    }
  `]
})
export class TrendsComponent implements OnInit, AfterViewInit {
  @ViewChild('topSkillsChart') topSkillsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('demandChart') demandChartRef!: ElementRef<HTMLCanvasElement>;

  private apiService = inject(ApiService);

  loading = true;
  error = '';

  trends: TrendData[] = [];
  categoryTrends: CategoryTrend[] = [];

  get topTrends(): TrendData[] {
    return this.trends.slice(0, 15);
  }

  get trendingSkills(): TrendData[] {
    return this.trends.filter(t => t.demandChange > 20);
  }

  get risingSkills(): TrendData[] {
    return this.trends.filter(t => t.growthRate === 'rising');
  }

  get stableSkills(): TrendData[] {
    return this.trends.filter(t => t.growthRate === 'stable');
  }

  get decliningSkills(): TrendData[] {
    return this.trends.filter(t => t.growthRate === 'declining');
  }

  ngOnInit() {
    this.loadTrends();
  }

  ngAfterViewInit() {
    // Charts will be created after data loads
  }

  async loadTrends() {
    try {
      this.loading = true;
      this.error = '';

      this.apiService.getSkillTrends().subscribe({
        next: (data) => {
          // Map API response to TrendData interface
          this.trends = (data.trending || []).map((item: any) => ({
            skill: item.skill,
            category: item.category || 'Other',
            demandChange: item.change || 0,
            currentDemand: parseFloat(item.percentage) || 0,
            salaryRange: item.salaryRange || { min: 0, max: 0 },
            growthRate: this.determineGrowthRate(item.change || 0),
            jobOpenings: item.count || 0
          }));

          // Map category trends
          this.categoryTrends = (data.topCategories || []).map((item: any) => ({
            category: item.category,
            skillCount: item.count,
            avgDemand: parseFloat(item.percentage) || 0,
            trending: (parseFloat(item.percentage) || 0) > 20
          }));

          this.createCharts();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load trends:', err);
          this.error = err.message || 'Failed to load trends';
          this.loading = false;
        }
      });

    } catch (err: any) {
      this.error = err.message || 'Failed to load trends';
      this.loading = false;
    }
  }

  determineGrowthRate(change: number): 'rising' | 'stable' | 'declining' {
    if (change > 10) return 'rising';
    if (change < -10) return 'declining';
    return 'stable';
  }

  createCharts() {
    // Wait for next tick to ensure canvas elements are rendered
    setTimeout(() => {
      this.createTopSkillsChart();
      this.createCategoryChart();
      this.createDemandChart();
    }, 0);
  }

  createTopSkillsChart() {
    if (!this.topSkillsChartRef?.nativeElement) {
      console.warn('Top skills chart element not ready');
      return;
    }

    const top10 = this.trends.slice(0, 10);
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: top10.map(t => t.skill),
        datasets: [{
          label: 'Demand Score',
          data: top10.map(t => t.currentDemand),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    new Chart(this.topSkillsChartRef.nativeElement, config);
  }

  createCategoryChart() {
    if (!this.categoryChartRef?.nativeElement) {
      console.warn('Category chart element not ready');
      return;
    }

    const categories = [...new Set(this.trends.map(t => t.category))];
    const categoryCounts = categories.map(cat =>
      this.trends.filter(t => t.category === cat).length
    );

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: categoryCounts,
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a',
            '#fee140',
            '#30cfd0'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    new Chart(this.categoryChartRef.nativeElement, config);
  }

  createDemandChart() {
    if (!this.demandChartRef?.nativeElement) {
      console.warn('Demand chart element not ready');
      return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const topSkills = this.trends.slice(0, 5);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: months,
        datasets: topSkills.map((skill, index) => ({
          label: skill.skill,
          data: this.generateTrendLine(skill.currentDemand),
          borderColor: this.getColorForIndex(index),
          backgroundColor: this.getColorForIndex(index, 0.1),
          tension: 0.4
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    new Chart(this.demandChartRef.nativeElement, config);
  }

  generateTrendLine(endValue: number): number[] {
    const values = [];
    const startValue = endValue - 30 + Math.random() * 20;
    for (let i = 0; i < 6; i++) {
      const progress = i / 5;
      const value = startValue + (endValue - startValue) * progress + (Math.random() - 0.5) * 10;
      values.push(Math.max(0, Math.min(100, value)));
    }
    return values;
  }

  getColorForIndex(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(102, 126, 234, ${alpha})`,
      `rgba(118, 75, 162, ${alpha})`,
      `rgba(240, 147, 251, ${alpha})`,
      `rgba(79, 172, 254, ${alpha})`,
      `rgba(67, 233, 123, ${alpha})`
    ];
    return colors[index % colors.length];
  }

  getGrowthIcon(rate: string): string {
    const icons: Record<string, string> = {
      rising: '📈',
      stable: '➡️',
      declining: '📉'
    };
    return icons[rate] || '';
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  private generateMockTrends(): TrendData[] {
    return [
      { skill: 'Kubernetes', category: 'DevOps', demandChange: 45, currentDemand: 92, salaryRange: { min: 120, max: 180 }, growthRate: 'rising', jobOpenings: 15420 },
      { skill: 'Python', category: 'Programming', demandChange: 38, currentDemand: 95, salaryRange: { min: 100, max: 160 }, growthRate: 'rising', jobOpenings: 28350 },
      { skill: 'React', category: 'Frontend', demandChange: 35, currentDemand: 90, salaryRange: { min: 90, max: 150 }, growthRate: 'rising', jobOpenings: 22100 },
      { skill: 'AWS', category: 'Cloud', demandChange: 32, currentDemand: 88, salaryRange: { min: 110, max: 170 }, growthRate: 'rising', jobOpenings: 18750 },
      { skill: 'TypeScript', category: 'Programming', demandChange: 30, currentDemand: 85, salaryRange: { min: 95, max: 155 }, growthRate: 'rising', jobOpenings: 16890 },
      { skill: 'Docker', category: 'DevOps', demandChange: 28, currentDemand: 87, salaryRange: { min: 105, max: 165 }, growthRate: 'rising', jobOpenings: 14230 },
      { skill: 'GraphQL', category: 'Backend', demandChange: 25, currentDemand: 75, salaryRange: { min: 100, max: 160 }, growthRate: 'rising', jobOpenings: 9450 },
      { skill: 'Terraform', category: 'Infrastructure', demandChange: 22, currentDemand: 78, salaryRange: { min: 115, max: 175 }, growthRate: 'rising', jobOpenings: 8320 },
      { skill: 'Go', category: 'Programming', demandChange: 20, currentDemand: 72, salaryRange: { min: 110, max: 170 }, growthRate: 'rising', jobOpenings: 7890 },
      { skill: 'PostgreSQL', category: 'Database', demandChange: 18, currentDemand: 80, salaryRange: { min: 95, max: 145 }, growthRate: 'stable', jobOpenings: 12340 },
      { skill: 'Node.js', category: 'Backend', demandChange: 15, currentDemand: 82, salaryRange: { min: 90, max: 150 }, growthRate: 'stable', jobOpenings: 16540 },
      { skill: 'MongoDB', category: 'Database', demandChange: 12, currentDemand: 70, salaryRange: { min: 85, max: 140 }, growthRate: 'stable', jobOpenings: 10230 },
      { skill: 'Vue.js', category: 'Frontend', demandChange: 10, currentDemand: 65, salaryRange: { min: 85, max: 140 }, growthRate: 'stable', jobOpenings: 8670 },
      { skill: 'Redis', category: 'Database', demandChange: 8, currentDemand: 68, salaryRange: { min: 95, max: 150 }, growthRate: 'stable', jobOpenings: 7450 },
      { skill: 'Angular', category: 'Frontend', demandChange: -5, currentDemand: 75, salaryRange: { min: 90, max: 145 }, growthRate: 'declining', jobOpenings: 11230 },
      { skill: 'jQuery', category: 'Frontend', demandChange: -15, currentDemand: 45, salaryRange: { min: 70, max: 110 }, growthRate: 'declining', jobOpenings: 5670 },
    ];
  }

  private generateCategoryTrends(): CategoryTrend[] {
    const categories = [...new Set(this.trends.map(t => t.category))];
    return categories.map(cat => {
      const catSkills = this.trends.filter(t => t.category === cat);
      const avgDemand = Math.round(
        catSkills.reduce((sum, s) => sum + s.currentDemand, 0) / catSkills.length
      );
      return {
        category: cat,
        skillCount: catSkills.length,
        avgDemand,
        trending: avgDemand > 80
      };
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
