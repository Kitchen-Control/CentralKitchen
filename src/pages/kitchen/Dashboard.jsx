import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  inventories, 
  productionPlans, 
  logBatches,
  deliveries,
  orders,
  getProductById 
} from '../../data/mockData';
import { StatsCard } from '../../components/common/StatsCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { 
  Package, 
  Factory, 
  AlertTriangle, 
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function KitchenDashboard() {
  const navigate = useNavigate();

  // Calculate stats
  const totalInventory = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
  const activePlans = productionPlans.filter(p => p.status === 'PROCESSING').length;
  const processingBatches = logBatches.filter(b => b.status === 'PROCESSING').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'WAITTING').length;

  // Get low stock items (< 20 units)
  const lowStockItems = inventories
    .filter(inv => inv.quantity < 20)
    .map(inv => ({
      ...inv,
      product: getProductById(inv.product_id)
    }));

  // Get expiring soon items (within 3 days)
  const today = new Date();
  const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringItems = inventories
    .filter(inv => {
      const expiry = new Date(inv.expiry_date);
      return expiry <= threeDaysLater && expiry > today;
    })
    .map(inv => ({
      ...inv,
      product: getProductById(inv.product_id)
    }));

  // Production progress
  const activePlan = productionPlans.find(p => p.status === 'PROCESSING');
  const planBatches = activePlan 
    ? logBatches.filter(b => b.plan_id === activePlan.plan_id)
    : [];
  const completedBatches = planBatches.filter(b => b.status === 'DONE').length;
  const progressPercent = planBatches.length > 0 
    ? (completedBatches / planBatches.length) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bảng điều khiển</h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động bếp trung tâm
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng tồn kho"
          value={totalInventory.toLocaleString()}
          icon={Package}
          description="Đơn vị sản phẩm"
        />
        <StatsCard
          title="Kế hoạch sản xuất"
          value={activePlans}
          icon={Factory}
          description="Đang thực hiện"
        />
        <StatsCard
          title="Lô đang sản xuất"
          value={processingBatches}
          icon={Clock}
          description="Chờ hoàn thành"
        />
        <StatsCard
          title="Chờ xuất kho"
          value={pendingDeliveries}
          icon={Truck}
          description="Chuyến cần soạn"
        />
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="border-warning">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Sắp hết hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div 
                      key={item.inventory_id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.product?.image}</span>
                        {item.product?.product_name}
                      </span>
                      <Badge variant="outline" className="status-warning">
                        Còn {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiring Soon Alert */}
          {expiringItems.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Sắp hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div 
                      key={item.inventory_id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.product?.image}</span>
                        {item.product?.product_name}
                      </span>
                      <Badge variant="outline" className="status-damaged">
                        {new Date(item.expiry_date).toLocaleDateString('vi-VN')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tiến độ sản xuất</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen/production')}>
              Chi tiết
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePlan ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Kế hoạch #{activePlan.plan_id}</span>
                  <span className="text-muted-foreground">
                    {completedBatches}/{planBatches.length} lô
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-info">{planBatches.length - completedBatches}</p>
                    <p className="text-xs text-muted-foreground">Đang sản xuất</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-success">{completedBatches}</p>
                    <p className="text-xs text-muted-foreground">Hoàn thành</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Không có kế hoạch sản xuất đang thực hiện
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Outbound */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Chờ xuất kho</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen/outbound')}>
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingDeliveries === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có chuyến xe chờ soạn hàng
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries
                  .filter(d => d.status === 'WAITTING')
                  .slice(0, 3)
                  .map((delivery) => {
                    const deliveryOrders = orders.filter(o => o.delivery_id === delivery.delivery_id);
                    return (
                      <div 
                        key={delivery.delivery_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                            <Truck className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">Chuyến #{delivery.delivery_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {deliveryOrders.length} đơn hàng
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={delivery.status} type="delivery" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
