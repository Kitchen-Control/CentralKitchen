import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  deliveries, 
  orders, 
  orderDetails, 
  stores,
  getProductById,
  notifyListeners,
  useMockDataWatcher
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Package,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyTrips() {
  const { user } = useAuth();
  // This hook forces the component to re-render when mock data is mutated
  useMockDataWatcher();

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get deliveries assigned to this shipper
  const myDeliveries = deliveries
    .filter(d => d.shipper_id === user?.user_id)
    .map(d => ({
      ...d,
      orders: orders
        .filter(o => o.delivery_id === d.delivery_id)
        .map(o => ({
          ...o,
          store: stores.find(s => s.store_id === o.store_id),
          details: orderDetails
            .filter(od => od.order_id === o.order_id)
            .map(od => ({
              ...od,
              product: getProductById(od.product_id)
            }))
        }))
    }));

  const activeDeliveries = myDeliveries.filter(d => d.status === 'PROCESSING');
  const waitingDeliveries = myDeliveries.filter(d => d.status === 'WAITTING');
  const completedDeliveries = myDeliveries.filter(d => d.status === 'DONE');

  const handleStartDelivery = async (delivery) => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    // Find and update the delivery status
    const deliveryToUpdate = deliveries.find(d => d.delivery_id === delivery.delivery_id);
    if (deliveryToUpdate) {
      deliveryToUpdate.status = 'PROCESSING';
      // Also update related orders' status
      orders.forEach(order => {
        if (order.delivery_id === delivery.delivery_id) {
          order.status = 'DELIVERING';
        }
      });
    }

    toast.success('Đã bắt đầu chuyến giao hàng');
    notifyListeners();
    setIsUpdating(false);
  };

  const handleCompleteOrder = async (status) => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Find and update the order status
    const orderToUpdate = orders.find(o => o.order_id === selectedOrder.order_id);
    if (orderToUpdate) {
      orderToUpdate.status = status; // 'DONE' or 'DAMAGED'
    }

    if (status === 'DONE') {
      toast.success(`Đã giao thành công đơn hàng #${selectedOrder.order_id}`);
    } else {
      toast.warning(`Đã báo cáo đơn hàng #${selectedOrder.order_id} bị hư hỏng`);
    }
    notifyListeners();
    setShowCompleteDialog(false);
    setSelectedOrder(null);
    setIsUpdating(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const DeliveryCard = ({ delivery, showActions = true }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Chuyến #{delivery.delivery_id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(delivery.delivery_date)} • {delivery.orders.length} điểm giao
              </p>
            </div>
          </div>
          <StatusBadge status={delivery.status} type="delivery" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Orders List */}
        <div className="space-y-3">
          {delivery.orders.map((order, index) => (
            <div 
              key={order.order_id}
              className="p-3 bg-muted/50 rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium">{index + 1}</div>
                  <div>
                    <p className="font-medium">{order.store?.store_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.store?.address}
                    </p>
                  </div>
                </div>
                {showActions && delivery.status === 'PROCESSING' && order.status === 'DELIVERING' && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowCompleteDialog(true);
                    }}
                  >
                    Hoàn thành
                  </Button>
                )}
                {(order.status === 'DONE' || order.status === 'DAMAGED') && <StatusBadge status={order.status} type="order" />}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <a href={`tel:${order.store?.phone}`} className="text-primary hover:underline">
                  {order.store?.phone}
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {order.details.map((detail) => (
                  <span 
                    key={detail.order_detail_id}
                    className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded"
                  >
                    {detail.product?.image} {detail.product?.product_name} x{detail.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {showActions && delivery.status === 'WAITTING' && (
          <Button 
            className="w-full"
            onClick={() => handleStartDelivery(delivery)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Bắt đầu giao hàng
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (myDeliveries.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Truck}
          title="Chưa có chuyến giao hàng"
          description="Bạn chưa được phân công chuyến giao hàng nào"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chuyến hàng của tôi</h1>
        <p className="text-muted-foreground">
          Quản lý và theo dõi các chuyến giao hàng
        </p>
      </div>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-info" />
            Đang giao hàng
          </h2>
          {activeDeliveries.map(delivery => (
            <DeliveryCard key={delivery.delivery_id} delivery={delivery} />
          ))}
        </div>
      )}

      {/* Waiting Deliveries */}
      {waitingDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-warning" />
            Chờ nhận hàng
          </h2>
          {waitingDeliveries.map(delivery => (
            <DeliveryCard key={delivery.delivery_id} delivery={delivery} />
          ))}
        </div>
      )}

      {/* Completed Deliveries */}
      {completedDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Đã hoàn thành
          </h2>
          {completedDeliveries.map(delivery => (
            <DeliveryCard key={delivery.delivery_id} delivery={delivery} showActions={false} />
          ))}
        </div>
      )}

      {/* Complete Order Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành giao hàng</DialogTitle>
            <DialogDescription>
              Xác nhận trạng thái đơn hàng #{selectedOrder?.order_id} - {selectedOrder?.store?.store_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 border-success hover:bg-success/10"
              onClick={() => handleCompleteOrder('DONE')}
              disabled={isUpdating}
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
              <span>Giao thành công</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 border-destructive hover:bg-destructive/10"
              onClick={() => handleCompleteOrder('DAMAGED')}
              disabled={isUpdating}
            >
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <span>Hàng hư hỏng</span>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCompleteDialog(false)}>
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
