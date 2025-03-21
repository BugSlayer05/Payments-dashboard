import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: jest.Mocked<Repository<Transaction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repo = module.get(getRepositoryToken(Transaction));
  });

  describe('createOne', () => {
    it('should create a valid inflow transaction', async () => {
      const dto: CreateTransactionDto = {
        reference: 'REF001',
        account: 'ACC001',
        date: '2020-01-01',
        amount: '100.00',
        type: TransactionType.INFLOW,
        category: 'salary',
      };
      const saved = { id: 'uuid', ...dto, amount: 100, createdAt: new Date() };
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(saved as any);
      repo.save.mockResolvedValue(saved as any);

      const result = await service.createOne(dto);
      expect(result).toEqual(saved);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('should create a valid outflow transaction', async () => {
      const dto: CreateTransactionDto = {
        reference: 'REF002',
        account: 'ACC001',
        date: '2020-01-05',
        amount: '-50.00',
        type: TransactionType.OUTFLOW,
        category: 'groceries',
      };
      const saved = { id: 'uuid', ...dto, amount: -50, createdAt: new Date() };
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(saved as any);
      repo.save.mockResolvedValue(saved as any);

      const result = await service.createOne(dto);
      expect(result).toEqual(saved);
    });

    it('should return existing transaction if reference already exists (idempotent)', async () => {
      const existing = {
        id: 'uuid',
        reference: 'REF001',
        amount: 100,
        type: TransactionType.INFLOW,
        createdAt: new Date(),
      } as Transaction;
      repo.findOne.mockResolvedValue(existing);

      const dto: CreateTransactionDto = {
        reference: 'REF001',
        account: 'ACC001',
        date: '2020-01-01',
        amount: '100.00',
        type: TransactionType.INFLOW,
        category: 'salary',
      };

      const result = await service.createOne(dto);
      expect(result).toEqual(existing);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should reject inflow with negative amount', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto: CreateTransactionDto = {
        reference: 'REF003',
        account: 'ACC001',
        date: '2020-01-01',
        amount: '-100.00',
        type: TransactionType.INFLOW,
        category: 'salary',
      };

      await expect(service.createOne(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject outflow with positive amount', async () => {
      repo.findOne.mockResolvedValue(null);
      const dto: CreateTransactionDto = {
        reference: 'REF004',
        account: 'ACC001',
        date: '2020-01-01',
        amount: '50.00',
        type: TransactionType.OUTFLOW,
        category: 'groceries',
      };

      await expect(service.createOne(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBulk', () => {
    it('should create multiple transactions and skip duplicates', async () => {
      const existingTx = { id: 'uuid1', reference: 'REF001' } as Transaction;
      repo.findOne
        .mockResolvedValueOnce(existingTx) // first is duplicate
        .mockResolvedValueOnce(null);       // second is new

      const newTx = { id: 'uuid2', reference: 'REF002' } as Transaction;
      repo.create.mockReturnValue(newTx as any);
      repo.save.mockResolvedValue(newTx as any);

      const result = await service.createBulk({
        transactions: [
          { reference: 'REF001', account: 'A', date: '2020-01-01', amount: '100', type: TransactionType.INFLOW, category: 'salary' },
          { reference: 'REF002', account: 'A', date: '2020-01-02', amount: '-50', type: TransactionType.OUTFLOW, category: 'groceries' },
        ],
      });

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors for invalid transactions without stopping', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.createBulk({
        transactions: [
          { reference: 'BAD', account: 'A', date: '2020-01-01', amount: '-100', type: TransactionType.INFLOW, category: 'salary' },
        ],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.created).toBe(0);
    });
  });
});
