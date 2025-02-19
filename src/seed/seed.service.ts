import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem } from '../schemas/inventory-item.schema';
import { Location } from '../schemas/location.schema';
import { Supplier } from '../schemas/supplier.schema';
import { User } from '../schemas/user.schema';
import { DeliveryCompany } from '../schemas/delivery-company.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(InventoryItem.name) private inventoryModel: Model<InventoryItem>,
    @InjectModel(Location.name) private locationModel: Model<Location>,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(DeliveryCompany.name) private deliveryCompanyModel: Model<DeliveryCompany>,
  ) {}

  async seed() {
    await this.cleanDatabase();
    await this.seedUsers();
    await this.seedLocations();
    await this.seedSuppliers();
    await this.seedDeliveryCompanies();
    await this.seedInventoryItems();
  }

  private async cleanDatabase() {
    await Promise.all([
      this.inventoryModel.deleteMany({}),
      this.locationModel.deleteMany({}),
      this.supplierModel.deleteMany({}),
      this.userModel.deleteMany({}),
      this.deliveryCompanyModel.deleteMany({}),
    ]);
  }

  private async seedUsers() {
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        role: 'user',
        status: 'active',
      },
    ];

    try {
      await this.userModel.insertMany(users);
      console.log('Users seeded successfully');
    } catch (error) {
      console.error('Error seeding users:', error);
    }
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

    try {
      await this.locationModel.insertMany(locations);
      console.log('Locations seeded successfully');
    } catch (error) {
      console.error('Error seeding locations:', error);
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

    try {
      await this.supplierModel.insertMany(suppliers);
      console.log('Suppliers seeded successfully');
    } catch (error) {
      console.error('Error seeding suppliers:', error);
    }
  }

  private async seedDeliveryCompanies() {
    const deliveryCompanies = [
      {
        name: 'Express Delivery Co.',
        email: 'contact@expressdelivery.com',
        phone: '+1234567890',
        address: '123 Delivery Street, Logistics City',
        status: 'active',
        rating: 4.5,
      },
      {
        name: 'Fast Track Logistics',
        email: 'support@fasttrack.com',
        phone: '+1987654321',
        address: '456 Speed Avenue, Transport City',
        status: 'active',
        rating: 4.2,
      },
      {
        name: 'Reliable Shipping',
        email: 'info@reliableshipping.com',
        phone: '+1122334455',
        address: '789 Trust Road, Delivery Town',
        status: 'active',
        rating: 4.8,
      },
    ];

    try {
      await this.deliveryCompanyModel.insertMany(deliveryCompanies);
      console.log('Delivery companies seeded successfully');
    } catch (error) {
      console.error('Error seeding delivery companies:', error);
    }
  }

  private async seedInventoryItems() {
    const suppliers = await this.supplierModel.find();
    const locations = await this.locationModel.find();

    const inventoryItems = [
      {
        name: 'Laptop',
        sku: 'LAP-001',
        description: 'High-performance business laptop',
        category: 'electronics',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        unitPrice: 999.99,
        supplier: suppliers[0]._id,
        location: locations[0]._id,
        status: 'in_stock',
      },
      {
        name: 'Office Chair',
        sku: 'CHR-001',
        description: 'Ergonomic office chair',
        category: 'furniture',
        currentStock: 30,
        minStock: 5,
        maxStock: 50,
        unitPrice: 199.99,
        supplier: suppliers[1]._id,
        location: locations[1]._id,
        status: 'in_stock',
      },
    ];

    try {
      await this.inventoryModel.insertMany(inventoryItems);
      console.log('Inventory items seeded successfully');
    } catch (error) {
      console.error('Error seeding inventory items:', error);
    }
  }
} 