import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
} from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkTransactionsDto } from './dto/bulk-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  private validateAmount(dto: CreateTransactionDto): void {
    const amount = parseFloat(dto.amount);
    if (dto.type === TransactionType.INFLOW && amount <= 0) {
      throw new BadRequestException(
        `Inflow transaction "${dto.reference}" must have a positive amount`,
      );
    }
    if (dto.type === TransactionType.OUTFLOW && amount >= 0) {
      throw new BadRequestException(
        `Outflow transaction "${dto.reference}" must have a negative amount`,
      );
    }
  }

  async createOne(dto: CreateTransactionDto): Promise<Transaction> {
    this.validateAmount(dto);

    // Idempotent: skip if reference already exists
    const existing = await this.txRepo.findOne({
      where: { reference: dto.reference },
    });
    if (existing) return existing;

    const tx = this.txRepo.create({
      ...dto,
      amount: parseFloat(dto.amount),
    });
    return this.txRepo.save(tx);
  }

  async createBulk(dto: BulkTransactionsDto): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const txDto of dto.transactions) {
      try {
        this.validateAmount(txDto);
        const existing = await this.txRepo.findOne({
          where: { reference: txDto.reference },
        });
        if (existing) {
          skipped++;
          continue;
        }
        const tx = this.txRepo.create({
          ...txDto,
          amount: parseFloat(txDto.amount),
        });
        await this.txRepo.save(tx);
        created++;
      } catch (err) {
        errors.push(`[${txDto.reference}]: ${err.message}`);
      }
    }

    return { created, skipped, errors };
  }

  async findAll(
    account?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Transaction[]> {
    const qb = this.txRepo.createQueryBuilder('tx');

    if (account) qb.andWhere('tx.account = :account', { account });
    if (startDate) qb.andWhere('tx.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('tx.date <= :endDate', { endDate });

    return qb.orderBy('tx.date', 'DESC').getMany();
  }
}
