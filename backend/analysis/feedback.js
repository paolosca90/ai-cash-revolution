import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { updateSignalOutcome } from "./analytics-tracker";
// Records trading results for AI model improvement.
export const recordFeedback = api({
    expose: true,
    method: "POST",
    path: "/analysis/feedback"
}, async (req) => {
    const { tradeId, actualDirection, profitLoss } = req;
    // Get the original prediction for performance tracking
    const signal = await analysisDB.queryRow `
      SELECT direction, confidence, user_id, symbol FROM trading_signals 
      WHERE trade_id = ${tradeId}
    `;
    if (!signal) {
        throw APIError.notFound("Trade signal not found.");
    }
    // Update the trading signal with actual results
    await analysisDB.exec `
      UPDATE trading_signals 
      SET closed_at = NOW(), profit_loss = ${profitLoss}, status = 'closed'
      WHERE trade_id = ${tradeId}
    `;
    // Record performance data for model improvement
    await analysisDB.exec `
      INSERT INTO ai_model_performance (
        model_version, trade_id, predicted_direction, actual_direction, 
        confidence, profit_loss, created_at
      ) VALUES (
        'v1.0', ${tradeId}, ${signal.direction}, ${actualDirection}, 
        ${signal.confidence}, ${profitLoss}, NOW()
      )
    `;
    // Update comprehensive analytics tracking
    await updateSignalOutcome(tradeId, actualDirection, profitLoss);
    console.log(`📊 Recorded feedback for ${tradeId}: Predicted ${signal.direction}, Actual ${actualDirection}, P/L: ${profitLoss}`);
    return { success: true };
});
//# sourceMappingURL=feedback.js.map