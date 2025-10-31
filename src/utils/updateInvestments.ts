import Investment from "../models/Investment";
import User from "../models/User";

// Simple simulation step: update each active investment's currentValue
const simulateNextValue = (inv: any) => {
  const vol =
    inv.riskLevel === "High" ? 2.0 : inv.riskLevel === "Low" ? 0.5 : 1.0;
  const dailyDrift =
    (inv.expectedReturn || 0) / Math.max(inv.durationMonths * 30, 1);
  const randomFactor = (Math.random() - 0.5) * vol;
  const effectiveDailyPercent = dailyDrift + randomFactor;
  const prev = inv.currentValue ?? inv.initialAmount;
  const next = Math.max(0, prev + prev * (effectiveDailyPercent / 100));
  return Number(next.toFixed(2));
};

export const updateAllInvestments = async () => {
  // Find active investments, update them and their users' cached values if needed
  const active = await Investment.find({ status: "active" });
  for (const inv of active) {
    // Base step
    let nextVal = simulateNextValue(inv);

    // Occasionally apply a larger shock for fluctuating investments or by chance
    const applyShock = inv.fluctuate === true || Math.random() < 0.05; // 5% chance
    if (applyShock) {
      // shock between -25% and +25%
      const shockPercent = (Math.random() - 0.5) * 50;
      nextVal = Math.max(
        0,
        Number((nextVal + nextVal * (shockPercent / 100)).toFixed(2))
      );
      console.log(
        `[Updater] shock ${shockPercent.toFixed(2)}% applied to inv ${inv._id}`
      );
    }

    const prevVal = inv.currentValue ?? inv.initialAmount;
    inv.currentValue = nextVal;

    // If duration elapsed, mark completed (simple heuristic)
    const daysSinceStart = Math.floor(
      (Date.now() - (inv.startDate?.getTime?.() || 0)) / (1000 * 60 * 60 * 24)
    );
    if (inv.durationMonths && daysSinceStart >= inv.durationMonths * 30) {
      inv.status = "completed";
    }

    await inv.save();

    // No need to update user document here unless you keep derived totals there.
    // Optionally you could compute & store portfolio summaries on the user.
  }
};

export default updateAllInvestments;
