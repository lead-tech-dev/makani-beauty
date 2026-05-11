import api from '../lib/api';
import type { Order, FulfillmentMethod, RelayPoint, ShippingSpeed, ShipmentEvent, ReturnRequest } from '../types';

export interface CreateOrderPayload {
  fulfillmentMethod?: FulfillmentMethod;
  shippingSpeed?: ShippingSpeed;
  addressId?: string;
  relayPoint?: RelayPoint;
  items: { productId: string; quantity: number; variantId?: string | null }[];
  notes?: string;
  promoCode?: string;
}

export const ordersService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  async getMyOrders(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders/my');
    return data;
  },

  async getMyOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/my/${id}`);
    return data;
  },

  async cancel(id: string): Promise<Order> {
    const { data } = await api.delete<Order>(`/orders/my/${id}/cancel`);
    return data;
  },

  async listEvents(id: string): Promise<ShipmentEvent[]> {
    const { data } = await api.get<ShipmentEvent[]>(`/orders/my/${id}/events`);
    return data;
  },

  async refreshTracking(id: string): Promise<ShipmentEvent[]> {
    const { data } = await api.post<ShipmentEvent[]>(`/orders/my/${id}/refresh-tracking`);
    return data;
  },

  async downloadInvoice(id: string): Promise<Blob> {
    const { data } = await api.get(`/orders/my/${id}/invoice`, { responseType: 'blob' });
    return data as Blob;
  },

  async createReturn(orderId: string, payload: { reason: string; items: { orderItemId: string; quantity: number }[] }): Promise<ReturnRequest> {
    const { data } = await api.post<ReturnRequest>(`/orders/my/${orderId}/returns`, payload);
    return data;
  },

  async listReturns(orderId: string): Promise<ReturnRequest[]> {
    const { data } = await api.get<ReturnRequest[]>(`/orders/my/${orderId}/returns`);
    return data;
  },
};
