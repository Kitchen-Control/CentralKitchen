import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../../components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Factory,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dữ liệu giả lập hoặc chờ API Production Plans
  const activePlans = 0;
  const processingBatches = 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bảng điều khiển</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động bếp trung tâm</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Kế hoạch sản xuất"
          value={activePlans}
          icon={Factory}
          description="Đang thực hiện"
        />
        <StatsCard
          title="Lô đang sản xuất"
          value={processingBatches}
          icon={Clock}
          description="Chờ hoàn thành"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tiến độ sản xuất</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/kitchen/production')}>
              Chi tiết
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Không có kế hoạch sản xuất đang thực hiện (API chưa có kế hoạch)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
