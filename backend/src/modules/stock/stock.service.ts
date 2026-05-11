import { Injectable, Logger, NotFoundException, BadRequestException, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { Product } from '../products/product.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementType } from '../../common/enums/stock-movement-type.enum';
import { StockAlertService } from './stock-alert.service';

export interface BulkImportResult {
  total: number;
  processed: number;
  errors: { row: number; sku?: string; message: string }[];
}

interface CsvRow {
  sku?: string;
  quantity?: string;
  reason?: string;
  __line: number;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    @Optional() @Inject(forwardRef(() => StockAlertService))
    private readonly alerts?: StockAlertService,
  ) {}

  async getHistory(productId: string): Promise<StockMovement[]> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.movementRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async addMovement(productId: string, dto: CreateStockMovementDto): Promise<StockMovement> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const previousStock = product.stock;
    const delta = dto.type === StockMovementType.OUT ? -Math.abs(dto.quantity) : Math.abs(dto.quantity);
    const stockAfter = product.stock + delta;

    if (stockAfter < 0) {
      throw new BadRequestException(`Insufficient stock: current ${product.stock}, requested ${Math.abs(dto.quantity)}`);
    }

    const movement = await this.dataSource.transaction(async (manager) => {
      product.stock = stockAfter;
      await manager.save(Product, product);

      const m = manager.create(StockMovement, {
        productId,
        type: dto.type,
        quantity: dto.quantity,
        stockAfter,
        reason: dto.reason,
      });
      return manager.save(StockMovement, m);
    });

    // Best-effort instant alert (post-commit, errors swallowed inside the service)
    if (this.alerts) {
      void this.alerts.notifyIfNewlyOutOfStock(productId, previousStock, stockAfter);
    }
    return movement;
  }

  /**
   * Apply a batch of stock movements parsed from CSV. Each row matches a
   * product by SKU; positive `quantity` is credited as IN, negative as OUT.
   * Wraps the whole batch in a transaction so a single fatal error rolls
   * back everything; per-row errors (unknown SKU, bad number) are collected
   * and reported instead of aborting.
   */
  async bulkImport(csv: string, defaultReason = 'Import CSV'): Promise<BulkImportResult> {
    const rows = parseCsv(csv);
    if (rows.length === 0) throw new BadRequestException('Le fichier CSV est vide');

    const result: BulkImportResult = { processed: 0, errors: [], total: rows.length };

    await this.dataSource.transaction(async (manager) => {
      for (const row of rows) {
        const sku = (row.sku ?? '').trim();
        const qty = Number(row.quantity);
        const reason = (row.reason ?? defaultReason).trim() || defaultReason;

        if (!sku) {
          result.errors.push({ row: row.__line, message: 'SKU manquant' });
          continue;
        }
        if (!Number.isFinite(qty) || qty === 0) {
          result.errors.push({ row: row.__line, sku, message: 'Quantité invalide (nombre non nul attendu)' });
          continue;
        }

        const product = await manager.findOne(Product, { where: { sku } });
        if (!product) {
          result.errors.push({ row: row.__line, sku, message: `SKU "${sku}" introuvable` });
          continue;
        }

        const delta = qty;
        const stockAfter = product.stock + delta;
        if (stockAfter < 0) {
          result.errors.push({ row: row.__line, sku, message: `Stock final négatif (actuel ${product.stock})` });
          continue;
        }

        product.stock = stockAfter;
        await manager.save(Product, product);
        await manager.save(StockMovement, manager.create(StockMovement, {
          productId: product.id,
          type: delta > 0 ? StockMovementType.IN : StockMovementType.OUT,
          quantity: Math.abs(delta),
          stockAfter,
          reason,
        }));
        result.processed += 1;
      }
    });

    return result;
  }
}

/**
 * Tiny CSV parser tolerant to BOM, CRLF and quoted fields with commas.
 * Expects header row with at least `sku` and `quantity`. Optional `reason`.
 */
function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur); cur = '';
      } else { cur += ch; }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = splitRow(lines[0]).map((h) => h.toLowerCase());
  const skuIdx = header.indexOf('sku');
  const qtyIdx = header.indexOf('quantity');
  const reasonIdx = header.indexOf('reason');
  if (skuIdx < 0 || qtyIdx < 0) {
    throw new BadRequestException('En-tête CSV invalide — colonnes attendues : sku, quantity, [reason]');
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    rows.push({
      sku: cells[skuIdx],
      quantity: cells[qtyIdx],
      reason: reasonIdx >= 0 ? cells[reasonIdx] : undefined,
      __line: i + 1,
    });
  }
  return rows;
}
