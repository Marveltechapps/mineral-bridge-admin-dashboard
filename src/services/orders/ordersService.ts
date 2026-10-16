import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { IntakeItem, OrderRow } from '@/types/orders';
import { INTAKE, ORDERS } from './ordersData';

export function getOrders(signal?: AbortSignal): Promise<OrderRow[]> {
  return apiRequestOrDemo(ENDPOINTS.orders.list, ORDERS, { signal });
}

export function getIntakeQueue(signal?: AbortSignal): Promise<IntakeItem[]> {
  return apiRequestOrDemo(ENDPOINTS.orders.intake, INTAKE, { signal });
}
