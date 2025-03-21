import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkTransactionsDto } from './dto/bulk-transactions.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest a single transaction (idempotent)' })
  createOne(@Body() dto: CreateTransactionDto) {
    return this.txService.createOne(dto);
  }

  @Post('bulk')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest transactions in bulk (idempotent)' })
  createBulk(@Body() dto: BulkTransactionsDto) {
    return this.txService.createBulk(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all transactions with optional filters' })
  @ApiQuery({ name: 'account', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2020-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2020-12-31' })
  findAll(
    @Query('account') account?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.txService.findAll(account, startDate, endDate);
  }
}
