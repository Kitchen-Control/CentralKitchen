import React from 'react';
import { 
  deliveries, 
  orders, 
  orderDetails, 
  stores, 
  users,
  getProductById,
  useMockDataWatcher
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  User, 
  Calendar,
  Package,
  Phone
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

export default function Deliveries() {
  // This hook forces the component to re-render when mock data is mutated
  useMockDataWatcher();

  // Enrich deliveries with related data
  const enrichedDeliveries = deliveries.map(delivery => {
    const shipper = users.find(u => u.user_id === delivery.shipper_id);
    const deliveryOrders = orders
      .filter(o => o.delivery_id === delivery.delivery_id)
      .map(o => ({
        ...o,
        store: stores.find(s => s.store_id === o.store_id),
        details: orderDetails
          .filter(od => od.order_id === o.order_id)
          .map(od => ({
            ...od,
            product: getProductById(od.product_id)
          }))
      }));

    return {
      ...delivery,
      shipper,
      orders: deliveryOrders
    };
  });

  const waitingDeliveries = enrichedDeliveries.filter(d => d.status === 'WAITTING');
  const processingDeliveries = enrichedDeliveries.filter(d => d.status === 'PROCESSING');
  const doneDeliveries = enrichedDeliveries.filter(d => d.status === 'DONE');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const DeliveryCard = ({ delivery }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Chuyến #{delivery.delivery_id}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                {formatDate(delivery.delivery_date)}
              </div>
            </div>
          </div>
          <StatusBadge status={delivery.status} type="delivery" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipper Info */}
        {delivery.shipper && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{delivery.shipper.full_name}</p>
              <p className="text-sm text-muted-foreground">Shipper</p>
            </div>
          </div>
        )}

        {/* Orders Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {delivery.orders.map((order) => (
            <AccordionItem key={order.order_id} value={`order-${order.order_id}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Đơn #{order.order_id} - {order.store?.store_name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{order.store?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.store?.phone}</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    {order.details.map((detail) => (
                      <div 
                        key={detail.order_detail_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span>{detail.product?.image}</span>
                          {detail.product?.product_name}
                        </span>
                        <Badge variant="secondary">x{detail.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Summary */}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Tổng đơn hàng</span>
          <Badge>{delivery.orders.length} đơn</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý chuyến xe</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý các chuyến giao hàng
        </p>
      </div>

      <Tabs defaultValue="processing" className="w-full">
        <TabsList>
          <TabsTrigger value="waiting">
            Chờ giao ({waitingDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Đang giao ({processingDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            Hoàn thành ({doneDeliveries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="mt-6">
          {waitingDeliveries.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Không có chuyến chờ giao"
              description="Tất cả chuyến xe đã được bắt đầu giao"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {waitingDeliveries.map(delivery => (
                <DeliveryCard key={delivery.delivery_id} delivery={delivery} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processing" className="mt-6">
          {processingDeliveries.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Không có chuyến đang giao"
              description="Hiện tại không có chuyến xe nào đang giao hàng"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {processingDeliveries.map(delivery => (
                <DeliveryCard key={delivery.delivery_id} delivery={delivery} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-6">
          {doneDeliveries.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Chưa có chuyến hoàn thành"
              description="Chưa có chuyến giao hàng nào hoàn thành"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {doneDeliveries.map(delivery => (
                <DeliveryCard key={delivery.delivery_id} delivery={delivery} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
