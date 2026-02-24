import React, { useState, useEffect } from 'react';
import { getLogBatches, getInventories, getProducts } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function Reports() {
  const [batches, setBatches]       = useState([]);
  const [inventories, setInventories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      getLogBatches().catch(() => []),
      getInventories().catch(() => []),
      getProducts().catch(() => []),
    ]).then(([b, inv, p]) => {
      setBatches(Array.isArray(b) ? b : []);
      setInventories(Array.isArray(inv) ? inv : []);
      setProducts(Array.isArray(p) ? p : []);
    }).catch(() => toast.error('Lỗi tải dữ liệu báo cáo'))
    .finally(() => setLoading(false));
  }, []);

  // Tìm tên sản phẩm
  const productName = (productId) =>
    products.find((p) => p.product_id === productId)?.product_name ?? `SP #${productId}`;

  // Lọc lô hết hạn / hỏng — đây là WASTE
  const wasteBatches = batches.filter((b) => b.status === 'EXPIRED' || b.status === 'DAMAGED');

  // Lọc theo tháng
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
    };
  });

  const filteredWaste = monthFilter === 'all'
    ? wasteBatches
    : wasteBatches.filter((b) => {
        const d = new Date(b.expiryDate ?? b.expiry_date ?? 0);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
      });

  // Tổng tồn kho hết hạn (trong inventories)
  const expiredInventory = inventories.filter((inv) => {
    const expiry = new Date(inv.expiry_date ?? 0);
    return expiry < now && (inv.quantity ?? 0) > 0;
  });

  // Biểu đồ: số lô hỏng theo sản phẩm
  const wasteByProduct = Object.values(
    filteredWaste.reduce((acc, b) => {
      const pid = b.productId ?? b.product_id;
      const name = productName(pid);
      if (!acc[pid]) acc[pid] = { name, count: 0, quantity: 0 };
      acc[pid].count++;
      acc[pid].quantity += b.quantity ?? 0;
      return acc;
    }, {})
  );

  // Stats
  const totalWasteBatches   = filteredWaste.length;
  const totalWasteQuantity  = filteredWaste.reduce((s, b) => s + (b.quantity ?? 0), 0);
  const expiredInvCount     = expiredInventory.length;
  const uniqueAffectedProds = new Set(filteredWaste.map((b) => b.productId ?? b.product_id)).size;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-destructive" />
            Báo cáo tổng hợp
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Thống kê hàng hư hỏng, hết hạn và lỗ vốn (Flow 4)
          </p>
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Lọc theo tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Lô hư/hết hạn',       value: totalWasteBatches,  color: 'text-red-600',    icon: AlertTriangle },
          { label: 'Tổng SL hủy',          value: totalWasteQuantity, color: 'text-orange-600',  icon: Package      },
          { label: 'Sản phẩm bị ảnh hưởng', value: uniqueAffectedProds, color: 'text-yellow-600', icon: Package     },
          { label: 'Kho hết hạn hiện tại',  value: expiredInvCount,   color: 'text-destructive',  icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
          <TabsTrigger value="table">Chi tiết lô hủy</TabsTrigger>
          <TabsTrigger value="inventory">Kho hết hạn</TabsTrigger>
        </TabsList>

        {/* Biểu đồ */}
        <TabsContent value="chart" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Số lô hủy theo sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                {wasteByProduct.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Không có dữ liệu
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wasteByProduct} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v} lô`, 'Số lô hủy']} />
                      <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tỉ lệ theo loại trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                {filteredWaste.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Không có dữ liệu</p>
                ) : (() => {
                  const expired = filteredWaste.filter(b => b.status === 'EXPIRED').length;
                  const damaged = filteredWaste.filter(b => b.status === 'DAMAGED').length;
                  const pieData = [
                    { name: 'Hết hạn', value: expired },
                    { name: 'Hư hỏng', value: damaged },
                  ].filter(d => d.value > 0);
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bảng chi tiết */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách lô hủy</CardTitle>
              <CardDescription>Các lô có trạng thái EXPIRED hoặc DAMAGED</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredWaste.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Không có lô hư hỏng nào trong khoảng thời gian này 🎉
                </p>
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
                    {filteredWaste.map((b) => {
                      const bId = b.batchId ?? b.batch_id ?? b.id;
                      return (
                        <TableRow key={bId}>
                          <TableCell className="font-mono text-sm">#{bId}</TableCell>
                          <TableCell>{productName(b.productId ?? b.product_id)}</TableCell>
                          <TableCell>{b.quantity ?? '—'}</TableCell>
                          <TableCell>
                            {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={b.status === 'EXPIRED' ? 'destructive' : 'outline'}>
                              {b.status === 'EXPIRED' ? 'Hết hạn' : 'Hư hỏng'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tồn kho hết hạn */}
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Tồn kho đang hết hạn
              </CardTitle>
              <CardDescription>Cần xử lý tiêu hủy để tránh lỗ vốn</CardDescription>
            </CardHeader>
            <CardContent>
              {expiredInventory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Tất cả tồn kho đều còn hạn sử dụng ✅
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Hết hạn từ</TableHead>
                      <TableHead>Mã kho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredInventory.map((inv) => (
                      <TableRow key={inv.inventory_id} className="bg-red-50/50">
                        <TableCell>{productName(inv.product_id)}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-destructive">{inv.quantity}</span>
                        </TableCell>
                        <TableCell className="text-destructive text-sm">
                          {inv.expiry_date ? new Date(inv.expiry_date).toLocaleDateString('vi-VN') : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{inv.inventory_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
