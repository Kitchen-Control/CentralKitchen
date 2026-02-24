import React, { useState, useEffect, useCallback } from 'react';
import {
  getProductionPlans,
  getLogBatches,
  createLogBatch,
  updateBatchStatus,
  createTransaction,
} from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { ChefHat, Plus, CheckSquare, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { BATCH_STATUS } from '../../data/constants';

// Badge màu theo trạng thái batch
const BatchStatusBadge = ({ status }) => {
  const cfg = BATCH_STATUS[status] || { label: status };
  const colorMap = {
    info:        'bg-blue-100 text-blue-800',
    success:     'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
    warning:     'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorMap[cfg.color] || 'bg-gray-100 text-gray-800'}`}>
      {cfg.label}
    </span>
  );
};

export default function Production() {
  const [plans, setPlans]         = useState([]);
  const [batches, setBatches]     = useState([]);
  const [loading, setLoading]     = useState(true);

  // Phân lô dialog
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId]   = useState('');
  const [batchForm, setBatchForm]             = useState({ quantity: '', expiryDate: '' });
  const [isCreating, setIsCreating]           = useState(false);

  // Hoàn thành lô dialog
  const [completingBatch, setCompletingBatch] = useState(null);
  const [isCompleting, setIsCompleting]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, batchesRes] = await Promise.allSettled([
        getProductionPlans(),
        getLogBatches(),
      ]);
      setPlans(plansRes.status  === 'fulfilled' && Array.isArray(plansRes.value)   ? plansRes.value   : []);
      setBatches(batchesRes.status === 'fulfilled' && Array.isArray(batchesRes.value) ? batchesRes.value : []);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Phân lô: tạo log_batch mới gắn với plan
  const handleCreateBatch = async () => {
    if (!selectedPlanId) { toast.error('Vui lòng chọn kế hoạch'); return; }
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) { toast.error('Số lượng phải lớn hơn 0'); return; }
    if (!batchForm.expiryDate) { toast.error('Vui lòng nhập hạn sử dụng'); return; }

    const plan = plans.find((p) => String(p.planId ?? p.plan_id ?? p.id) === selectedPlanId);
    if (!plan) { toast.error('Không tìm thấy kế hoạch'); return; }

    setIsCreating(true);
    try {
      await createLogBatch({
        planId:     Number(selectedPlanId),
        productId:  plan.productId ?? plan.product_id ?? plan.product?.productId,
        type:       'PRODUCTION',
        status:     'PROCESSING',
        quantity:   Number(batchForm.quantity),
        expiryDate: new Date(batchForm.expiryDate).toISOString(),
      });
      toast.success('Đã tạo lô sản xuất! Trạng thái: Đang sản xuất');
      setShowBatchDialog(false);
      setBatchForm({ quantity: '', expiryDate: '' });
      setSelectedPlanId('');
      await loadData();
    } catch (err) {
      toast.error('Tạo lô thất bại: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Hoàn thành lô: cập nhật status → DONE, sau đó nhập kho tự động
  const handleCompleteBatch = async () => {
    if (!completingBatch) return;
    setIsCompleting(true);
    try {
      const batchId = completingBatch.batchId ?? completingBatch.batch_id ?? completingBatch.id;

      // Bước 1: Cập nhật trạng thái lô thành DONE
      await updateBatchStatus(batchId, 'DONE');

      // Bước 2: Tạo inventory_transaction IMPORT để nhập kho tự động
      const productId = completingBatch.productId ?? completingBatch.product_id;
      if (productId) {
        try {
          await createTransaction({
            batchId,
            productId,
            type:     'IMPORT',
            quantity: completingBatch.quantity,
            note:     `Nhập kho từ lô sản xuất #${batchId}`,
          });
        } catch (txErr) {
          console.warn('Tạo inventory transaction thất bại (sẽ cần nhập kho thủ công):', txErr.message);
        }
      }

      toast.success(`Lô #${batchId} hoàn thành! Hàng đã được nhập kho.`);
      setCompletingBatch(null);
      await loadData();
    } catch (err) {
      toast.error('Cập nhật lô thất bại: ' + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const productionBatches = batches.filter((b) => !b.type || b.type === 'PRODUCTION');
  const processingBatches = productionBatches.filter((b) => b.status === 'PROCESSING');
  const doneBatches       = productionBatches.filter((b) => b.status === 'DONE');

  // Tên sản phẩm theo plan
  const productNameForPlan = (plan) =>
    plan?.productName ??
    plan?.product?.productName ??
    `Sản phẩm #${plan?.productId ?? plan?.product_id ?? '?'}`;

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Thực thi sản xuất
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Phân lô và cập nhật tiến độ sản xuất theo kế hoạch của Manager
          </p>
        </div>
        <Button onClick={() => setShowBatchDialog(true)} disabled={plans.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo lô sản xuất
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng kế hoạch',   value: plans.length,              color: 'text-foreground' },
          { label: 'Đang sản xuất',    value: processingBatches.length,  color: 'text-blue-600'   },
          { label: 'Lô hoàn thành',   value: doneBatches.length,         color: 'text-green-600'  },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Đang sản xuất / Hoàn thành */}
      <Tabs defaultValue="processing">
        <TabsList>
          <TabsTrigger value="processing">
            Đang sản xuất
            {processingBatches.length > 0 && (
              <Badge className="ml-2 text-xs" variant="secondary">{processingBatches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="done">Hoàn thành</TabsTrigger>
          <TabsTrigger value="plans">Kế hoạch nhận được</TabsTrigger>
        </TabsList>

        {/* --- Tab: Đang sản xuất --- */}
        <TabsContent value="processing" className="mt-4">
          {processingBatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Không có lô nào đang sản xuất</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {processingBatches.map((b) => {
                const id      = b.batchId ?? b.batch_id ?? b.id;
                const plan    = plans.find((p) => (p.planId ?? p.plan_id ?? p.id) === (b.planId ?? b.plan_id));
                const pName   = productNameForPlan(plan) || `SP #${b.productId ?? b.product_id}`;
                return (
                  <Card key={id} className="border-l-4 border-blue-500">
                    <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold">{pName}</p>
                        <p className="text-sm text-muted-foreground">
                          Lô #{id} &nbsp;·&nbsp; SL: <span className="font-medium">{b.quantity}</span>
                          &nbsp;·&nbsp; HSD: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BatchStatusBadge status={b.status} />
                        <Button
                          size="sm"
                          onClick={() => setCompletingBatch(b)}
                        >
                          <CheckSquare className="h-4 w-4 mr-1" />
                          Hoàn thành
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* --- Tab: Hoàn thành --- */}
        <TabsContent value="done" className="mt-4">
          {doneBatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có lô nào hoàn thành
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>HSD</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doneBatches.map((b) => {
                  const bId   = b.batchId ?? b.batch_id ?? b.id;
                  const plan  = plans.find((p) => (p.planId ?? p.plan_id ?? p.id) === (b.planId ?? b.plan_id));
                  return (
                    <TableRow key={bId}>
                      <TableCell className="font-mono text-sm">#{bId}</TableCell>
                      <TableCell>{productNameForPlan(plan) || `SP #${b.productId}`}</TableCell>
                      <TableCell>{b.quantity}</TableCell>
                      <TableCell>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell><BatchStatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* --- Tab: Kế hoạch nhận được --- */}
        <TabsContent value="plans" className="mt-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có kế hoạch nào từ Manager
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Mục tiêu</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => {
                  const pid = p.planId ?? p.plan_id ?? p.id;
                  return (
                    <TableRow key={pid}>
                      <TableCell className="font-mono text-sm">#{pid}</TableCell>
                      <TableCell>{productNameForPlan(p)}</TableCell>
                      <TableCell>{p.plannedQuantity ?? p.planned_quantity ?? '—'}</TableCell>
                      <TableCell>
                        {p.planDate ? new Date(p.planDate).toLocaleDateString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.note || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Tạo lô sản xuất */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo lô sản xuất</DialogTitle>
            <DialogDescription>
              Phân lô theo kế hoạch của Manager. Mỗi lô chỉ có 1 loại sản phẩm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Kế hoạch sản xuất <span className="text-destructive">*</span></Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kế hoạch" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => {
                    const pid = p.planId ?? p.plan_id ?? p.id;
                    return (
                      <SelectItem key={pid} value={String(pid)}>
                        KH#{pid} — {productNameForPlan(p)} (Mục tiêu: {p.plannedQuantity ?? '?'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Số lượng lô <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="1"
                placeholder="VD: 50"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hạn sử dụng <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={batchForm.expiryDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Hủy</Button>
            <Button onClick={handleCreateBatch} disabled={isCreating}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tạo...</> : 'Tạo lô'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Xác nhận hoàn thành lô */}
      <Dialog open={!!completingBatch} onOpenChange={(open) => !open && setCompletingBatch(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận hoàn thành lô</DialogTitle>
            <DialogDescription>
              Sau khi xác nhận, lô #{completingBatch?.batchId ?? completingBatch?.id} sẽ được đánh dấu
              <strong> DONE</strong> và hàng sẽ tự động được nhập vào kho.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingBatch(null)}>
              Hủy
            </Button>
            <Button onClick={handleCompleteBatch} disabled={isCompleting}>
              {isCompleting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                : <><CheckSquare className="mr-2 h-4 w-4" />Xác nhận</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}