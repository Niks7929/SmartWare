import math
import db_manager

def calculate_inventory_analytics(drift_multiplier=1.0):
    products = db_manager.get_all_products()
    suppliers = {s['id']: s for s in db_manager.get_all_suppliers()}
    warehouses = {w['id']: w for w in db_manager.get_all_warehouses()}
    
    total_skus = len(products)
    total_units = sum(p['quantity'] for p in products)
    total_valuation = sum(p['quantity'] * p['purchase_price'] for p in products)
    total_potential_revenue = sum(p['quantity'] * p['selling_price'] for p in products)
    
    low_stock_items = []
    critical_stock_items = []
    overstock_items = []
    dead_stock_items = []
    health_scores = []
    demand_forecasts = []
    reorder_recommendations = []
    
    category_summary = {}
    warehouse_distribution = {}
    
    for p in products:
        qty = p['quantity']
        min_lvl = p['min_stock_level']
        max_lvl = p['max_stock_level']
        reorder_pt = p['reorder_point']
        pur_price = p['purchase_price']
        sell_price = p['selling_price']
        category = p['category']
        wh_name = p.get('warehouse_name') or 'Default Warehouse'
        
        # 1. Category aggregation
        if category not in category_summary:
            category_summary[category] = {'count': 0, 'qty': 0, 'valuation': 0.0}
        category_summary[category]['count'] += 1
        category_summary[category]['qty'] += qty
        category_summary[category]['valuation'] += qty * pur_price

        # 2. Warehouse distribution
        if wh_name not in warehouse_distribution:
            warehouse_distribution[wh_name] = {'count': 0, 'qty': 0, 'valuation': 0.0}
        warehouse_distribution[wh_name]['count'] += 1
        warehouse_distribution[wh_name]['qty'] += qty
        warehouse_distribution[wh_name]['valuation'] += qty * pur_price
        
        # 3. Base sales velocity model + Drift Multiplier Simulation
        # Historical baseline: derived from reorder buffer cycle
        base_daily_velocity = max(0.5, (reorder_pt / 14.0))
        effective_daily_velocity = base_daily_velocity * drift_multiplier
        
        forecast_7d = round(effective_daily_velocity * 7, 1)
        forecast_30d = round(effective_daily_velocity * 30, 1)
        days_of_supply = round(qty / effective_daily_velocity, 1) if effective_daily_velocity > 0 else 999
        
        # 4. Stock Health Score (0 - 100)
        health = 100
        if qty == 0:
            status = 'OUT_OF_STOCK'
            health = 0
            critical_stock_items.append(p)
            low_stock_items.append(p)
        elif qty <= min_lvl:
            status = 'CRITICAL'
            health = max(10, int((qty / max(1, min_lvl)) * 40))
            critical_stock_items.append(p)
            low_stock_items.append(p)
        elif qty <= reorder_pt:
            status = 'LOW_STOCK'
            health = 50 + int(((qty - min_lvl) / max(1, reorder_pt - min_lvl)) * 30)
            low_stock_items.append(p)
        elif qty > max_lvl:
            status = 'OVERSTOCK'
            health = max(40, 100 - int(((qty - max_lvl) / max_lvl) * 40))
            overstock_items.append(p)
        elif days_of_supply > 180:
            status = 'DEAD_STOCK'
            health = 35
            dead_stock_items.append(p)
        else:
            status = 'HEALTHY'
            health = 95
            
        health_scores.append({
            'product_id': p['id'],
            'sku': p['sku'],
            'name': p['name'],
            'category': p['category'],
            'quantity': qty,
            'health_score': health,
            'status': status,
            'days_of_supply': days_of_supply
        })
        
        shortage_risk = 'CRITICAL' if qty <= min_lvl else ('HIGH' if days_of_supply < 7 else ('MEDIUM' if days_of_supply < 14 else 'LOW'))

        demand_forecasts.append({
            'product_id': p['id'],
            'sku': p['sku'],
            'name': p['name'],
            'current_quantity': qty,
            'min_stock_level': min_lvl,
            'reorder_point': reorder_pt,
            'daily_velocity': round(effective_daily_velocity, 2),
            'forecast_7d': forecast_7d,
            'forecast_30d': forecast_30d,
            'days_of_supply': days_of_supply,
            'shortage_risk': shortage_risk,
            'recommended_purchase_qty': max(0, max_lvl - qty)
        })
        
        # 5. Smart Purchase Recommendations with DUPLICATE PO DETECTION
        if qty <= reorder_pt:
            has_pending = db_manager.has_pending_po_for_product(p['id'])
            suggested_qty = max(min_lvl * 2, max_lvl - qty)
            supplier = suppliers.get(p.get('supplier_id')) or (list(suppliers.values())[0] if suppliers else None)
            
            reorder_recommendations.append({
                'product_id': p['id'],
                'sku': p['sku'],
                'name': p['name'],
                'current_stock': qty,
                'min_stock': min_lvl,
                'reorder_point': reorder_pt,
                'suggested_reorder_qty': suggested_qty,
                'unit_cost': pur_price,
                'estimated_total_cost': round(suggested_qty * pur_price, 2),
                'supplier_id': supplier['id'] if supplier else 'default',
                'supplier_name': supplier['name'] if supplier else 'Apex Semiconductor',
                'warehouse_id': p['warehouse_id'] or (list(warehouses.keys())[0] if warehouses else 'wh-central'),
                'warehouse_name': wh_name,
                'has_pending_po': has_pending,
                'shortage_risk': shortage_risk
            })
            
    avg_health_score = round(sum(h['health_score'] for h in health_scores) / max(1, len(health_scores)), 1)
    
    # Healthy count
    healthy_count = sum(1 for h in health_scores if h['status'] == 'HEALTHY')
    out_of_stock_count = sum(1 for h in health_scores if h['status'] == 'OUT_OF_STOCK')

    return {
        'total_skus': total_skus,
        'total_units': total_units,
        'total_valuation': round(total_valuation, 2),
        'total_potential_revenue': round(total_potential_revenue, 2),
        'potential_gross_margin': round(total_potential_revenue - total_valuation, 2),
        'gross_margin_percent': round(((total_potential_revenue - total_valuation) / max(1, total_potential_revenue)) * 100, 1),
        'low_stock_count': len(low_stock_items),
        'critical_stock_count': len(critical_stock_items),
        'healthy_stock_count': healthy_count,
        'out_of_stock_count': out_of_stock_count,
        'overstock_count': len(overstock_items),
        'dead_stock_count': len(dead_stock_items),
        'average_health_score': avg_health_score,
        'drift_multiplier': drift_multiplier,
        'category_summary': category_summary,
        'warehouse_distribution': warehouse_distribution,
        'demand_forecasts': demand_forecasts,
        'reorder_recommendations': reorder_recommendations,
        'health_scores': health_scores
    }
