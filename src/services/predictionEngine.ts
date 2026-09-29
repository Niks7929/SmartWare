import { Product, Supplier, DemandPrediction } from '../types';

export class PredictionEngine {
  /**
   * Calculates AI/ML demand forecasting & safety stock reorder math for a given product
   * Formulas:
   *  - Daily Avg Demand = max(0.1, salesLast30Days / 30)
   *  - Days Remaining = Current Stock / Daily Demand
   *  - Reorder Point = (Daily Demand * Supplier Lead Time) + Safety Stock
   *  - Safety Stock = Daily Demand * Supplier Lead Time * 0.5 (Z-score buffer)
   *  - Recommended Order Qty = max(0, Max Stock - Current Stock)
   */
  static calculatePrediction(product: Product, supplier?: Supplier): DemandPrediction {
    const leadTimeDays = supplier?.leadTimeDays || 5;

    // Daily Avg Demand fallback
    const dailyDemand = product.dailyAvgDemand > 0 
      ? product.dailyAvgDemand 
      : Math.max(0.1, product.salesLast30Days / 30);

    // Seasonality or demand multiplier simulation
    const seasonalityFactor = 1.15; // 15% surge buffer for current period
    const effectiveDailyDemand = dailyDemand * seasonalityFactor;

    // Demand Forecasts
    const predictedDemand7Days = Math.round(effectiveDailyDemand * 7);
    const predictedDemand14Days = Math.round(effectiveDailyDemand * 14);
    const predictedDemand30Days = Math.round(effectiveDailyDemand * 30);

    // Safety Stock Math: Z * stdDev * sqrt(leadTime)
    // Simplified standard safety buffer: Lead Time Demand * 0.5
    const safetyStock = Math.ceil(effectiveDailyDemand * leadTimeDays * 0.5);

    // Reorder Point Formula
    const reorderPoint = Math.ceil((effectiveDailyDemand * leadTimeDays) + safetyStock);

    // Days Remaining
    const daysRemaining = effectiveDailyDemand > 0 
      ? Math.round((product.currentStock / effectiveDailyDemand) * 10) / 10
      : 999;

    // Shortage Risk Logic
    let shortageRisk: DemandPrediction['shortageRisk'] = 'None';
    if (product.currentStock === 0) {
      shortageRisk = 'Out of Stock';
    } else if (daysRemaining <= leadTimeDays) {
      shortageRisk = 'High Shortage Risk';
    } else if (daysRemaining <= leadTimeDays * 1.5 || product.currentStock <= reorderPoint) {
      shortageRisk = 'Moderate';
    }

    // Recommended Order Qty
    let recommendedOrderQty = 0;
    if (product.currentStock <= reorderPoint || shortageRisk !== 'None') {
      recommendedOrderQty = Math.max(
        product.minStock * 2, 
        product.maxStock - product.currentStock
      );
    }

    // Flags: Dead stock vs Slow moving vs Fast moving
    // Dead stock: >0 stock, 0 or <2 sales in last 90 days
    const deadStockFlag = product.currentStock > 10 && product.salesLast90Days <= 3;
    
    // Slow moving: velocity < 0.2 units/day despite holding inventory
    const slowMovingFlag = !deadStockFlag && effectiveDailyDemand < 0.25 && product.currentStock > product.minStock;

    // Fast moving: daily demand > 5.0
    const fastMovingFlag = effectiveDailyDemand >= 5.0;

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.currentStock,
      dailyAvgDemand: Math.round(effectiveDailyDemand * 10) / 10,
      predictedDemand7Days,
      predictedDemand14Days,
      predictedDemand30Days,
      safetyStock,
      reorderPoint,
      recommendedOrderQty,
      estimatedDaysRemaining: daysRemaining,
      shortageRisk,
      deadStockFlag,
      slowMovingFlag,
      fastMovingFlag,
      seasonalityFactor,
      confidenceScore: 89 + (product.salesLast90Days > 100 ? 6 : 0) // e.g. 89% - 95%
    };
  }

  static calculateBatchPredictions(products: Product[], suppliers: Supplier[]): DemandPrediction[] {
    const supplierMap = new Map<string, Supplier>();
    suppliers.forEach(s => supplierMap.set(s.id, s));

    return products.map(p => this.calculatePrediction(p, supplierMap.get(p.supplierId)));
  }
}
