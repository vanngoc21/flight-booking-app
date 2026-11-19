import api from '../../services/api';
import type {
  Promotion,
  PromotionPayload,
  PromotionResponse,
  PromotionsResponse,
} from './promotions.types';

export const promotionsService = {
  async getPromotions(): Promise<Promotion[]> {
    const response = await api.get<PromotionsResponse>('/admin/promotions');
    return response.data.data;
  },

  async createPromotion(payload: PromotionPayload): Promise<Promotion> {
    const response = await api.post<PromotionResponse>(
      '/admin/promotions',
      payload
    );
    return response.data.data;
  },

  async updatePromotion(
    id: string,
    payload: PromotionPayload
  ): Promise<Promotion> {
    const response = await api.put<PromotionResponse>(
      `/admin/promotions/${id}`,
      payload
    );
    return response.data.data;
  },

  async deletePromotion(id: string): Promise<void> {
    await api.delete(`/admin/promotions/${id}`);
  },
};
