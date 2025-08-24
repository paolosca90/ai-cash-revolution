import { api } from "encore.dev/api";
import { billingDB } from "./db";

// Revenue analytics interfaces
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  churnRate: number;
  trialConversions: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

export interface PlanMetrics {
  plan: string;
  activeSubscriptions: number;
  revenue: number;
  churnRate: number;
  conversionRate: number;
}

export interface DashboardMetrics {
  overview: RevenueMetrics;
  planBreakdown: PlanMetrics[];
  revenueHistory: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
  }>;
  cohortAnalysis: Array<{
    cohort: string;
    month0: number;
    month1: number;
    month3: number;
    month6: number;
    month12: number;
  }>;
}

// Get revenue dashboard metrics
export const getRevenueDashboard = api<{
  startDate?: string;
  endDate?: string;
}, { metrics: DashboardMetrics }>({
  method: "GET",
  path: "/billing/analytics/dashboard",
  expose: true,
}, async ({ startDate, endDate }) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
  const end = endDate ? new Date(endDate) : new Date();

  // Get overview metrics
  const overview = await getOverviewMetrics(start, end);
  
  // Get plan breakdown
  const planBreakdown = await getPlanBreakdown(start, end);
  
  // Get revenue history
  const revenueHistory = await getRevenueHistory(start, end);
  
  // Get cohort analysis (simplified version)
  const cohortAnalysis = await getCohortAnalysis();

  const metrics: DashboardMetrics = {
    overview,
    planBreakdown,
    revenueHistory,
    cohortAnalysis,
  };

  return { metrics };
});

// Get current subscription metrics
export const getSubscriptionMetrics = api<void, { metrics: RevenueMetrics }>({
  method: "GET",
  path: "/billing/analytics/subscriptions",
  expose: true,
}, async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const metrics = await getOverviewMetrics(thirtyDaysAgo, now);
  
  return { metrics };
});

// Get plan performance metrics
export const getPlanMetrics = api<{ planId?: string }, { metrics: PlanMetrics[] }>({
  method: "GET",
  path: "/billing/analytics/plans",
  expose: true,
}, async ({ planId }) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const metrics = await getPlanBreakdown(thirtyDaysAgo, now, planId);
  
  return { metrics };
});

// Get revenue trends over time
export const getRevenueTrends = api<{
  period: "daily" | "weekly" | "monthly";
  days?: number;
}, { trends: Array<{ date: string; revenue: number; subscriptions: number }> }>({
  method: "GET",
  path: "/billing/analytics/trends",
  expose: true,
}, async ({ period = "daily", days = 30 }) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  const trends = await getRevenueHistory(startDate, endDate, period);
  
  return { trends };
});

