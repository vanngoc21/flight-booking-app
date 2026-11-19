
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Card,
  Col,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import {
  DollarOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { getDashboard } from './dashboardService';
import type {
  RecentBooking,
  RevenueItem,
} from './dashboard.types';

const { Title, Text } = Typography;
const chartColors = ['#2878b9', '#d6ad60', '#43a5a0', '#7d8fbc', '#ef8b67'];

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN');

const formatRevenueChart = (items: RevenueItem[]) => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const key = date.toISOString().slice(0, 10);

    const item = items.find((entry) => entry._id === key);

    return {
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      revenue: item?.revenue || 0,
    };
  });
};

const bookingColumns: ColumnsType<RecentBooking> = [
  {
    title: 'Mã đặt vé',
    dataIndex: 'bookingCode',
    key: 'bookingCode',
    render: (value: string) => (
      <Text strong>{value}</Text>
    ),
  },
  {
    title: 'Khách hàng',
    key: 'customer',
    render: (_, record) => {
  if (record.user?.fullName) {
    return record.user.fullName;
  }

  const passenger = record.passengers?.[0];

  if (passenger) {
    return `${passenger.lastName} ${passenger.firstName}`;
  }

  return 'Chưa có thông tin';
    },
  },
  {
    title: 'Chuyến bay',
    key: 'flight',
    render: (_, record) =>
      record.flight?.flightNumber || '—',
  },
  {
    title: 'Hành trình',
    key: 'route',
    render: (_, record) =>
      `${record.flight?.origin?.code || '—'} → ${record.flight?.destination?.code || '—'}`,
  },
  {
    title: 'Tổng tiền',
    key: 'total',
    render: (_, record) =>
      formatVND(record.pricing?.total || 0),
  },
  {
    title: 'Thanh toán',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    render: (status: string) => {
      const color =
        status === 'paid'
          ? 'success'
          : status === 'refunded'
            ? 'purple'
            : status === 'failed'
              ? 'error'
              : 'warning';

      return (
        <Tag color={color}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      );
    },
  },
  {
    title: 'Ngày đặt',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => formatDate(value),
  },
];

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const dashboard = data?.data;
  const overview = dashboard?.overview;

  const revenueData = formatRevenueChart(
    dashboard?.revenueChart || []
  );

  const airlineData = (dashboard?.airlineLoad || []).map(
    (item) => ({
      name: item.airline || 'Chưa xác định',
      value: Number(item.loadFactor.toFixed(1)),
    })
  );

  const bookings = dashboard?.recentBookings || [];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton active />
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((item) => (
            <Col xs={24} sm={12} xl={6} key={item}>
              <Card><Skeleton active paragraph={false} /></Card>
            </Col>
          ))}
        </Row>
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải dữ liệu Dashboard"
        description={
          (error as Error)?.message ||
          'Vui lòng kiểm tra Backend và API Admin Dashboard.'
        }
        action={
          <a onClick={() => refetch()}>
            Thử lại
          </a>
        }
      />
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <Text className="dashboard-eyebrow">SKYHAVEN · TRUNG TÂM ĐIỀU HÀNH</Text>
          <Title level={2} className="!mb-2 !mt-3 dashboard-hero-title">
            Tổng quan hệ thống
          </Title>
          <Text className="dashboard-hero-description">
            Nắm bắt doanh thu, chuyến bay và hoạt động đặt vé trong một màn hình.
          </Text>
        </div>
        <div className="dashboard-live-status">
          <span className="dashboard-live-dot" />
          <span>Cập nhật tự động mỗi phút</span>
        </div>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-stat-card dashboard-stat-revenue">
            <div className="dashboard-stat-icon"><DollarOutlined /></div>
            <Statistic
              title="Tổng doanh thu"
              value={overview?.totalRevenue || 0}
              formatter={(value) => formatVND(Number(value))}
              valueStyle={{ color: '#2878b9', fontSize: 22 }}
            />
            <Text type="secondary" className="dashboard-stat-note">
              Booking đã thanh toán
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-stat-card dashboard-stat-flights">
            <div className="dashboard-stat-icon"><CalendarOutlined /></div>
            <Statistic
              title="Chuyến bay hôm nay"
              value={overview?.todayFlights || 0}
              valueStyle={{ fontSize: 22 }}
            />
            <Text type="secondary" className="dashboard-stat-note">
              Theo ngày khởi hành
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-stat-card dashboard-stat-tickets">
            <div className="dashboard-stat-icon"><ShoppingOutlined /></div>
            <Statistic
              title="Vé đã bán"
              value={overview?.ticketsSold || 0}
              valueStyle={{ fontSize: 22 }}
            />
            <Text type="secondary" className="dashboard-stat-note">
              Hành khách thuộc booking đã thanh toán
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-stat-card dashboard-stat-customers">
            <div className="dashboard-stat-icon"><UserOutlined /></div>
            <Statistic
              title="Khách hàng"
              value={overview?.totalCustomers || 0}
              valueStyle={{ fontSize: 22 }}
            />
            <Text type="secondary" className="dashboard-stat-note">
              Tài khoản khách hàng
            </Text>
          </Card>
        </Col>
      </Row>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <Text className="dashboard-section-eyebrow">PHÂN TÍCH</Text>
            <Title level={4} className="!mb-0 !mt-1">Hiệu quả hoạt động</Title>
          </div>
          <Text type="secondary">7 ngày gần nhất</Text>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={15}>
            <Card className="dashboard-chart-card" title="Doanh thu theo ngày">
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{
                      top: 10,
                      right: 12,
                      left: 4,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid stroke="#e8eef3" strokeDasharray="4 6" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71879a', fontSize: 12 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71879a', fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${(value / 1_000_000).toFixed(0)}tr`
                      }
                    />
                    <Tooltip
                      cursor={{ stroke: '#cbd8e3', strokeDasharray: '4 4' }}
                      formatter={(value) => [
                        formatVND(Number(value)),
                        'Doanh thu',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#2878b9"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2878b9', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#2878b9', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Card className="dashboard-chart-card" title="Tỷ lệ lấp đầy theo hãng">
              <div className="dashboard-chart">
                {airlineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={airlineData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="43%"
                        outerRadius={95}
                        label={({ value }) => `${value}%`}
                        labelLine={false}
                      >
                        {airlineData.map((item, index) => (
                          <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          `${value}%`,
                          'Tỷ lệ lấp đầy',
                        ]}
                      />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dashboard-empty-chart">
                    Chưa có dữ liệu ghế máy bay
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      <Card
        className="dashboard-bookings-card"
        title={
          <div className="dashboard-bookings-heading">
            <div>
              <Text className="dashboard-section-eyebrow">HOẠT ĐỘNG MỚI</Text>
              <Title level={4} className="!mb-0 !mt-1">Đặt vé gần đây</Title>
            </div>
            <Tag color="blue">{bookings.length} giao dịch</Tag>
          </div>
        }
      >
        <Table<RecentBooking>
          rowKey="_id"
          columns={bookingColumns}
          dataSource={bookings}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{
            emptyText: 'Chưa có dữ liệu đặt vé',
          }}
        />
      </Card>
    </div>
  );
}
