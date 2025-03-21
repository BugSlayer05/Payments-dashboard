import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';

export interface AccountSummary {
  account: string;
  balance: string;
  total_inflow: string;
  total_outflow: string;
}

export interface CategorySummary {
  inflow: Record<string, string>;
  outflow: Record<string, string>;
}

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getAccountSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<AccountSummary[]> {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select('tx.account', 'account')
      .addSelect(
        `SUM(CASE WHEN tx.type = 'inflow' THEN tx.amount ELSE 0 END)`,
        'total_inflow',
      )
      .addSelect(
        `SUM(CASE WHEN tx.type = 'outflow' THEN tx.amount ELSE 0 END)`,
        'total_outflow',
      )
      .addSelect('SUM(tx.amount)', 'balance')
      .groupBy('tx.account');

    if (startDate) qb.andWhere('tx.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('tx.date <= :endDate', { endDate });

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      account: r.account,
      balance: parseFloat(r.balance).toFixed(2),
      total_inflow: parseFloat(r.total_inflow).toFixed(2),
      total_outflow: parseFloat(r.total_outflow).toFixed(2),
    }));
  }

  async getCategorySummary(
    startDate?: string,
    endDate?: string,
  ): Promise<CategorySummary> {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select('tx.category', 'category')
      .addSelect('tx.type', 'type')
      .addSelect('SUM(tx.amount)', 'total')
      .groupBy('tx.category')
      .addGroupBy('tx.type');

    if (startDate) qb.andWhere('tx.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('tx.date <= :endDate', { endDate });

    const rows = await qb.getRawMany();

    const result: CategorySummary = { inflow: {}, outflow: {} };
    for (const row of rows) {
      const total = parseFloat(row.total).toFixed(2);
      if (row.type === TransactionType.INFLOW) {
        result.inflow[row.category] = total;
      } else {
        result.outflow[row.category] = total;
      }
    }
    return result;
  }
}
