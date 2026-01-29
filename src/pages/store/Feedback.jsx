import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  orders, 
  orderDetails, 
  getProductById, 
  qualityFeedbacks 
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { EmptyState } from '../../components/common/EmptyState';
import { Star, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export default function Feedback() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Get completed orders that can be rated (within 24 hours and not yet rated)
  const completedOrders = orders.filter(o => {
    if (o.store_id !== user?.store_id || o.status !== 'DONE') return false;
    
    // Check if already has feedback
    const hasFeedback = qualityFeedbacks.some(f => f.order_id === o.order_id);
    if (hasFeedback) return false;
    
    // Check 24-hour window (for demo, we'll allow all DONE orders)
    const orderDate = new Date(o.order_date);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
    return hoursDiff <= 24 || true; // Always allow for demo
  });

  // Get orders with existing feedback
  const ratedOrders = orders.filter(o => {
    if (o.store_id !== user?.store_id) return false;
    return qualityFeedbacks.some(f => f.order_id === o.order_id);
  });

  const handleSubmitFeedback = () => {
    if (!selectedOrder || rating === 0) {
      toast.error('Vui lòng chọn đơn hàng và đánh giá');
      return;
    }

    toast.success('Cảm ơn bạn đã đánh giá! Phản hồi đã được ghi nhận.');
    setSelectedOrder(null);
    setRating(0);
    setComment('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đánh giá chất lượng</h1>
        <p className="text-muted-foreground">
          Đánh giá chất lượng hàng hóa để giúp chúng tôi cải thiện dịch vụ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Feedback */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Đơn hàng chờ đánh giá
          </h2>
          
          {completedOrders.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Không có đơn hàng nào cần đánh giá
                </p>
              </CardContent>
            </Card>
          ) : (
            completedOrders.map((order) => {
              const details = orderDetails.filter(od => od.order_id === order.order_id);
              const isSelected = selectedOrder?.order_id === order.order_id;
              
              return (
                <Card 
                  key={order.order_id}
                  className={cn(
                    'cursor-pointer transition-all',
                    isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    setSelectedOrder(order);
                    setRating(0);
                    setComment('');
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Đơn hàng #{order.order_id}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.order_date)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {details.map((d) => {
                        const product = getProductById(d.product_id);
                        return (
                          <span 
                            key={d.order_detail_id}
                            className="inline-flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded"
                          >
                            {product?.image} {product?.product_name} x{d.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Feedback Form or History */}
        <div className="space-y-4">
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá đơn hàng #{selectedOrder.order_id}</CardTitle>
                <CardDescription>
                  Chia sẻ trải nghiệm của bạn về chất lượng hàng hóa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đánh giá của bạn</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star 
                          className={cn(
                            'h-8 w-8 transition-colors',
                            (hoverRating || rating) >= star
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rating === 0 && 'Chọn số sao để đánh giá'}
                    {rating === 1 && 'Rất không hài lòng'}
                    {rating === 2 && 'Không hài lòng'}
                    {rating === 3 && 'Bình thường'}
                    {rating === 4 && 'Hài lòng'}
                    {rating === 5 && 'Rất hài lòng'}
                  </p>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nhận xét (tùy chọn)</label>
                  <Textarea
                    placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0}
                  >
                    Gửi đánh giá
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Đã đánh giá
              </h2>
              
              {ratedOrders.length === 0 ? (
                <Card className="bg-muted/30">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      Bạn chưa đánh giá đơn hàng nào
                    </p>
                  </CardContent>
                </Card>
              ) : (
                ratedOrders.map((order) => {
                  const feedback = qualityFeedbacks.find(f => f.order_id === order.order_id);
                  return (
                    <Card key={order.order_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Đơn hàng #{order.order_id}</p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  className={cn(
                                    'h-4 w-4',
                                    star <= (feedback?.rating || 0)
                                      ? 'fill-warning text-warning'
                                      : 'text-muted-foreground'
                                  )}
                                />
                              ))}
                            </div>
                            {feedback?.comment && (
                              <p className="text-sm text-muted-foreground mt-2">
                                "{feedback.comment}"
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(feedback?.created_at)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
