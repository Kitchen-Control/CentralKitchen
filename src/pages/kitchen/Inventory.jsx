import React, { useState, useEffect } from 'react';
import { getInventories } from '../../data/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Package, Search, AlertTriangle, Calendar, Archive } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getInventories();
      setInventories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logic tính trạng thái lô hàng dựa trên Hạn sử dụng (Expiry Date)
  const getBatchStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
    
    const today = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Đã hết hạn', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (diffDays <= 3) {
      return { label: 'Sắp hết hạn', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'Còn hạn', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredInventories = inventories.filter(item => 
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Thống kê nhanh
  const totalItems = filteredInventories.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const expiredCount = inventories.filter(i => getBatchStatus(i.expiry_date).label === 'Đã hết hạn').length;

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kho Trung Tâm</h1>
          <p className="text-muted-foreground">Quản lý tồn kho, lô hàng và hạn sử dụng (FEFO)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên SP hoặc mã lô..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cards Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tồn kho</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Đơn vị sản phẩm</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lô hàng hết hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">Cần xử lý tiêu hủy ngay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lô</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventories.length}</div>
            <p className="text-xs text-muted-foreground">Lô hàng đang quản lý</p>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách tồn kho */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInventories.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Không tìm thấy dữ liệu tồn kho</p>
          </div>
        ) : (
          filteredInventories.map((item) => {
            const status = getBatchStatus(item.expiry_date);
            return (
              <Card key={item.inventory_id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {item.product_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.product_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="font-mono bg-muted px-1 rounded">Batch: {item.batch}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> HSD: {formatDate(item.expiry_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", status.color)}>{status.label}</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{Number(item.quantity).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Tồn kho</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}