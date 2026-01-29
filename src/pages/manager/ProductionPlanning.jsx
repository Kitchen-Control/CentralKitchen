import React, { useState } from 'react';
import { 
  productionPlans, 
  productionPlanDetails, 
  getFinishedProducts,
  notifyListeners,
  useMockDataWatcher
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Plus, Calendar, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

export default function ProductionPlanning() {
  useMockDataWatcher();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    note: '',
    details: []
  });
  
  const finishedProducts = getFinishedProducts();

  const handleAddDetail = () => {
    setNewPlan(prev => ({
      ...prev,
      details: [...prev.details, { product_id: '', quantity: 10 }]
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...newPlan.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setNewPlan(prev => ({ ...prev, details: updatedDetails }));
  };

  const handleRemoveDetail = (index) => {
    const updatedDetails = newPlan.details.filter((_, i) => i !== index);
    setNewPlan(prev => ({ ...prev, details: updatedDetails }));
  };

  const handleCreatePlan = () => {
    // Validation BR-015: Kế hoạch phải có ít nhất 1 chi tiết
    if (newPlan.details.length === 0) {
      toast.error('Kế hoạch phải có ít nhất 1 sản phẩm (BR-015)');
      return;
    }
    
    if (newPlan.details.some(d => !d.product_id || d.quantity <= 0)) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm và số lượng > 0');
      return;
    }

    const planId = productionPlans.length > 0 ? Math.max(...productionPlans.map(p => p.plan_id)) + 1 : 1;
    
    // Flow 2 - B1: Manager tạo Production Plan
    productionPlans.push({
      plan_id: planId,
      kitchen_id: 1, // Mặc định bếp trung tâm 1
      created_by: 2, // Manager ID
      plan_date: new Date().toISOString().split('T')[0],
      start_date: newPlan.start_date,
      end_date: newPlan.end_date,
      status: 'PROCESSING',
      note: newPlan.note || `Kế hoạch #${planId}`
    });

    // Tạo Details
    newPlan.details.forEach((detail, index) => {
      productionPlanDetails.push({
        plan_detail_id: productionPlanDetails.length + 1 + index,
        plan_id: planId,
        product_id: parseInt(detail.product_id),
        quantity: parseInt(detail.quantity),
        note: ''
      });
    });

    notifyListeners();
    toast.success('Đã tạo kế hoạch sản xuất thành công');
    setIsDialogOpen(false);
    setNewPlan({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      note: '',
      details: []
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kế hoạch sản xuất</h1>
          <p className="text-muted-foreground">Lập kế hoạch cho bếp trung tâm (Flow 2)</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo kế hoạch mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo Kế hoạch Sản xuất</DialogTitle>
              <DialogDescription>
                Chỉ định sản phẩm và số lượng cần sản xuất
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày bắt đầu</Label>
                  <Input type="date" value={newPlan.start_date} onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Ngày kết thúc</Label>
                  <Input type="date" value={newPlan.end_date} onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input placeholder="Ví dụ: Kế hoạch tuần 4..." value={newPlan.note} onChange={(e) => setNewPlan({...newPlan, note: e.target.value})} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Chi tiết sản phẩm</Label>
                  <Button variant="outline" size="sm" onClick={handleAddDetail}><Plus className="h-3 w-3 mr-1" /> Thêm món</Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {newPlan.details.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Chưa có sản phẩm nào</p> : 
                    newPlan.details.map((detail, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Sản phẩm</Label>
                          <Select value={detail.product_id.toString()} onValueChange={(val) => handleDetailChange(index, 'product_id', val)}>
                            <SelectTrigger><SelectValue placeholder="Chọn món" /></SelectTrigger>
                            <SelectContent>{finishedProducts.map(p => <SelectItem key={p.product_id} value={p.product_id.toString()}>{p.product_name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Số lượng</Label>
                          <Input type="number" min="1" value={detail.quantity} onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)} />
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveDetail(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleCreatePlan}><Save className="mr-2 h-4 w-4" /> Lưu kế hoạch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productionPlans.map(plan => (
          <Card key={plan.plan_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Kế hoạch #{plan.plan_id}</CardTitle>
                <Badge variant={plan.status === 'DONE' ? 'success' : 'secondary'}>{plan.status === 'DONE' ? 'Hoàn thành' : 'Đang thực hiện'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {plan.start_date} - {plan.end_date}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3 italic">{plan.note}</p>
              <div className="space-y-1">
                {productionPlanDetails.filter(d => d.plan_id === plan.plan_id).map(d => {
                    const product = finishedProducts.find(p => p.product_id === d.product_id);
                    return <div key={d.plan_detail_id} className="flex justify-between text-sm"><span>{product?.product_name}</span><span className="font-medium">SL: {d.quantity}</span></div>;
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}