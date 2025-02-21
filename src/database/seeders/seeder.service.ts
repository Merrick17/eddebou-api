import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { Location, LocationDocument } from '../../schemas/location.schema';
import { Supplier, SupplierDocument } from '../../schemas/supplier.schema';
import { SupplierInvoice, SupplierInvoiceDocument } from '../../schemas/supplier-invoice.schema';
import { DeliveryCompany, DeliveryCompanyDocument } from '../../schemas/delivery-company.schema';
import { StockMovement, StockMovementDocument } from '../../schemas/stock-movement.schema';
import { Movement, MovementDocument } from '../../schemas/movement.schema';
import { Delivery, DeliveryDocument } from '../../schemas/delivery.schema';
import { Permission, ServiceName, ServiceAction } from '../../types/permissions';
import { MovementType } from '../../enums/movement-type.enum';
import { MovementStatus } from '../../enums/movement-status.enum';
import { DeliveryStatus } from '../../enums/delivery-status.enum';
import { DeliveryPriority } from '../../enums/delivery-priority.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InventoryItem.name) private inventoryModel: Model<InventoryItemDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    @InjectModel(SupplierInvoice.name) private supplierInvoiceModel: Model<SupplierInvoiceDocument>,
    @InjectModel(DeliveryCompany.name) private deliveryCompanyModel: Model<DeliveryCompanyDocument>,
    @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(Movement.name) private movementModel: Model<MovementDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
  ) {}

  async seed() {
    try {
      console.log('Starting database cleanup...');
      await this.cleanDatabase();
      console.log('Database cleanup completed');

      console.log('Starting seeding process...');
      const adminUser = await this.seedUsers();
      const suppliers = await this.seedSuppliers();
      const locations = await this.seedLocations();
      const deliveryCompanies = await this.seedDeliveryCompanies();
      const inventoryItems = await this.seedInventoryItems(suppliers, locations, adminUser._id.toString());
      await this.seedStockMovements(inventoryItems, locations, adminUser._id.toString());
      await this.seedDeliveries(inventoryItems, deliveryCompanies, adminUser._id.toString());
      console.log('Seeding completed successfully');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  }

  private async cleanDatabase() {
    try {
      // First, drop all collections to ensure clean state
      const collections = [
        this.userModel,
        this.inventoryModel,
        this.locationModel,
        this.supplierModel,
        this.supplierInvoiceModel,
        this.deliveryCompanyModel,
        this.stockMovementModel,
        this.movementModel,
        this.deliveryModel
      ];

      // Drop collections one by one to ensure proper cleanup
      for (const collection of collections) {
        try {
          await collection.collection.drop();
        } catch (error) {
          // Ignore collection doesn't exist error
          if (error.code !== 26) {
            console.warn(`Warning while dropping collection ${collection.collection.name}:`, error.message);
          }
        }
      }

      // Then ensure all documents are deleted (as a backup if drop fails)
      await Promise.all([
        this.userModel.deleteMany({}),
        this.inventoryModel.deleteMany({}),
        this.locationModel.deleteMany({}),
        this.supplierModel.deleteMany({}),
        this.supplierInvoiceModel.deleteMany({}),
        this.deliveryCompanyModel.deleteMany({}),
        this.stockMovementModel.deleteMany({}),
        this.movementModel.deleteMany({}),
        this.deliveryModel.deleteMany({}),
      ]);

      console.log('All collections cleaned successfully');
    } catch (error) {
      console.error('Error during database cleanup:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<UserDocument> {
    const saltRounds = 10;

    const services: ServiceName[] = [
      'users', 'deliveries', 'movements', 'inventory', 'products',
      'categories', 'suppliers', 'customers', 'warehouses', 'reports',
      'settings', 'roles', 'audit-logs', 'stock-movements',
      'delivery-companies', 'supplier-invoices', 'locations'
    ];

    const actions: ServiceAction[] = ['create', 'read', 'update', 'delete', 'export', 'import'];

    const adminPermissions: Permission[] = services.map(service => ({
      service,
      actions
    }));

    const regularUserPermissions: Permission[] = [
      { service: 'inventory', actions: ['read'] },
      { service: 'products', actions: ['read'] },
      { service: 'deliveries', actions: ['read', 'create'] },
      { service: 'movements', actions: ['read', 'create'] },
      { service: 'stock-movements', actions: ['read', 'create'] },
      { service: 'locations', actions: ['read'] }
    ];

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', saltRounds),
        role: 'admin',
        status: 'active',
        permissions: adminPermissions,
        isEmailVerified: true,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        isActive: true,
        twoFactorEnabled: false,
        activityLogs: [{
          timestamp: new Date(),
          action: 'login',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0'
        }]
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', saltRounds),
        role: 'user',
        status: 'active',
        permissions: regularUserPermissions,
        isEmailVerified: true,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        isActive: true,
        twoFactorEnabled: false,
        activityLogs: []
      },
    ];

    const createdUsers = await this.userModel.insertMany(users);
    return createdUsers[0];
  }

  private async seedSuppliers() {
    const suppliers = [
      {
        name: 'Tech Supplies Inc',
        email: 'contact@techsupplies.com',
        phone: '+1234567890',
        address: '123 Tech Street, Silicon Valley, CA 94025',
        contactPerson: 'John Smith',
        notes: 'Premium tech equipment supplier',
        paymentTerms: 'Net 30',
        taxId: 'TAX123456',
        status: 'active',
        rating: 4.5
      },
      {
        name: 'Office Solutions',
        email: 'info@officesolutions.com',
        phone: '+0987654321',
        address: '456 Office Avenue, New York, NY 10001',
        contactPerson: 'Jane Doe',
        notes: 'Office furniture and supplies specialist',
        paymentTerms: 'Net 45',
        taxId: 'TAX789012',
        status: 'active',
        rating: 4.0
      },
      {
        name: 'Global Electronics',
        email: 'sales@globalelectronics.com',
        phone: '+1122334455',
        address: '789 Electronics Blvd, Austin, TX 78701',
        contactPerson: 'Mike Johnson',
        notes: 'International electronics distributor',
        paymentTerms: 'Net 60',
        taxId: 'TAX345678',
        status: 'active',
        rating: 4.8
      }
    ];

    return await this.supplierModel.insertMany(suppliers);
  }

  private async seedLocations() {
    const locations = [
      {
        name: 'Main Warehouse',
        address: '789 Warehouse Blvd, Chicago, IL 60601',
        capacity: 10000,
        usedCapacity: 0,
        type: 'warehouse',
        description: 'Primary storage facility with climate control',
        status: 'active'
      },
      {
        name: 'Downtown Store',
        address: '321 Retail St, Chicago, IL 60602',
        capacity: 1000,
        usedCapacity: 0,
        type: 'store',
        description: 'Main retail location',
        status: 'active'
      },
      {
        name: 'Distribution Center East',
        address: '456 Logistics Way, Newark, NJ 07101',
        capacity: 5000,
        usedCapacity: 0,
        type: 'distribution_center',
        description: 'East coast distribution hub',
        status: 'active'
      }
    ];

    return await this.locationModel.insertMany(locations);
  }

  private async seedDeliveryCompanies() {
    const companies = [
      {
        name: 'Express Delivery',
        code: 'EXP',
        contactPerson: 'Mike Johnson',
        email: 'contact@expressdelivery.com',
        phone: '+1234567890',
        address: '123 Delivery Street, Chicago, IL 60603',
        status: 'active',
        rating: 4.5,
        notes: 'Premium same-day delivery service'
      },
      {
        name: 'Quick Logistics',
        code: 'QCK',
        contactPerson: 'Sarah Wilson',
        email: 'info@quicklogistics.com',
        phone: '+0987654321',
        address: '456 Logistics Avenue, Chicago, IL 60604',
        status: 'active',
        rating: 4.2,
        notes: 'Specialized in B2B deliveries'
      },
      {
        name: 'Global Shipping',
        code: 'GLS',
        contactPerson: 'David Brown',
        email: 'contact@globalshipping.com',
        phone: '+1122334455',
        address: '789 International Blvd, Chicago, IL 60605',
        status: 'active',
        rating: 4.7,
        notes: 'International shipping specialist'
      }
    ];

    return await this.deliveryCompanyModel.insertMany(companies);
  }

  private async seedInventoryItems(suppliers: any[], locations: any[], adminUserId: string) {
    const items = [
      {
        name: 'ThinkPad X1 Carbon',
        sku: 'LAP-001',
        description: 'High-performance business laptop with Intel Core i7, 16GB RAM, 1TB SSD',
        category: 'laptops',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        buyingPrice: 1200.00,
        unitPrice: 1599.99,
        taxRate: 20,
        taxInclusive: false,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '8901234567890',
        image: 'https://example.com/images/thinkpad-x1.jpg'
      },
      {
        name: 'Dell UltraSharp 27" Monitor',
        sku: 'MON-001',
        description: '27-inch 4K USB-C Monitor with HDR and built-in KVM',
        category: 'monitors',
        currentStock: 40,
        minStock: 8,
        maxStock: 80,
        buyingPrice: 399.99,
        unitPrice: 549.99,
        taxRate: 20,
        taxInclusive: false,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '8901234567891',
        image: 'https://example.com/images/dell-monitor.jpg'
      },
      {
        name: 'Logitech MX Master 3',
        sku: 'MOU-001',
        description: 'Advanced Wireless Mouse with Ergonomic Design and App-Specific Customization',
        category: 'accessories',
        currentStock: 100,
        minStock: 20,
        maxStock: 200,
        buyingPrice: 79.99,
        unitPrice: 99.99,
        taxRate: 20,
        taxInclusive: false,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '8901234567892',
        image: 'https://example.com/images/mx-master.jpg'
      },
      {
        name: 'Apple MacBook Pro 14"',
        sku: 'LAP-002',
        description: '14-inch MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD',
        category: 'laptops',
        currentStock: 5,
        minStock: 10,
        maxStock: 50,
        buyingPrice: 1599.99,
        unitPrice: 1999.99,
        taxRate: 20,
        taxInclusive: false,
        supplier: suppliers[2]._id,
        location: locations[0]._id,
        status: 'low_stock',
        barcode: '8901234567893',
        image: 'https://example.com/images/macbook-pro.jpg'
      },
      {
        name: 'Samsung 34" Ultrawide Monitor',
        sku: 'MON-002',
        description: '34-inch Curved Ultrawide Monitor with 165Hz Refresh Rate',
        category: 'monitors',
        currentStock: 0,
        minStock: 5,
        maxStock: 30,
        buyingPrice: 599.99,
        unitPrice: 799.99,
        taxRate: 20,
        taxInclusive: false,
        supplier: suppliers[2]._id,
        location: locations[0]._id,
        status: 'out_of_stock',
        barcode: '8901234567894',
        image: 'https://example.com/images/samsung-ultrawide.jpg'
      }
    ];

    // Update status based on stock levels before creating items
    items.forEach(item => {
      if (item.currentStock === 0) {
        item.status = 'out_of_stock';
      } else if (item.currentStock <= item.minStock) {
        item.status = 'low_stock';
      } else {
        item.status = 'in_stock';
      }
    });

    const createdItems = await this.inventoryModel.create(items);

    // Group items by supplier for more realistic invoicing
    const itemsBySupplier = items.reduce((acc, item, index) => {
      const supplierId = item.supplier.toString();
      if (!acc[supplierId]) {
        acc[supplierId] = [];
      }
      acc[supplierId].push({
        item,
        createdItemId: createdItems[index]._id
      });
      return acc;
    }, {} as Record<string, Array<{ item: any; createdItemId: any }>>);

    // Create one invoice per supplier with multiple items
    const invoices = Object.entries(itemsBySupplier).map(([supplierId, supplierItems], index) => {
      const items = supplierItems.map(({ item, createdItemId }) => ({
        itemId: createdItemId,
        quantity: item.currentStock,
        buyingPrice: item.buyingPrice,
        totalPrice: item.buyingPrice * item.currentStock,
        taxRate: item.taxRate,
        taxAmount: (item.buyingPrice * item.currentStock) * (item.taxRate / 100)
      }));

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const vatAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);

      return {
        invoiceRef: `INV-2024-${(index + 1).toString().padStart(3, '0')}`,
        supplierId,
        items,
        subtotal,
        vatRate: 20, // Standard VAT rate
        vatAmount,
        totalAmount: subtotal + vatAmount,
        additionalTaxes: [{
          taxName: 'Environmental Fee',
          rate: 2,
          amount: subtotal * 0.02
        }],
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'paid',
        notes: 'Initial stock purchase',
        createdBy: adminUserId,
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledBy: adminUserId
      };
    });

    await this.supplierInvoiceModel.create(invoices);
    return createdItems;
  }

  private async seedStockMovements(items: any[], locations: any[], adminUserId: string) {
    const movements = items.map(item => ({
      type: MovementType.IN,
      itemId: item._id,
      quantity: item.currentStock,
      locationId: item.location,
      reason: 'Initial stock receipt',
      reference: `RCPT-${item.sku}`,
      notes: 'Initial inventory setup',
      createdBy: adminUserId,
      status: MovementStatus.COMPLETED,
      batchNumber: `BATCH-${item.sku}-001`,
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      qualityChecks: {
        checkedBy: adminUserId,
        checkedAt: new Date(),
        passed: true,
        notes: 'Initial quality check passed'
      },
      unitCost: item.buyingPrice,
      totalCost: item.buyingPrice * item.currentStock,
      minimumThreshold: item.minStock,
      maximumThreshold: item.maxStock,
      tags: ['initial-stock', 'verified']
    }));

    await this.stockMovementModel.insertMany(movements);
  }

  private async seedDeliveries(items: any[], deliveryCompanies: any[], adminUserId: string) {
    const deliveries = [
      {
        invoiceNumber: 'DEL-2024-001',
        trackingNumber: 'TRK123456789',
        customerName: 'Acme Corp',
        customerEmail: 'orders@acmecorp.com',
        customerPhone: '+1234567890',
        deliveryLocation: {
          address: '123 Business Ave',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          postalCode: '60606',
          coordinates: [-87.6298, 41.8781],
          instructions: 'Delivery entrance at back of building'
        },
        items: [{
          itemId: items[0]._id,
          quantity: 2,
          unitPrice: items[0].unitPrice,
          taxRate: 20
        }],
        deliveryCompanyId: deliveryCompanies[0]._id,
        vatRate: 20,
        additionalTaxes: [{
          taxName: 'City Tax',
          rate: 1.5
        }],
        notes: 'Priority delivery requested',
        preferredDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: DeliveryStatus.CONFIRMED,
        tracking: {
          currentLocation: {
            coordinates: [-87.6298, 41.8781],
            address: 'Chicago Distribution Center',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            postalCode: '60601'
          },
          history: [{
            timestamp: new Date(),
            status: DeliveryStatus.CONFIRMED,
            location: {
              coordinates: [-87.6298, 41.8781],
              address: 'Chicago Distribution Center',
              city: 'Chicago',
              state: 'IL',
              country: 'USA',
              postalCode: '60601'
            },
            notes: 'Order confirmed and ready for pickup'
          }]
        }
      }
    ];

    await this.deliveryModel.insertMany(deliveries);
  }
} 