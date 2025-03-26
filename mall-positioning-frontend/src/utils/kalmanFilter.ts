// utils/kalmanFilter.ts
export class KalmanFilter {
  private R: number;
  private Q: number;
  private P = 0;
  private X = 0;

  constructor(R = 1, Q = 0.01) {
    this.R = R;
    this.Q = Q;
  }

  filter(measurement: number): number {
    this.P += this.Q;
    const K = this.P / (this.P + this.R);
    this.X = this.X + K * (measurement - this.X);
    this.P *= (1 - K);
    return this.X;
  }
}

// 类型扩展（可选）
declare global {
  interface Window {
    kalmanFilters?: Record<string, KalmanFilter>;
  }
}
