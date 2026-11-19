import { useState } from 'react';
import { AxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import { promotionsService } from './promotionsService';
import { referenceDataService } from '../reference-data/referenceDataService';
import type { Airline } from '../reference-data/referenceData.types';
import type {
  Promotion,
  PromotionApplicability,
  PromotionDiscountType,
  PromotionPayload,
} from './promotions.types';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;
const promotionQueryKey = ['admin', 'promotions'];

interface PromotionFormValues {
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  campaignType: 'coupon' | 'event';
  eventTitle: string;
  eventTitleEn: string;
  bannerImageUrl: string;
  airlineCode: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minimumBaseFare: number;
  applicability: PromotionApplicability;
  startsAt: Dayjs;
  endsAt: Dayjs;
  active: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.message;
    return typeof responseMessage === 'string' ? responseMessage : error.message;
  }

  return error instanceof Error ? error.message : 'Lỗi không xác định.';
}

function toPayload(values: PromotionFormValues): PromotionPayload {
  return {
    ...values,
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    titleEn: values.titleEn?.trim() || '',
    description: values.description?.trim() || '',
    descriptionEn: values.descriptionEn?.trim() || '',
    campaignType: values.campaignType,
    eventTitle: values.eventTitle?.trim() || '',
    eventTitleEn: values.eventTitleEn?.trim() || '',
    bannerImageUrl: values.bannerImageUrl?.trim() || '',
    airlineCode: values.campaignType === 'event'
      ? values.airlineCode?.trim().toUpperCase() || ''
      : '',
    maxDiscount: values.maxDiscount ?? null,
    startsAt: values.startsAt.toISOString(),
    endsAt: values.endsAt.toISOString(),
  };
}

function toFormValues(promotion: Promotion): PromotionFormValues {
  return {
    code: promotion.code,
    title: promotion.title,
    titleEn: promotion.titleEn || '',
    description: promotion.description || '',
    descriptionEn: promotion.descriptionEn || '',
    campaignType: promotion.campaignType ?? 'coupon',
    eventTitle: promotion.eventTitle || '',
    eventTitleEn: promotion.eventTitleEn || '',
    bannerImageUrl: promotion.bannerImageUrl || '',
    airlineCode: promotion.airlineCode || '',
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    maxDiscount: promotion.maxDiscount,
    minimumBaseFare: promotion.minimumBaseFare,
    applicability: promotion.applicability,
    startsAt: dayjs(promotion.startsAt),
    endsAt: dayjs(promotion.endsAt),
    active: promotion.active,
  };
}

