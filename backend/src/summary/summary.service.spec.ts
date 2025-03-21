import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SummaryService } from './summary.service';
import { Transaction } from '../transactions/entities/transaction.entity';

const mockQueryBuilder = (rows: any[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

describe('SummaryService', () => {
  let service: SummaryService;

  const mockRows = [
    { account: 'C00099', total_inflow: '2500.72', total_outflow: '-761.85', balance: '1738.87' },
    { account: 'S00012', total_inflow: '150.72', total_outflow: '0.00', balance: '150.72' },
  ];

  const mockCategoryRows = [
    { category: 'salary', type: 'inflow', total: '2500.72' },
    { category: 'savings', type: 'inflow', total: '150.72' },
    { category: 'groceries', type: 'outflow', total: '-51.13' },
    { category: 'rent', type: 'outflow', total: '-560.00' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            createQueryBuilder: jest
              .fn()
              .mockReturnValueOnce(mockQueryBuilder(mockRows))
              .mockReturnValueOnce(mockQueryBuilder(mockCategoryRows)),
          },
        },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
  });

  it('should return account summary', async () => {
    const result = await service.getAccountSummary();
    expect(result).toHaveLength(2);
    expect(result[0].account).toBe('C00099');
    expect(result[0].balance).toBe('1738.87');
    expect(result[0].total_inflow).toBe('2500.72');
    expect(result[0].total_outflow).toBe('-761.85');
  });

  it('should return category summary grouped by inflow/outflow', async () => {
    const result = await service.getCategorySummary();
    expect(result.inflow['salary']).toBe('2500.72');
    expect(result.inflow['savings']).toBe('150.72');
    expect(result.outflow['groceries']).toBe('-51.13');
    expect(result.outflow['rent']).toBe('-560.00');
  });
});