// Helper functions
async function getOverviewMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
  // Total revenue in the period
  const revenueResult = await billingDB.query(`
    SELECT SUM(revenue_cents) as total_revenue
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  const totalRevenue = (revenueResult.rows[0]?.total_revenue || 0) / 100;

  // Current MRR (latest available)
  const mrrResult = await billingDB.query(`
    SELECT SUM(mrr_cents) as mrr
    FROM revenue_analytics 
    WHERE date = (SELECT MAX(date) FROM revenue_analytics)
  `);

  const monthlyRecurringRevenue = (mrrResult.rows[0]?.mrr || 0) / 100;

  // Active subscriptions
  const activeResult = await billingDB.query(`
    SELECT COUNT(*) as active_count
    FROM subscriptions 
    WHERE status = 'active' AND plan != 'free'
  `);

  const activeSubscriptions = parseInt(activeResult.rows[0]?.active_count || 0);

  // New subscriptions in period
  const newResult = await billingDB.query(`
    SELECT SUM(new_subscriptions) as new_count
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  const newSubscriptions = parseInt(newResult.rows[0]?.new_count || 0);

  // Churned subscriptions in period
  const churnedResult = await billingDB.query(`
    SELECT SUM(churned_subscriptions) as churned_count
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  const churnedSubscriptions = parseInt(churnedResult.rows[0]?.churned_count || 0);

  // Calculate churn rate
  const churnRate = activeSubscriptions > 0 ? (churnedSubscriptions / activeSubscriptions) * 100 : 0;

  // Trial conversions
  const conversionsResult = await billingDB.query(`
    SELECT SUM(trial_conversions) as conversion_count
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  const trialConversions = parseInt(conversionsResult.rows[0]?.conversion_count || 0);

  // Calculate conversion rate (simplified - would need trial starts data)
  const conversionRate = newSubscriptions > 0 ? (trialConversions / newSubscriptions) * 100 : 0;

  // Average revenue per user
  const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

  // Simplified lifetime value (MRR * 12)
  const lifetimeValue = monthlyRecurringRevenue * 12;

  return {
    totalRevenue,
    monthlyRecurringRevenue,
    activeSubscriptions,
    newSubscriptions,
    churnedSubscriptions,
    churnRate,
    trialConversions,
    conversionRate,
    averageRevenuePerUser,
    lifetimeValue,
  };
}

async function getPlanBreakdown(startDate: Date, endDate: Date, planId?: string): Promise<PlanMetrics[]> {
  let query = `
    SELECT 
      plan,
      SUM(active_subscriptions) as active_count,
      SUM(revenue_cents) as total_revenue,
      SUM(churned_subscriptions) as churned_count,
      SUM(new_subscriptions) as new_count,
      SUM(trial_conversions) as conversion_count
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
  `;
  
  const params = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
  
  if (planId) {
    query += ` AND plan = $3`;
    params.push(planId);
  }
  
  query += ` GROUP BY plan ORDER BY total_revenue DESC`;

  const result = await billingDB.query(query, params);

  return result.rows.map(row => ({
    plan: row.plan,
    activeSubscriptions: parseInt(row.active_count || 0),
    revenue: (row.total_revenue || 0) / 100,
    churnRate: row.active_count > 0 ? ((row.churned_count || 0) / row.active_count) * 100 : 0,
    conversionRate: row.new_count > 0 ? ((row.conversion_count || 0) / row.new_count) * 100 : 0,
  }));
}

async function getRevenueHistory(
  startDate: Date, 
  endDate: Date, 
  groupBy: "daily" | "weekly" | "monthly" = "daily"
): Promise<Array<{ date: string; revenue: number; subscriptions: number }>> {
  
  let dateFormat;
  let groupByClause;
  
  switch (groupBy) {
    case "weekly":
      dateFormat = "YYYY-WW";
      groupByClause = "DATE_TRUNC('week', date)";
      break;
    case "monthly":
      dateFormat = "YYYY-MM";
      groupByClause = "DATE_TRUNC('month', date)";
      break;
    default:
      dateFormat = "YYYY-MM-DD";
      groupByClause = "date";
  }

  const result = await billingDB.query(`
    SELECT 
      ${groupByClause} as period,
      SUM(revenue_cents) as revenue,
      SUM(new_subscriptions) as subscriptions
    FROM revenue_analytics 
    WHERE date >= $1 AND date <= $2
    GROUP BY ${groupByClause}
    ORDER BY period
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  return result.rows.map(row => ({
    date: row.period.toISOString().split('T')[0],
    revenue: (row.revenue || 0) / 100,
    subscriptions: parseInt(row.subscriptions || 0),
  }));
}

async function getCohortAnalysis(): Promise<Array<{
  cohort: string;
  month0: number;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
}>> {
  // This is a simplified cohort analysis
  // In a real implementation, you'd track user cohorts by signup month
  // and their retention rates over time
  
  // For now, return mock data
  return [
    { cohort: "2024-01", month0: 100, month1: 85, month3: 72, month6: 64, month12: 56 },
    { cohort: "2024-02", month0: 100, month1: 88, month3: 75, month6: 68, month12: 0 },
    { cohort: "2024-03", month0: 100, month1: 82, month3: 71, month6: 0, month12: 0 },
  ];
}

// Export key metrics for external use
export const getKeyMetrics = api<void, {
  totalCustomers: number;
  monthlyRevenue: number;
  churnRate: number;
  avgRevenuePerUser: number;
}>({
  method: "GET", 
  path: "/billing/analytics/key-metrics",
  expose: true,
}, async () => {
  const metrics = await getOverviewMetrics(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date()
  );

  return {
    totalCustomers: metrics.activeSubscriptions,
    monthlyRevenue: metrics.monthlyRecurringRevenue,
    churnRate: metrics.churnRate,
    avgRevenuePerUser: metrics.averageRevenuePerUser,
  };
});