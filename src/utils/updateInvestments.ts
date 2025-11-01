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

  // Accumulate deltas per user to minimize DB writes
  const deltasByUser: Record<string, number> = {};
  const investmentSaves: Promise<any>[] = [];

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

    // Compute delta and accumulate per user (apply payout fraction if configured)
    const rawDelta = Number((nextVal - prevVal).toFixed(2));
    const payoutFraction = Number(process.env.PAYOUT_FRACTION ?? 1);
    const credit =
      rawDelta > 0 ? Number((rawDelta * payoutFraction).toFixed(2)) : 0;
    if (credit > 0) {
      const uid = String(inv.user);
      deltasByUser[uid] = (deltasByUser[uid] || 0) + credit;
      console.log(
        `[Updater] queued credit ₦${credit} for user ${uid} from inv ${inv._id}`
      );
    }

    // If duration elapsed, mark completed (simple heuristic)
    const daysSinceStart = Math.floor(
      (Date.now() - (inv.startDate?.getTime?.() || 0)) / (1000 * 60 * 60 * 24)
    );
    if (inv.durationMonths && daysSinceStart >= inv.durationMonths * 30) {
      inv.status = "completed";
    }

    investmentSaves.push(inv.save());
  }

  // Save all investments in parallel
  try {
    await Promise.all(investmentSaves);
  } catch (err) {
    console.error("[Updater] error saving investments", err);
  }

  // Apply accumulated deltas to users (one update per user)
  const userUpdates: Promise<any>[] = [];
  for (const uid of Object.keys(deltasByUser)) {
    const amount = deltasByUser[uid];
    userUpdates.push(
      User.findByIdAndUpdate(uid, { $inc: { demoBalance: amount } })
        .then(() =>
          console.log(`[Updater] credited total ₦${amount} to user ${uid}`)
        )
        .catch((err) =>
          console.error(`[Updater] error crediting user ${uid}`, err)
        )
    );
  }

  if (userUpdates.length > 0) {
    await Promise.all(userUpdates);
  }
};

export default updateAllInvestments;
