import { Product, Supplier, StockHealthScore } from '../types';
import { PredictionEngine } from './predictionEngine';

export class HealthEngine {
  /**
   * Computes the 0-100 Smart Inventory Health Score for a single product
   */
  static calculateHealthScore(product: Product, supplier?: Supplier): StockHealthScore {
    const pred = PredictionEngine.calculatePrediction(product, supplier);
    const keyIssues: string[] = [];
    const recommendations: string[] = [];

    // 1. Stock Level Score (Weight: 25%)
    let stockLevelScore = 100;
    if (product.currentStock === 0) {
      stockLevelScore = 0;
      keyIssues.push('Product is completely Out of Stock!');
      recommendations.push(`Place emergency PO for ${product.maxStock} units immediately.`);
    } else if (product.currentStock < product.minStock) {
      stockLevelScore = 40;
      keyIssues.push(`Stock (${product.currentStock}) is below minimum stock limit (${product.minStock}).`);
      recommendations.push(`Reorder at least ${pred.recommendedOrderQty} units from ${product.supplierName}.`);
    } else if (product.currentStock > product.maxStock * 1.2) {
      stockLevelScore = 60;
      keyIssues.push(`Overstock condition: Stock (${product.currentStock}) exceeds maximum capacity (${product.maxStock}).`);
      recommendations.push('Pause purchase orders and run promotional discount.');
    }

    // 2. Demand Velocity & Shortage Risk Score (Weight: 25%)
    let demandVelocityScore = 100;
    if (pred.shortageRisk === 'High Shortage Risk') {
      demandVelocityScore = 20;
      keyIssues.push(`Shortage Risk: Estimated stock duration is only ${pred.estimatedDaysRemaining} days (Lead time is ${supplier?.leadTimeDays || 5} days).`);
      recommendations.push('Expedite supplier shipping or transfer stock from secondary warehouse.');
    } else if (pred.shortageRisk === 'Moderate') {
      demandVelocityScore = 65;
      keyIssues.push(`Stock duration (${pred.estimatedDaysRemaining} days) approaching reorder point.`);
    }

    // 3. Expiry Risk Score (Weight: 20%)
    let expiryRiskScore = 100;
    const now = new Date();
    let earliestExpiryDays = 999;

    product.batches.forEach(b => {
      const expDate = new Date(b.expiryDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < earliestExpiryDays) {
        earliestExpiryDays = diffDays;
      }
    });

    if (earliestExpiryDays <= 0) {
      expiryRiskScore = 0;
      keyIssues.push('Has expired batch units in warehouse!');
      recommendations.push('Immediately quarantine and scrap expired batch items.');
    } else if (earliestExpiryDays <= 15) {
      expiryRiskScore = 25;
      keyIssues.push(`Batch expiring in ${earliestExpiryDays} days!`);
      recommendations.push(`Promote product or bundle with top seller to liquidate before ${earliestExpiryDays} days.`);
    } else if (earliestExpiryDays <= 45) {
      expiryRiskScore = 70;
      keyIssues.push(`Batch expiring within ${earliestExpiryDays} days.`);
    }

    // 4. Dead Stock / Slow Moving Score (Weight: 15%)
    let deadStockScore = 100;
    if (pred.deadStockFlag) {
      deadStockScore = 10;
      keyIssues.push('Flagged as DEAD STOCK (0-3 sales in past 90 days despite high inventory holding).');
      recommendations.push('Transfer to higher demand warehouse or discount by 30-50% for clearance.');
    } else if (pred.slowMovingFlag) {
      deadStockScore = 55;
      keyIssues.push('Flagged as SLOW MOVING stock.');
      recommendations.push('Reduce future PO quantity and review marketing placement.');
    }

    // 5. Lead Time Coverage Score (Weight: 15%)
    let leadTimeCoverageScore = 100;
    const leadTimeDays = supplier?.leadTimeDays || 5;
    const daysCovered = product.currentStock / (pred.dailyAvgDemand || 0.1);
    if (daysCovered < leadTimeDays) {
      leadTimeCoverageScore = 30;
    } else if (daysCovered > leadTimeDays * 5) {
      leadTimeCoverageScore = 75; // Excess buffer capital tied up
    }

    // Weighted Overall Calculation
    const overallScore = Math.round(
      (stockLevelScore * 0.25) +
      (demandVelocityScore * 0.25) +
      (expiryRiskScore * 0.20) +
      (deadStockScore * 0.15) +
      (leadTimeCoverageScore * 0.15)
    );

    let status: StockHealthScore['status'] = 'Healthy';
    if (overallScore < 50) {
      status = 'Critical';
    } else if (overallScore < 80) {
      status = 'Warning';
    }

    if (recommendations.length === 0) {
      recommendations.push('Stock levels, sales velocity, and expiry margins are optimal.');
    }

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      overallScore,
      status,
      subScores: {
        stockLevelScore,
        demandVelocityScore,
        expiryRiskScore,
        leadTimeCoverageScore,
        deadStockScore
      },
      keyIssues,
      recommendations
    };
  }

  static calculateBatchHealthScores(products: Product[], suppliers: Supplier[]): StockHealthScore[] {
    const supplierMap = new Map<string, Supplier>();
    suppliers.forEach(s => supplierMap.set(s.id, s));

    return products.map(p => this.calculateHealthScore(p, supplierMap.get(p.supplierId)));
  }
}
