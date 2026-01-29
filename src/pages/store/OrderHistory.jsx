import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  orders, 
  orderDetails, 
  getProductById,
  notifyListeners,
  useMockDataWatcher
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Package, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  X,
  AlertCircle
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';

export default function OrderHistory() {
  const { user } = useAuth();
  // This hook forces the component to re-render when mock data is mutated
  useMockDataWatcher();

  const [openOrders, setOpenOrders] = useState([]);
  const [cancelOrder, setCancelOrder] = useState(null);

  // Filter orders by store
  const storeOrders = orders
    .filter(o => o.store_id === user?.store_id)
    .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

  const toggleOrder = (orderId) => {
    setOpenOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCancelOrder = async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const orderToCancel = orders.find(o => o.order_id === cancelOrder.order_id);
    if (orderToCancel) {
      orderToCancel.status = 'CANCLED';
    }
    notifyListeners();
    toast.success('Đơn hàng đã được hủy thành công');
    setCancelOrder(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (storeOrders.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Package}
          title="Chưa có đơn hàng"
          description="Bạn chưa đặt đơn hàng nào. Hãy bắt đầu đặt hàng ngay!"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử đơn hàng</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý các đơn hàng của cửa hàng
        </p>
      </div>

      <div className="space-y-4">
        {storeOrders.map((order) => {
          const details = orderDetails.filter(od => od.order_id === order.order_id);
          const isOpen = openOrders.includes(order.order_id);
          const canCancel = order.status === 'WAITTING';
          
          return (
            <Card key={order.order_id} className="overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => toggleOrder(order.order_id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            Đơn hàng #{order.order_id}
                            <StatusBadge status={order.status} type="order" />
                          </CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.order_date)}
                            </span>
                            <span>{details.length} sản phẩm</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelOrder(order);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Hủy
                          </Button>
                        )}
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="border-t pt-4">
                    <div className="space-y-3">
                      {details.map((detail) => {
                        const product = getProductById(detail.product_id);
                        return (
                          <div 
                            key={detail.order_detail_id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{product?.image || '🍞'}</span>
                              <div>
                                <p className="font-medium">{product?.product_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product?.price?.toLocaleString('vi-VN')}đ / {product?.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">x{detail.quantity}</p>
                              <p className="text-sm text-muted-foreground">
                                {((product?.price || 0) * detail.quantity).toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-muted-foreground">Tổng tiền</span>
                      <span className="text-lg font-bold text-primary">
                        {details.reduce((sum, d) => {
                          const product = getProductById(d.product_id);
                          return sum + (product?.price || 0) * d.quantity;
                        }, 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Bạn có chắc chắn muốn hủy đơn hàng #{cancelOrder?.order_id}? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quay lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelOrder}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hủy đơn hàng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
