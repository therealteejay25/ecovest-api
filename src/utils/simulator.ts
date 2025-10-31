type ProjectionPoint = { month: number; value: number; monthlyPercent: number };

export const simulateProjection = (
  initialAmount: number,
  expectedReturn: number,
  durationMonths: number,
  riskLevel: "Low" | "Medium" | "High" = "Medium"
): ProjectionPoint[] => {
  const volMap = { Low: 0.5, Medium: 1.0, High: 2.0 };
  const vol = volMap[riskLevel] || 1.0;
  const points: ProjectionPoint[] = [];

  const monthlyDriftPercent =
    (expectedReturn || 0) / Math.max(durationMonths, 1);
  let current = initialAmount;

  for (let m = 1; m <= Math.max(durationMonths, 1); m++) {
    const randomFactor = (Math.random() - 0.5) * vol;
    const effectivePercent = monthlyDriftPercent + randomFactor;
    const change = current * (effectivePercent / 100);
    current = Math.max(0, Number((current + change).toFixed(2)));
    points.push({
      month: m,
      value: current,
      monthlyPercent: Number(effectivePercent.toFixed(4)),
    });
  }

  return points;
};

export default simulateProjection;
