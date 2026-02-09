import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WarehouseDashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Quản lý Tồn kho',
      description: 'Xem danh sách tồn kho, hạn sử dụng và vị trí lô hàng.',
      icon: <Package className="h-8 w-8 text-blue-500" />,
      path: '/warehouse/inventory',
      color: 'bg-blue-50'
    },
    {
      title: 'Nhập kho (Procurement)',
      description: 'Nhập nguyên liệu mua từ nhà cung cấp vào kho.',
      icon: <ArrowDownToLine className="h-8 w-8 text-green-500" />,
      path: '/warehouse/procurement',
      color: 'bg-green-50'
    },
    {
      title: 'Xuất kho (Outbound)',
      description: 'Soạn hàng và xuất kho cho các chuyến xe giao hàng.',
      icon: <ArrowUpFromLine className="h-8 w-8 text-purple-500" />,
      path: '/warehouse/outbound',
      color: 'bg-purple-50'
    },
    {
      title: 'Hủy hàng (Waste)',
      description: 'Xử lý và tiêu hủy các lô hàng hết hạn hoặc hư hỏng.',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      path: '/warehouse/waste',
      color: 'bg-red-50'
    }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Kho Bếp Trung Tâm</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {menuItems.map((item, index) => (
          <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all ${item.color}`} onClick={() => navigate(item.path)}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-full shadow-sm">{item.icon}</div>
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}