import React from 'react';
import { 
  productionPlans, 
  orders, 
  inventories, 
  logBatches,
  getFinishedProducts,
  inventoryTransactions,
  notifyListeners,
  useMockDataWatcher 
} from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  ClipboardList, 
  AlertTriangle, 
  ShoppingCart, 
  PackageCheck,
  ArrowDownToLine,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function ManagerDashboard() {
  useMockDataWatcher();

  // Thống kê cơ bản
  const activePlans = productionPlans.filter(p => p.status === 'PROCESSING').length;
  const pendingOrders = orders.filter(o => o.status === 'WAITTING').length;
  
  // Flow 4 - B1: Cảnh báo tồn kho & Hết hạn
  const lowStockItems = inventories.filter(i => i.quantity < 50);
  
  // Tìm các lô đã hết hạn nhưng chưa hủy (vẫn còn tồn kho > 0)
  const expiredInventory = inventories.filter(i => {
    const today = new Date();
    const expiry = new Date(i.expiry_date);
    return expiry < today && i.quantity > 0;
  });

  // Flow 2 - B3: Tìm các lô hàng Bếp đã làm xong (DONE) nhưng chưa nhập kho (chưa có transaction IMPORT tương ứng)
  const pendingImportBatches = logBatches.filter(b => {
    if (b.status !== 'DONE' || b.type !== 'PRODUCTION') return false;
    const hasImported = inventoryTransactions.some(t => t.batch_id === b.batch_id && t.type === 'IMPORT');
    return !hasImported;
  });

  const finishedProducts = getFinishedProducts();

  // Flow 2 - B3: Manager duyệt nhập kho
  const handleImportBatch = (batch) => {
    const newTransaction = {
      transaction_id: inventoryTransactions.length + 1,
      product_id: batch.product_id,
      created_by: 2, // Manager ID
      batch_id: batch.batch_id,
      type: 'IMPORT',
      quantity: batch.quantity,
      created_at: new Date().toISOString(),
      note: 'Nhập kho thành phẩm từ sản xuất'
    };

    inventoryTransactions.push(newTransaction);

    // Cập nhật tồn kho
    const existingInventory = inventories.find(i => i.batch_id === batch.batch_id);
    if (existingInventory) {
      existingInventory.quantity += batch.quantity;
    } else {
      inventories.push({
        inventory_id: inventories.length + 1,
        product_id: batch.product_id,
        batch_id: batch.batch_id,
        quantity: batch.quantity,
        expiry_date: batch.expiry_date
      });
    }

    notifyListeners();
    toast.success(`Đã nhập kho lô #${batch.batch_id} thành công!`);
  };

  // Flow 4 - B2: Xử lý hủy hàng
  const handleDisposeInventory = (inv) => {
    const newTransaction = {
      transaction_id: inventoryTransactions.length + 1,
      product_id: inv.product_id,
      created_by: 2, // Manager ID
      batch_id: inv.batch_id,
      type: 'EXPORT',
      quantity: inv.quantity,
      created_at: new Date().toISOString(),
      note: 'Hủy hàng hết hạn (Flow 4)'
    };

    inventoryTransactions.push(newTransaction);
    
    // Trừ tồn kho về 0
    inv.quantity = 0;

    notifyListeners();
    toast.error(`Đã tiêu hủy lô hàng hết hạn #${inv.batch_id}`);
  };

  // Data cho biểu đồ tồn kho thành phẩm
  const stockData = finishedProducts.map(p => {
    const totalStock = inventories
      .filter(i => i.product_id === p.product_id)
      .reduce((sum, i) => sum + i.quantity, 0);
    return {
      name: p.product_name,
      stock: totalStock
    };
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan Quản lý</h1>
        <p className="text-muted-foreground">Theo dõi sản xuất, tồn kho và duyệt nhập kho (Flow 2 & 4)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kế hoạch đang chạy</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
            <p className="text-xs text-muted-foreground">Flow 2: Sản xuất</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hàng chờ</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Nhu cầu từ cửa hàng</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần nhập kho</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingImportBatches.length}</div>
            <p className="text-xs text-muted-foreground">Lô hàng đã SX xong</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cảnh báo rủi ro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredInventory.length + lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Hết hạn / Tồn thấp</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Flow 2 - B3: Duyệt nhập kho */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Duyệt nhập kho thành phẩm</CardTitle>
            <CardDescription>Các lô hàng Bếp đã hoàn thành (Flow 2-B3)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingImportBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Không có lô hàng nào cần nhập kho.</p>
              ) : (
                pendingImportBatches.map(batch => {
                  const product = finishedProducts.find(p => p.product_id === batch.product_id);
                  return (
                    <div key={batch.batch_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{product?.product_name || `SP #${batch.product_id}`}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline">Lô #{batch.batch_id}</Badge>
                          <span>SL: {batch.quantity}</span>
                          <span>HSD: {batch.expiry_date}</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleImportBatch(batch)}>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Nhập kho
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Biểu đồ tồn kho */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tồn kho thành phẩm hiện tại</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Flow 4: Cảnh báo hàng hết hạn */}
      {expiredInventory.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo hàng hết hạn (Cần tiêu hủy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredInventory.map(inv => {
                const product = finishedProducts.find(p => p.product_id === inv.product_id) || {};
                return (
                  <div key={inv.inventory_id} className="flex items-center justify-between bg-white p-3 rounded border border-red-100">
                    <div>
                      <p className="font-medium text-red-900">{product.product_name || `SP #${inv.product_id}`}</p>
                      <p className="text-sm text-red-700">Lô: {inv.batch_id} - SL: {inv.quantity} - Hết hạn: {inv.expiry_date}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDisposeInventory(inv)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Tiêu hủy
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}