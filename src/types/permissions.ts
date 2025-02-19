export type ServiceName =
  | 'users'
  | 'deliveries'
  | 'movements'
  | 'inventory'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'customers'
  | 'warehouses'
  | 'reports'
  | 'settings'
  | 'roles'
  | 'audit-logs'
  | 'stock-movements'
  | 'delivery-companies'
  | 'supplier-invoices'
  | 'locations';

export type ServiceAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

export interface Permission {
  service: ServiceName;
  actions: ServiceAction[];
} 