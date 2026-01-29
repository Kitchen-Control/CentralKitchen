import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { 
  getAvailableStock,
  orders,
  orderDetails,
  notifyListeners
} from '../../data/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Loader2,
  CheckCircle2,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
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

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateCart = () => {
    for (const item of items) {
      const available = getAvailableStock(item.product_id);
      if (item.quantity > available) {
        return { valid: false, item, available };
      }
    }
    return { valid: true };
  };

  const handleSubmitOrder = async () => {
    const validation = validateCart();
    
    if (!validation.valid) {
      toast.error(
        `${validation.item.product_name} chỉ còn ${validation.available} ${validation.item.unit}. Vui lòng điều chỉnh số lượng.`
      );
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // --- LOGIC CẬP NHẬT MOCK DATA ---
    // 1. Create a new order
    const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.order_id)) + 1 : 1;
    const newOrder = {
      order_id: newOrderId,
      delivery_id: null,
      store_id: user.store_id,
      plan_id: null, // Assuming no plan for direct orders
      order_date: new Date().toISOString(),
      status: 'WAITTING',
    };
    orders.push(newOrder);

    // 2. Create new order details
    items.forEach(item => {
      const newOrderDetailId = orderDetails.length > 0 ? Math.max(...orderDetails.map(od => od.order_detail_id)) + 1 : 1;
      orderDetails.push({ order_detail_id: newOrderDetailId, order_id: newOrderId, product_id: item.product_id, quantity: item.quantity });
    });
    // --------------------------------

    // Notify all listening components to re-render
    notifyListeners();

    setIsSubmitting(false);
    setShowConfirm(false);
    setShowSuccess(true);
    
    // Clear cart after successful order
    setTimeout(() => {
      clearCart();
      setShowSuccess(false);
      navigate('/store/orders');
    }, 2000);
  };

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="p-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/store')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <EmptyState
          icon={ShoppingCart}
          title="Giỏ hàng trống"
          description="Bạn chưa thêm sản phẩm nào vào giỏ hàng"
          action={() => navigate('/store')}
          actionLabel="Bắt đầu đặt hàng"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/store')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tiếp tục mua hàng
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold">Giỏ hàng ({items.length} sản phẩm)</h1>
          
          {items.map((item) => {
            const available = getAvailableStock(item.product_id);
            const isOverStock = item.quantity > available;
            
            return (
              <Card key={item.product_id} className={isOverStock ? 'border-destructive' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-secondary text-4xl">
                      {item.image || '🍞'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.price?.toLocaleString('vi-VN')}đ / {item.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tồn kho: {available} {item.unit}
                      </p>
                      {isOverStock && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vượt quá tồn kho
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="h-8 w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= available}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-semibold">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cửa hàng</span>
                  <span className="font-medium">{user?.store?.store_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Địa chỉ</span>
                  <span className="font-medium text-right max-w-[200px]">
                    {user?.store?.address}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary">{getTotalPrice().toLocaleString('vi-VN')}đ</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowConfirm(true)}
                disabled={!validateCart().valid}
              >
                Gửi đơn hàng
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đặt hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn gửi đơn hàng này? Đơn hàng sẽ được gửi đến bếp trung tâm để xử lý.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Đặt hàng thành công!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Đơn hàng của bạn đã được gửi đi. Bạn có thể theo dõi trạng thái đơn hàng trong phần Lịch sử đơn hàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
