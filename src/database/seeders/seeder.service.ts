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
    await this.cleanDatabase();
    const adminUser = await this.seedUsers();
    const suppliers = await this.seedSuppliers();
    const locations = await this.seedLocations();
    const deliveryCompanies = await this.seedDeliveryCompanies();
    await this.seedInventoryItems(suppliers, locations, adminUser._id.toString());
  }

  private async cleanDatabase() {
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
  }

  private async seedUsers(): Promise<UserDocument> {
    try {
      // Clear existing users first
      await this.userModel.deleteMany({});
      
      // Use a consistent salt rounds value
      const saltRounds = 10;

      // Define admin permissions - full access to all services
      const services: ServiceName[] = [
        'users', 
        'deliveries', 
        'movements', 
        'inventory',
        'products',
        'categories',
        'suppliers',
        'customers',
        'warehouses',
        'reports',
        'settings',
        'roles',
        'audit-logs',
        'stock-movements',
        'delivery-companies',
        'supplier-invoices',
        'locations'
      ];

      const actions: ServiceAction[] = ['create', 'read', 'update', 'delete', 'export', 'import'];

      const adminPermissions: Permission[] = services.map(service => ({
        service,
        actions
      }));

      // Define regular user permissions - limited access
      const regularUserPermissions: Permission[] = [
        {
          service: 'inventory',
          actions: ['read']
        },
        {
          service: 'products',
          actions: ['read']
        },
        {
          service: 'deliveries',
          actions: ['read', 'create']
        },
        {
          service: 'movements',
          actions: ['read', 'create']
        },
        {
          service: 'stock-movements',
          actions: ['read', 'create']
        },
        {
          service: 'locations',
          actions: ['read']
        }
      ];
      
      const users = [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', saltRounds),
          role: 'admin',
          status: 'active',
          permissions: adminPermissions
        },
        {
          name: 'Regular User',
          email: 'user@example.com',
          password: await bcrypt.hash('user123', saltRounds),
          role: 'user',
          status: 'active',
          permissions: regularUserPermissions
        },
      ];

      const createdUsers = await this.userModel.insertMany(users);
      
      // Log the created users for verification
      console.log('Users seeded successfully. Admin user details:', {
        email: createdUsers[0].email,
        role: createdUsers[0].role,
        permissionsCount: createdUsers[0].permissions.length
      });
      
      return createdUsers[0];
    } catch (error) {
      console.error('Error seeding users:', error);
      throw error;
    }
  }

  private async seedSuppliers() {
    const suppliers = [
      {
        name: 'Tech Supplies Inc',
        email: 'contact@techsupplies.com',
        phone: '+1234567890',
        address: '123 Tech Street',
        contactPerson: 'John Smith',
        description: 'Leading supplier of tech equipment',
        website: 'www.techsupplies.com',
        status: 'active',
      },
      {
        name: 'Office Solutions',
        email: 'info@officesolutions.com',
        phone: '+0987654321',
        address: '456 Office Avenue',
        contactPerson: 'Jane Doe',
        description: 'Premium office furniture and supplies',
        website: 'www.officesolutions.com',
        status: 'active',
      },
    ];

    return await this.supplierModel.insertMany(suppliers);
  }

  private async seedLocations() {
    const locations = [
      {
        name: 'Main Warehouse',
        address: '789 Warehouse Blvd',
        capacity: 1000,
        usedCapacity: 0,
        type: 'warehouse',
        description: 'Primary storage facility',
        status: 'active',
      },
      {
        name: 'Secondary Storage',
        address: '321 Storage Lane',
        capacity: 500,
        usedCapacity: 0,
        type: 'distribution_center',
        description: 'Auxiliary storage space',
        status: 'active',
      },
    ];

    return await this.locationModel.insertMany(locations);
  }

  private async seedDeliveryCompanies() {
    const companies = [
      {
        name: 'Express Delivery',
        email: 'contact@expressdelivery.com',
        phone: '+1234567890',
        address: '123 Delivery Street',
        contactPerson: 'Mike Johnson',
        description: 'Fast and reliable delivery service',
        website: 'www.expressdelivery.com',
        status: 'active',
      },
      {
        name: 'Quick Logistics',
        email: 'info@quicklogistics.com',
        phone: '+0987654321',
        address: '456 Logistics Avenue',
        contactPerson: 'Sarah Wilson',
        description: 'Professional logistics solutions',
        website: 'www.quicklogistics.com',
        status: 'active',
      },
    ];

    return await this.deliveryCompanyModel.insertMany(companies);
  }

  private async seedInventoryItems(suppliers: any[], locations: any[], adminUserId: string) {
    const items = [
      {
        name: 'Laptop',
        sku: 'LAP-001',
        description: 'High-performance business laptop',
        category: 'electronics',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        buyingPrice: 800.00,
        unitPrice: 1299.99,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '123456789',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop',
        lastUpdated: new Date(),
      },
      {
        name: 'Monitor',
        sku: 'MON-001',
        description: '27-inch 4K LED Monitor',
        category: 'electronics',
        currentStock: 40,
        minStock: 8,
        maxStock: 80,
        buyingPrice: 299.99,
        unitPrice: 399.99,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '789123456',
        image: 'https://images.unsplash.com/photo-1586210579191-33b45e38db0c?w=800&auto=format&fit=crop',
        lastUpdated: new Date(),
      },
      {
        name: 'Wireless Mouse',
        sku: 'MOU-001',
        description: 'Ergonomic wireless mouse',
        category: 'electronics',
        currentStock: 100,
        minStock: 20,
        maxStock: 200,
        buyingPrice: 29.99,
        unitPrice: 49.99,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '321654987',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop',
        lastUpdated: new Date(),
      },
      {
        name: 'Keyboard',
        sku: 'KEY-001',
        description: 'Mechanical gaming keyboard',
        category: 'electronics',
        currentStock: 75,
        minStock: 15,
        maxStock: 150,
        buyingPrice: 89.99,
        unitPrice: 129.99,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
        barcode: '147258369',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop',
        lastUpdated: new Date(),
      },
      {
        name: 'Office Chair',
        sku: 'CHR-001',
        description: 'Ergonomic office chair',
        category: 'furniture',
        currentStock: 30,
        minStock: 5,
        maxStock: 50,
        buyingPrice: 149.99,
        unitPrice: 249.99,
        supplier: suppliers[1]._id,
        location: locations[1]._id,
        status: 'in_stock',
        barcode: '963852741',
        image: 'https://images.unsplash.com/photo-1505797149-0b7e017e7559?w=800&auto=format&fit=crop',
        lastUpdated: new Date(),
      }
    ];

    // Create initial supplier invoices for the seeded items
    const invoices = items.map((item, index) => ({
      invoiceRef: `INV-2024-${(index + 1).toString().padStart(3, '0')}`,
      supplierId: item.supplier,
      items: [{
        itemId: null, // Will be set after items are created
        quantity: item.currentStock,
        buyingPrice: item.buyingPrice,
        totalPrice: item.buyingPrice * item.currentStock
      }],
      subtotal: item.buyingPrice * item.currentStock,
      vatRate: 20,
      vatAmount: (item.buyingPrice * item.currentStock) * 0.2,
      totalAmount: (item.buyingPrice * item.currentStock) * 1.2,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'paid',
      createdBy: adminUserId // Use the admin user's ID
    }));

    try {
      // Create inventory items
      const createdItems = await this.inventoryModel.create(items);
      
      // Update invoice items with created item IDs
      invoices.forEach((invoice, index) => {
        invoice.items[0].itemId = createdItems[index]._id;
      });

      // Create supplier invoices
      await this.supplierInvoiceModel.create(invoices);

      console.log('Seeded inventory items and initial supplier invoices');
    } catch (error) {
      console.error('Error seeding inventory items:', error);
    }
  }
} 