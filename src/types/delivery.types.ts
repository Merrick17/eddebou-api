import { DeliveryDocument } from '../schemas/delivery.schema';

export interface GetDeliveriesResponseType {
  deliveries: DeliveryDocument[];
  total: number;
  page: number;
  totalPages: number;
} 