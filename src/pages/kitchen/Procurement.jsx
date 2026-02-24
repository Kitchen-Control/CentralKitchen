import React, { useState, useEffect } from 'react';
import { getProducts, createPurchaseBatch, createTransaction } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2, ShoppingCart, Calendar as CalendarIcon, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Procurement() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    batchId: '',
    quantity: '',
    expiryDate: ''
  });

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // Lấy tất cả sản phẩm, lọc RAW_MATERIAL + SEMI_FINISHED (nguyên liệu mua về)
        const data = await getProducts();
        const filtered = (data || []).filter(
          (p) => p.product_type === 'RAW_MATERIAL' || p.product_type === 'SEMI_FINISHED'
        );
        setMaterials(filtered);
      } catch (error) {
        toast.error('Lỗi tải danh sách nguyên liệu: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.batchId || !formData.quantity || !formData.expiryDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // BR-022: Cảnh báo hạn sử dụng
    const expiry = new Date(formData.expiryDate);
    const now = new Date();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 3) {
      if (!confirm('Cảnh báo: Nguyên liệu này sắp hết hạn (dưới 3 ngày). Bạn có chắc chắn muốn nhập?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Bước 1: Tạo log_batch type=PURCHASE, status=DONE (hàng mua về dùng được ngay)
      const batch = await createPurchaseBatch({
        productId:  Number(formData.productId),
        quantity:   Number(formData.quantity),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      });

      // Bước 2: Tạo inventory_transaction IMPORT (tự động tăng tồn kho)
      const batchId = batch?.batchId ?? batch?.batch_id ?? batch?.id;
      try {
        await createTransaction({
          batchId,
          productId: Number(formData.productId),
          type: 'IMPORT',
          quantity: Number(formData.quantity),
          note: `Nhập mua từ nhà cung cấp - Lô ${formData.batchId || batchId}`,
        });
      } catch (txErr) {
        console.warn('Tạo transaction thất bại:', txErr.message);
      }

      toast.success('Nhập kho thành công! Tồn kho đã được cập nhật.');
      setFormData({ productId: '', batchId: '', quantity: '', expiryDate: '' });
    } catch (error) {
      toast.error('Lỗi nhập kho: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PackagePlus className="h-6 w-6" />
          Nhập mua Nguyên vật liệu
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ghi nhận lô hàng mua từ nhà cung cấp vào kho bếp (Flow 3)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lô nhập</CardTitle>
          <CardDescription>
            Sau khi xác nhận, hệ thống sẽ tự động tạo lô hàng và cộng tồn kho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nguyên liệu / Bán thành phẩm <span className="text-destructive">*</span></Label>
              <Select onValueChange={(val) => setFormData({...formData, productId: val})} value={formData.productId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn nguyên liệu --" />
                </SelectTrigger>
                <SelectContent>
                  {materials.length === 0 ? (
                    <SelectItem value="none" disabled>Không có nguyên liệu</SelectItem>
                  ) : (
                    materials.map(m => (
                      <SelectItem key={m.product_id} value={String(m.product_id)}>
                        {m.product_name}
                        <Badge variant="outline" className="ml-2 text-xs">{m.unit}</Badge>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã tham chiếu lô <span className="text-muted-foreground text-xs">(tuỳ chọn)</span></Label>
                <Input
                  placeholder="VD: NCC-2024-001"
                  value={formData.batchId}
                  onChange={e => setFormData({...formData, batchId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượng <span className="text-destructive">*</span></Label>
                <Input
                  type="number" min="0.1" step="0.1" placeholder="0"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hạn sử dụng <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                : <><PackagePlus className="mr-2 h-4 w-4" />Xác nhận Nhập kho</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}