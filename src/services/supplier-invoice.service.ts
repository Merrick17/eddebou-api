import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupplierInvoice, SupplierInvoiceDocument } from '../schemas/supplier-invoice.schema';
import { CreateSupplierInvoiceDto, UpdateSupplierInvoiceDto, SupplierInvoiceQueryDto } from '../dto/supplier-invoice.dto';
import { InventoryService } from './inventory.service';

@Injectable()
export class SupplierInvoiceService {
  constructor(
    @InjectModel(SupplierInvoice.name)
    private supplierInvoiceModel: Model<SupplierInvoiceDocument>,
    private inventoryService: InventoryService,
  ) {}

  async create(createDto: CreateSupplierInvoiceDto, userId: string): Promise<SupplierInvoice> {
    try {
      // Check for duplicate invoice reference
      const existingInvoice = await this.supplierInvoiceModel.findOne({ invoiceRef: createDto.invoiceRef });
      if (existingInvoice) {
        throw new ConflictException(`Invoice with reference ${createDto.invoiceRef} already exists`);
      }

      // Calculate totals with tax handling
      let subtotal = 0;
      const items = createDto.items.map(item => {
        if (item.quantity <= 0) {
          throw new BadRequestException(`Invalid quantity for item ${item.itemId}`);
        }
        if (item.buyingPrice < 0) {
          throw new BadRequestException(`Invalid buying price for item ${item.itemId}`);
        }
        if (item.taxRate < 0) {
          throw new BadRequestException(`Invalid tax rate for item ${item.itemId}`);
        }

        const totalPrice = item.quantity * item.buyingPrice;
        const taxAmount = (totalPrice * item.taxRate) / 100;
        subtotal += totalPrice;
        
        return {
          ...item,
          totalPrice,
          taxAmount
        };
      });

      // Calculate VAT
      if (createDto.vatRate < 0) {
        throw new BadRequestException('VAT rate cannot be negative');
      }
      const vatAmount = (subtotal * createDto.vatRate) / 100;

      // Calculate additional taxes
      let additionalTaxesTotal = 0;
      const additionalTaxes = createDto.additionalTaxes?.map(tax => {
        if (tax.rate < 0) {
          throw new BadRequestException(`Invalid rate for tax ${tax.taxName}`);
        }
        const amount = (subtotal * tax.rate) / 100;
        additionalTaxesTotal += amount;
        return {
          ...tax,
          amount
        };
      }) || [];

      const totalAmount = subtotal + vatAmount + additionalTaxesTotal;

      const invoice = new this.supplierInvoiceModel({
        ...createDto,
        items,
        subtotal,
        vatAmount,
        additionalTaxes,
        totalAmount,
        status: 'pending',
        createdBy: userId,
      });

      const savedInvoice = await invoice.save();

      // Update inventory items with new stock and buying price
      try {
        await Promise.all(
          createDto.items.map(async (item) => {
            await Promise.all([
              this.inventoryService.updateStock(item.itemId, item.quantity),
              this.inventoryService.updateBuyingPrice(item.itemId, item.buyingPrice)
            ]);
          })
        );
      } catch (error) {
        // If inventory update fails, delete the created invoice
        await this.supplierInvoiceModel.findByIdAndDelete(savedInvoice._id);
        throw new BadRequestException(`Failed to update inventory: ${error.message}`);
      }

      return savedInvoice;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create invoice: ${error.message}`);
    }
  }

  async findAll(query: SupplierInvoiceQueryDto) {
    try {
      const { search, supplierId, status, startDate, endDate, isReconciled, page = 1, limit = 10 } = query;
      const filter: any = {};

      if (search) {
        filter.invoiceRef = { $regex: search, $options: 'i' };
      }
      if (supplierId) {
        filter.supplierId = supplierId;
      }
      if (status) {
        filter.status = status;
      }
      if (typeof isReconciled === 'boolean') {
        filter.isReconciled = isReconciled;
      }
      if (startDate || endDate) {
        filter.invoiceDate = {};
        if (startDate) filter.invoiceDate.$gte = startDate;
        if (endDate) filter.invoiceDate.$lte = endDate;
      }

      const skip = (page - 1) * limit;

      const [invoices, total] = await Promise.all([
        this.supplierInvoiceModel
          .find(filter)
          .populate({
            path: 'supplierId',
            select: 'name email phone address'
          })
          .populate({
            path: 'items',
            populate: {
              path: 'itemId',
              model: 'InventoryItem',
              select: 'name sku description category image barcode'
            }
          })
          .populate({
            path: 'createdBy',
            select: 'name email'
          })
          .populate({
            path: 'reconciledBy',
            select: 'name email'
          })
          .sort({ invoiceDate: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.supplierInvoiceModel.countDocuments(filter)
      ]);

      // Calculate statistics
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalVat = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0);
      const totalAdditionalTaxes = invoices.reduce((sum, inv) => 
        sum + (inv.additionalTaxes?.reduce((taxSum, tax) => taxSum + tax.amount, 0) || 0), 0);
      const invoicesByStatus = {
        pending: invoices.filter(inv => inv.status === 'pending').length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
      };

      return {
        invoices,
        statistics: {
          totalAmount,
          totalVat,
          totalAdditionalTaxes,
          invoicesByStatus,
          totalCount: total,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch invoices: ${error.message}`);
    }
  }

  async findById(id: string): Promise<SupplierInvoice> {
    try {
      const invoice = await this.supplierInvoiceModel
        .findById(id)
        .populate({
          path: 'supplierId',
          select: 'name email phone address'
        })
        .populate({
          path: 'items',
          populate: {
            path: 'itemId',
            model: 'InventoryItem',
            select: 'name sku description category image barcode'
          }
        })
        .populate({
          path: 'createdBy',
          select: 'name email'
        })
        .populate({
          path: 'reconciledBy',
          select: 'name email'
        })
        .exec();

      if (!invoice) {
        throw new NotFoundException(`Supplier invoice with ID ${id} not found`);
      }

      return invoice;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch invoice: ${error.message}`);
    }
  }

  async update(id: string, updateDto: UpdateSupplierInvoiceDto): Promise<SupplierInvoice> {
    try {
      const invoice = await this.supplierInvoiceModel.findById(id);
      if (!invoice) {
        throw new NotFoundException(`Supplier invoice with ID ${id} not found`);
      }

      // Validate status transition
      if (updateDto.status && updateDto.status !== invoice.status) {
        if (invoice.status === 'cancelled') {
          throw new BadRequestException('Cannot update a cancelled invoice');
        }
        if (invoice.status === 'paid' && updateDto.status !== 'cancelled') {
          throw new BadRequestException('Paid invoice can only be cancelled');
        }
      }

      // Validate reconciliation
      if (typeof updateDto.isReconciled !== 'undefined') {
        if (invoice.isReconciled && updateDto.isReconciled) {
          throw new BadRequestException('Invoice is already reconciled');
        }
        if (!updateDto.isReconciled && invoice.isReconciled) {
          throw new BadRequestException('Cannot un-reconcile an invoice');
        }
      }

      const updatedInvoice = await this.supplierInvoiceModel
        .findByIdAndUpdate(id, updateDto, { new: true })
        .populate({
          path: 'supplierId',
          select: 'name email phone address'
        })
        .populate({
          path: 'items',
          populate: {
            path: 'itemId',
            model: 'InventoryItem',
            select: 'name sku description category image barcode'
          }
        })
        .populate({
          path: 'createdBy',
          select: 'name email'
        })
        .populate({
          path: 'reconciledBy',
          select: 'name email'
        })
        .exec();

      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update invoice: ${error.message}`);
    }
  }
} 