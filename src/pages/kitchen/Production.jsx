import React, { useState } from 'react';
import { 
  productionPlans, 
  productionPlanDetails, 
  logBatches,
  getProductById,
  getUserById 
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Factory, 
  Calendar, 
  User,
  Plus,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Production() {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [batchQuantity, setBatchQuantity] = useState('');
  const [batchProduct, setBatchProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Enrich production plans
  const enrichedPlans = productionPlans.map(plan => {
    const details = productionPlanDetails
      .filter(pd => pd.plan_id === plan.plan_id)
      .map(pd => ({
        ...pd,
        product: getProductById(pd.product_id)
      }));
    
    const batches = logBatches
      .filter(b => b.plan_id === plan.plan_id)
      .map(b => ({
        ...b,
        product: getProductById(b.product_id)
      }));

    const completedBatches = batches.filter(b => b.status === 'DONE').length;
    const totalBatches = batches.length;
    const progress = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0;

    return {
      ...plan,
      createdBy: getUserById(plan.created_by),
      details,
      batches,
      progress,
      completedBatches,
      totalBatches
    };
  });

  const activePlans = enrichedPlans.filter(p => p.status === 'PROCESSING');
  const completedPlans = enrichedPlans.filter(p => p.status === 'DONE');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleCreateBatch = async () => {
    if (!batchQuantity || !batchProduct) {
      toast.error('Vui lòng nhập đủ thông tin');
      return;
    }

    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Đã tạo lô sản xuất ${batchQuantity} ${batchProduct.product_name}`);
    setShowCreateBatch(false);
    setBatchQuantity('');
    setBatchProduct(null);
    setSelectedPlan(null);
    setIsCreating(false);
  };

  const handleCompleteBatch = async (batchId) => {
    toast.success(`Lô #${batchId} đã được đánh dấu hoàn thành`);
  };

  const PlanCard = ({ plan }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Kế hoạch #{plan.plan_id}
              <Badge variant={plan.status === 'PROCESSING' ? 'default' : 'secondary'}>
                {plan.status === 'PROCESSING' ? 'Đang thực hiện' : 'Hoàn thành'}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {plan.createdBy?.full_name}
              </span>
            </CardDescription>
          </div>
          {plan.status === 'PROCESSING' && (
            <Button 
              size="sm"
              onClick={() => {
                setSelectedPlan(plan);
                setShowCreateBatch(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tạo lô
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ sản xuất</span>
            <span className="text-muted-foreground">
              {plan.completedBatches}/{plan.totalBatches} lô
            </span>
          </div>
          <Progress value={plan.progress} className="h-2" />
        </div>

        {/* Plan Details */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mục tiêu sản xuất:</p>
          <div className="grid grid-cols-2 gap-2">
            {plan.details.map((detail) => (
              <div 
                key={detail.plan_detail_id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
              >
                <span>{detail.product?.image}</span>
                <span>{detail.product?.product_name}</span>
                <Badge variant="outline" className="ml-auto">{detail.quantity}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Batches */}
        {plan.batches.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Lô sản xuất:</p>
            <div className="space-y-2">
              {plan.batches.map((batch) => (
                <div 
                  key={batch.batch_id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{batch.product?.image}</span>
                    <div>
                      <p className="font-medium">Lô #{batch.batch_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.product?.product_name} - {batch.quantity} {batch.product?.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={batch.status} type="batch" />
                    {batch.status === 'PROCESSING' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteBatch(batch.batch_id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Hoàn thành
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.note && (
          <p className="text-sm text-muted-foreground border-t pt-3">
            Ghi chú: {plan.note}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý sản xuất</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý kế hoạch sản xuất
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            <Clock className="h-4 w-4 mr-2" />
            Đang thực hiện ({activePlans.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Hoàn thành ({completedPlans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activePlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Không có kế hoạch sản xuất đang thực hiện
              </CardContent>
            </Card>
          ) : (
            activePlans.map(plan => (
              <PlanCard key={plan.plan_id} plan={plan} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có kế hoạch sản xuất hoàn thành
              </CardContent>
            </Card>
          ) : (
            completedPlans.map(plan => (
              <PlanCard key={plan.plan_id} plan={plan} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Batch Dialog */}
      <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lô sản xuất mới</DialogTitle>
            <DialogDescription>
              Kế hoạch #{selectedPlan?.plan_id} - Chọn sản phẩm và số lượng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn sản phẩm</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedPlan?.details.map((detail) => (
                  <Button
                    key={detail.plan_detail_id}
                    type="button"
                    variant={batchProduct?.product_id === detail.product?.product_id ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setBatchProduct(detail.product)}
                  >
                    <span className="mr-2">{detail.product?.image}</span>
                    {detail.product?.product_name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Số lượng sản xuất</Label>
              <Input
                type="number"
                placeholder="Nhập số lượng"
                value={batchQuantity}
                onChange={(e) => setBatchQuantity(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBatch(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateBatch} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo lô sản xuất'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
