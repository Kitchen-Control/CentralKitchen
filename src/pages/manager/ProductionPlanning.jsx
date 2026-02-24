import React, { useState, useEffect, useCallback } from 'react';
import {
  getProductionPlans,
  createProductionPlan,
  getProductsByType,
  getLogBatches,
} from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { Progress } from '../../components/ui/progress';
import { Calendar, Plus, ChefHat, Loader2, Eye, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { BATCH_STATUS } from '../../data/constants';

// Badge màu theo trạng thái lô
const BatchStatusBadge = ({ status }) => {
  const cfg = BATCH_STATUS[status] || { label: status, color: 'secondary' };
  const colorMap = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorMap[cfg.color] || 'bg-gray-100 text-gray-800'}`}>
      {cfg.label}
    </span>
  );
};

// Tính % hoàn thành của plan dựa trên các batch
const calcProgress = (batches) => {
  if (!batches || batches.length === 0) return 0;
  const done = batches.filter((b) => b.status === 'DONE').length;
  return Math.round((done / batches.length) * 100);
};

export default function ProductionPlanning() {
  const [plans, setPlans] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    productId: '',
    plannedQuantity: '',
    planDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, batchesData, productsData] = await Promise.allSettled([
        getProductionPlans(),
        getLogBatches(),
        getProductsByType('FINISHED_PRODUCT'),
      ]);

      setPlans(
        plansData.status === 'fulfilled' && Array.isArray(plansData.value)
          ? plansData.value
          : []
      );
      setAllBatches(
        batchesData.status === 'fulfilled' && Array.isArray(batchesData.value)
          ? batchesData.value
          : []
      );
      setFinishedProducts(
        productsData.status === 'fulfilled' && Array.isArray(productsData.value)
          ? productsData.value
          : []
      );
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePlan = async () => {
    if (!form.productId || !form.plannedQuantity || !form.planDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (Number(form.plannedQuantity) <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    setIsSubmitting(true);
    try {
      await createProductionPlan({
        productId: Number(form.productId),
        plannedQuantity: Number(form.plannedQuantity),
        planDate: form.planDate,
        note: form.note || null,
      });
      toast.success('Đã tạo kế hoạch sản xuất!');
      setShowCreate(false);
      setForm({ productId: '', plannedQuantity: '', planDate: new Date().toISOString().split('T')[0], note: '' });
      await loadData();
    } catch (err) {
      toast.error('Tạo kế hoạch thất bại: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lấy các batch thuộc 1 plan cụ thể
  const getBatchesForPlan = (planId) =>
    allBatches.filter((b) => b.planId === planId || b.plan_id === planId);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
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
            <ClipboardList className="h-6 w-6" />
            Kế hoạch sản xuất
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lập kế hoạch và theo dõi tiến độ sản xuất tại bếp trung tâm
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo kế hoạch mới
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng kế hoạch', value: plans.length, color: 'text-foreground' },
          {
            label: 'Đang thực hiện',
            value: plans.filter((p) => {
              const b = getBatchesForPlan(p.planId ?? p.plan_id ?? p.id);
              return b.some((x) => x.status === 'PROCESSING');
            }).length,
            color: 'text-blue-600',
          },
          {
            label: 'Hoàn thành',
            value: plans.filter((p) => {
              const b = getBatchesForPlan(p.planId ?? p.plan_id ?? p.id);
              return b.length > 0 && b.every((x) => x.status === 'DONE');
            }).length,
            color: 'text-green-600',
          },
          {
            label: 'Tổng lô sản xuất',
            value: allBatches.filter((b) => b.type === 'PRODUCTION' || !b.type).length,
            color: 'text-orange-600',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium text-muted-foreground">Chưa có kế hoạch sản xuất nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nhấn "Tạo kế hoạch mới" để bắt đầu lên kế hoạch cho bếp
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {plans.map((plan) => {
            const id = plan.planId ?? plan.plan_id ?? plan.id;
            const batches = getBatchesForPlan(id);
            const progress = calcProgress(batches);
            const productName =
              plan.productName ??
              plan.product?.productName ??
              finishedProducts.find((p) => p.product_id === (plan.productId ?? plan.product_id))?.product_name ??
              `Sản phẩm #${plan.productId ?? plan.product_id}`;

            return (
              <AccordionItem key={id} value={String(id)} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-1 items-center justify-between gap-4 pr-4">
                    <div className="text-left">
                      <p className="font-semibold">{productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ngày: {plan.planDate ? new Date(plan.planDate).toLocaleDateString('vi-VN') : '—'} &nbsp;·&nbsp;
                        Mục tiêu: {plan.plannedQuantity ?? plan.planned_quantity ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline">{batches.length} lô</Badge>
                      <div className="w-24 hidden sm:block">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right mt-0.5">{progress}%</p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  {plan.note && (
                    <p className="text-sm text-muted-foreground mb-3 italic">📝 {plan.note}</p>
                  )}
                  {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Bếp chưa phân lô cho kế hoạch này
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã lô</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>HSD</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((b) => (
                          <TableRow key={b.batchId ?? b.batch_id ?? b.id}>
                            <TableCell className="font-mono text-sm">
                              #{b.batchId ?? b.batch_id ?? b.id}
                            </TableCell>
                            <TableCell>{b.quantity ?? '—'}</TableCell>
                            <TableCell>
                              {b.expiryDate
                                ? new Date(b.expiryDate).toLocaleDateString('vi-VN')
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <BatchStatusBadge status={b.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tạo kế hoạch sản xuất
            </DialogTitle>
            <DialogDescription>
              Kế hoạch sẽ được gửi đến bếp để phân lô và thực hiện sản xuất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-product">
                Sản phẩm <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm({ ...form, productId: v })}
              >
                <SelectTrigger id="plan-product">
                  <SelectValue placeholder="Chọn thành phẩm cần sản xuất" />
                </SelectTrigger>
                <SelectContent>
                  {finishedProducts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Không có thành phẩm
                    </SelectItem>
                  ) : (
                    finishedProducts.map((p) => (
                      <SelectItem key={p.product_id} value={String(p.product_id)}>
                        {p.product_name} ({p.unit})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-qty">
                Số lượng mục tiêu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-qty"
                type="number"
                min="1"
                placeholder="VD: 100"
                value={form.plannedQuantity}
                onChange={(e) => setForm({ ...form, plannedQuantity: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-date">
                Ngày sản xuất <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-date"
                type="date"
                value={form.planDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, planDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-note">Ghi chú</Label>
              <Input
                id="plan-note"
                placeholder="Ghi chú thêm (không bắt buộc)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreatePlan} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Tạo kế hoạch</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