function toUpdatePayload(promotion: Promotion, active: boolean): PromotionPayload {
  return {
    code: promotion.code,
    title: promotion.title,
    titleEn: promotion.titleEn || '',
    description: promotion.description || '',
    descriptionEn: promotion.descriptionEn || '',
    campaignType: promotion.campaignType ?? 'coupon',
    eventTitle: promotion.eventTitle || '',
    eventTitleEn: promotion.eventTitleEn || '',
    bannerImageUrl: promotion.bannerImageUrl || '',
    airlineCode: promotion.airlineCode || '',
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    maxDiscount: promotion.maxDiscount ?? null,
    minimumBaseFare: promotion.minimumBaseFare,
    applicability: promotion.applicability,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    active,
  };
}

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function getPromotionStatus(promotion: Promotion) {
  const now = dayjs();
  if (!promotion.active) return <Tag>Đã tắt</Tag>;
  if (now.isBefore(dayjs(promotion.startsAt))) return <Tag color="blue">Sắp diễn ra</Tag>;
  if (now.isAfter(dayjs(promotion.endsAt))) return <Tag color="default">Hết hạn</Tag>;
  return <Tag color="green">Đang hoạt động</Tag>;
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [form] = Form.useForm<PromotionFormValues>();
  const campaignType = Form.useWatch('campaignType', form);
  const bannerImageUrl = Form.useWatch('bannerImageUrl', form);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: promotionQueryKey,
    queryFn: promotionsService.getPromotions,
  });
  const {
    data: airlines,
    isError: airlinesError,
    error: airlinesQueryError,
  } = useQuery({
    queryKey: ['admin', 'airlines'],
    queryFn: referenceDataService.getAirlines,
  });

  const refreshPromotions = () =>
    queryClient.invalidateQueries({ queryKey: promotionQueryKey });

  const createMutation = useMutation({
    mutationFn: promotionsService.createPromotion,
    onSuccess: async (_, payload) => {
      messageApi.success(
        payload.campaignType === 'event'
          ? 'Đã thêm deal sự kiện.'
          : 'Đã thêm mã ưu đãi.'
      );
      setModalOpen(false);
      form.resetFields();
      await refreshPromotions();
    },
    onError: (mutationError: unknown) =>
      messageApi.error(`Không thể thêm khuyến mãi: ${getErrorMessage(mutationError)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PromotionPayload }) =>
      promotionsService.updatePromotion(id, payload),
    onSuccess: async (_, { payload }) => {
      messageApi.success(
        payload.campaignType === 'event'
          ? 'Đã cập nhật deal sự kiện.'
          : 'Đã cập nhật mã ưu đãi.'
      );
      setModalOpen(false);
      setEditingPromotion(null);
      form.resetFields();
      await refreshPromotions();
    },
    onError: (mutationError: unknown) =>
      messageApi.error(`Không thể cập nhật khuyến mãi: ${getErrorMessage(mutationError)}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ promotion, active }: { promotion: Promotion; active: boolean }) =>
      promotionsService.updatePromotion(
        promotion._id,
        toUpdatePayload(promotion, active)
      ),
    onSuccess: async () => {
      messageApi.success('Đã cập nhật trạng thái khuyến mãi.');
      await refreshPromotions();
    },
    onError: (mutationError: unknown) =>
      messageApi.error(`Không thể đổi trạng thái: ${getErrorMessage(mutationError)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: promotionsService.deletePromotion,
    onSuccess: async () => {
      messageApi.success('Đã xóa mã khuyến mãi.');
      await refreshPromotions();
    },
    onError: (mutationError: unknown) =>
      messageApi.error(`Không thể xóa khuyến mãi: ${getErrorMessage(mutationError)}`),
  });

  const openCreateModal = (type: 'coupon' | 'event') => {
    setEditingPromotion(null);
    form.resetFields();
    form.setFieldsValue({
      campaignType: type,
      eventTitle: '',
      eventTitleEn: '',
      bannerImageUrl: '',
      airlineCode: '',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 200000,
      minimumBaseFare: 0,
      applicability: 'all',
      startsAt: dayjs(),
      endsAt: dayjs().add(30, 'day'),
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    form.setFieldsValue(toFormValues(promotion));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPromotion(null);
    form.resetFields();
  };

  const handleSubmit = (values: PromotionFormValues) => {
    const payload = toPayload(values);
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: ColumnsType<Promotion> = [
    {
      title: 'Mã khuyến mãi',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Text strong copyable>{code}</Text>,
    },
    {
      title: 'Tên chương trình',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, promotion) => (
        <Space direction="vertical" size={0}>
          <Text strong>{promotion.eventTitle || title}</Text>
          <Text type="secondary">
            {promotion.eventTitleEn || promotion.titleEn}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      key: 'campaignType',
      render: (_, promotion) => (
        <Tag color={promotion.campaignType === 'event' ? 'gold' : 'blue'}>
          {promotion.campaignType === 'event' ? 'Deal sự kiện' : 'Mã ưu đãi'}
        </Tag>
      ),
    },
    {
      title: 'Hãng bay',
      dataIndex: 'airlineCode',
      key: 'airlineCode',
      render: (airlineCode?: string) => airlineCode || 'Tất cả',
    },
    {
      title: 'Ưu đãi',
      key: 'discount',
      render: (_, promotion) => (
        <Space direction="vertical" size={0}>
          <Text>
            {promotion.discountType === 'percentage'
              ? `Giảm ${promotion.discountValue}%`
              : `Giảm ${formatVnd(promotion.discountValue)}`}
          </Text>
          {promotion.maxDiscount ? (
            <Text type="secondary">Tối đa {formatVnd(promotion.maxDiscount)}</Text>
          ) : null}
          <Text type="secondary">
            Đơn tối thiểu {formatVnd(promotion.minimumBaseFare)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Phạm vi',
      dataIndex: 'applicability',
      key: 'applicability',
      render: (applicability: PromotionApplicability) =>
        ({
          all: 'Tất cả hành trình',
          domestic: 'Nội địa',
          international: 'Quốc tế',
        })[applicability],
    },
    {
      title: 'Thời hạn',
      key: 'validity',
      render: (_, promotion) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(promotion.startsAt).format('DD/MM/YYYY HH:mm')}</Text>
          <Text type="secondary">{dayjs(promotion.endsAt).format('DD/MM/YYYY HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, promotion) => (
        <Space direction="vertical" size={6}>
          {getPromotionStatus(promotion)}
          <Tooltip title="Bật hoặc tắt khả năng khách hàng sử dụng mã này">
            <Switch
              checked={promotion.active}
              loading={
                toggleMutation.isPending &&
                toggleMutation.variables?.promotion._id === promotion._id
              }
              onChange={(active) => toggleMutation.mutate({ promotion, active })}
              aria-label={`Trạng thái ${promotion.code}`}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, promotion) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(promotion)}
          >
            Sửa
          </Button>
          {promotion.seeded ? (
            <Tooltip title="Ưu đãi demo mặc định không thể xóa; bạn có thể tắt mã này.">
              <Button danger icon={<DeleteOutlined />} disabled>
                Xóa
              </Button>
            </Tooltip>
          ) : (
            <Popconfirm
              title="Xóa mã khuyến mãi này?"
              description={`Mã ${promotion.code} sẽ không còn sử dụng được.`}
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => deleteMutation.mutate(promotion._id)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Quản lý khuyến mãi
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Tạo, chỉnh sửa và bật/tắt mã giảm giá hiển thị trong quá trình tìm
            chuyến bay và đặt vé.
          </Paragraph>
        </div>

        <Alert
          showIcon
          type="info"
          icon={<GiftOutlined />}
          message="Cách thêm và quản lý mã khuyến mãi"
          description={
            <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                <li>Thêm mã ưu đãi thông thường hoặc chọn “Thêm deal sự kiện” cho chương trình lớn.</li>
                <li>Với deal sự kiện, chọn hãng bay, nhập tên sự kiện và URL ảnh banner công khai.</li>
                <li>Đặt mức giảm, điều kiện và thời hạn rồi bật chương trình; banner chỉ xuất hiện trên chuyến của hãng đã chọn.</li>
                <li>Mã deal được điền sẵn khi đặt vé và máy chủ chỉ giảm giá các chặng thuộc hãng áp dụng.</li>
            </ol>
          }
        />

        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải danh sách khuyến mãi"
            description={getErrorMessage(error)}
          />
        ) : null}

        <Card>
          <Space
            style={{
              width: '100%',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Danh sách mã
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreateModal('coupon')}
            >
              Thêm mã ưu đãi
            </Button>
            <Button
              icon={<GiftOutlined />}
              onClick={() => openCreateModal('event')}
            >
              Thêm deal sự kiện
            </Button>
          </Space>

          <Table<Promotion>
            rowKey="_id"
            columns={columns}
            dataSource={data ?? []}
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1300 }}
            locale={{ emptyText: 'Chưa có mã khuyến mãi nào.' }}
          />
        </Card>
      </Space>

      <Modal
        title={editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            discountType: 'percentage',
            applicability: 'all',
            active: true,
          }}
        >
          <Form.Item
            label="Mã khuyến mãi"
            name="code"
            extra="3–30 ký tự; chỉ dùng chữ không dấu, số, dấu gạch ngang hoặc gạch dưới."
            rules={[
              { required: true, message: 'Vui lòng nhập mã khuyến mãi.' },
              {
                pattern: /^[A-Za-z0-9_-]{3,30}$/,
                message: 'Mã gồm 3–30 ký tự chữ, số, gạch ngang hoặc gạch dưới.',
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: SUMMER2026"
              maxLength={30}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            label="Loại chương trình"
            name="campaignType"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'coupon', label: 'Mã ưu đãi thông thường' },
                { value: 'event', label: 'Deal sự kiện có banner' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Tên chương trình (tiếng Việt)"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên chương trình.' }]}
          >
            <Input maxLength={100} placeholder="Ưu đãi mùa hè" />
          </Form.Item>

          <Form.Item label="Tên chương trình (tiếng Anh)" name="titleEn">
            <Input maxLength={100} placeholder="Summer offer" />
          </Form.Item>

          {campaignType === 'event' ? (
            <Card
              size="small"
              title="Thiết lập deal sự kiện"
              style={{ marginBottom: 16 }}
            >
              <Form.Item
                label="Tên sự kiện"
                name="eventTitle"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập tên sự kiện.',
                  },
                ]}
              >
                <Input maxLength={100} placeholder="Black Friday" />
              </Form.Item>

              <Form.Item label="Tên sự kiện (tiếng Anh)" name="eventTitleEn">
                <Input maxLength={100} placeholder="Black Friday Sale" />
              </Form.Item>

              {airlinesError ? (
                <Alert
                  type="error"
                  showIcon
                  message="Không tải được danh sách hãng bay"
                  description={getErrorMessage(airlinesQueryError)}
                  style={{ marginBottom: 8 }}
                />
              ) : null}
              <Form.Item
                label="Hãng bay áp dụng"
                name="airlineCode"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn hãng bay cho deal sự kiện.',
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn hãng bay"
                  options={(airlines ?? [])
                    .filter((airline: Airline) => airline.status !== 'inactive')
                    .map((airline: Airline) => ({
                      value: airline.code,
                      label: `${airline.name} (${airline.code})`,
                    }))}
                />
              </Form.Item>

              <Form.Item
                label="URL ảnh banner"
                name="bannerImageUrl"
                extra="Dán đường dẫn ảnh công khai bắt đầu bằng http:// hoặc https://. Ảnh sẽ phủ phần đầu thẻ chuyến bay của hãng đã chọn."
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập URL ảnh banner.',
                  },
                  {
                    type: 'url',
                    message: 'URL ảnh banner không hợp lệ.',
                  },
                  {
                    validator: (_, value: string | undefined) => {
                      if (!value || /^https?:\/\//i.test(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('URL ảnh chỉ được dùng http hoặc https.')
                      );
                    },
                  },
                ]}
              >
                <Input
                  maxLength={2048}
                  placeholder="https://example.com/black-friday-banner.jpg"
                />
              </Form.Item>

              {bannerImageUrl ? (
                <Image
                  src={bannerImageUrl}
                  alt="Xem trước ảnh banner sự kiện"
                  style={{
                    width: '100%',
                    maxHeight: 140,
                    objectFit: 'cover',
                    borderRadius: 10,
                  }}
                  fallback=""
                />
              ) : null}
            </Card>
          ) : null}

          <Space size={16} align="start" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Loại giảm giá"
              name="discountType"
              rules={[{ required: true }]}
              style={{ minWidth: 200 }}
            >
              <Select
                options={[
                  { value: 'percentage', label: 'Phần trăm (%)' },
                  { value: 'fixed', label: 'Số tiền cố định (₫)' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Giá trị giảm"
              name="discountValue"
              dependencies={['discountType']}
              rules={[
                { required: true, message: 'Vui lòng nhập giá trị giảm.' },
                {
                  validator: (_, value: number | undefined) => {
                    if (
                      typeof value !== 'number' ||
                      !Number.isFinite(value) ||
                      value < 1
                    ) {
                      return Promise.reject(new Error('Giá trị phải lớn hơn 0.'));
                    }
                    if (
                      form.getFieldValue('discountType') === 'percentage' &&
                      value > 100
                    ) {
                      return Promise.reject(new Error('Phần trăm giảm tối đa là 100%.'));
                    }
                    if (
                      form.getFieldValue('discountType') === 'fixed' &&
                      !Number.isInteger(value)
                    ) {
                      return Promise.reject(new Error('Số tiền giảm phải là số nguyên.'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              style={{ minWidth: 200 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="Giảm tối đa (₫)"
              name="maxDiscount"
              extra="Để trống nếu không giới hạn."
              rules={[
                {
                  validator: (_, value: number | null | undefined) => {
                    if (value == null || (Number.isInteger(value) && value > 0)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Mức giảm tối đa phải là số nguyên lớn hơn 0.')
                    );
                  },
                },
              ]}
              style={{ minWidth: 200 }}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Giá vé tối thiểu (₫)"
              name="minimumBaseFare"
              rules={[
                { required: true, message: 'Vui lòng nhập giá vé tối thiểu.' },
                {
                  validator: (_, value: number | undefined) => {
                    if (Number.isInteger(value) && (value ?? -1) >= 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Giá vé tối thiểu phải là số nguyên không âm.')
                    );
                  },
                },
              ]}
              style={{ minWidth: 240 }}
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="Phạm vi áp dụng"
              name="applicability"
              rules={[{ required: true }]}
              style={{ minWidth: 240 }}
            >
              <Select
                options={[
                  { value: 'all', label: 'Tất cả hành trình' },
                  { value: 'domestic', label: 'Nội địa' },
                  { value: 'international', label: 'Quốc tế' },
                ]}
              />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Bắt đầu"
              name="startsAt"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu.' }]}
              style={{ minWidth: 240 }}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="Kết thúc"
              name="endsAt"
              dependencies={['startsAt']}
              rules={[
                { required: true, message: 'Vui lòng chọn thời gian kết thúc.' },
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs | undefined) {
                    const startsAt = getFieldValue('startsAt') as Dayjs | undefined;
                    if (!value || !startsAt || value.isAfter(startsAt)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Thời gian kết thúc phải sau thời gian bắt đầu.')
                    );
                  },
                }),
              ]}
              style={{ minWidth: 240 }}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item label="Mô tả (tiếng Việt)" name="description">
            <TextArea rows={2} maxLength={500} showCount />
          </Form.Item>

          <Form.Item label="Mô tả (tiếng Anh)" name="descriptionEn">
            <TextArea rows={2} maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="Đang hoạt động"
            name="active"
            valuePropName="checked"
            extra="Mã chỉ có thể được khách sử dụng trong thời hạn hiệu lực khi trạng thái này được bật."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
