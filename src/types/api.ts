import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryDocument } from '../schemas/delivery.schema';

export interface DeliveryTracking {
  currentLocation?: {
    coordinates: [number, number];
    address: string;
  };
  history: Array<{
    timestamp: Date;
    status: DeliveryStatus;
    location?: {
      coordinates: [number, number];
      address: string;
    };
    notes?: string;
  }>;
  actualDeliveryDate?: Date;
}

export interface DeliveryAddress {
  coordinates: [number, number];
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ProofOfDelivery {
  receivedBy: string;
  signature?: string;
  photoUrl?: string;
  timestamp: Date;
  notes?: string;
}

export interface DeliveryItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Delivery {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  };
  deliveryCompanyId: string;
  status: DeliveryStatus;
  items: DeliveryItem[];
  deliveryAddress: DeliveryAddress;
  tracking: DeliveryTracking;
  proofOfDelivery?: ProofOfDelivery;
  vatRate: number;
  additionalTaxes?: Array<{
    taxName: string;
    rate: number;
  }>;
  isReconciled?: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryFilters {
  search?: string;
  status?: DeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  isReconciled?: boolean;
  page?: number;
  limit?: number;
}

export interface GetDeliveriesResponse {
    deliveries: DeliveryDocument[];
    total: number;
    page: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
} 