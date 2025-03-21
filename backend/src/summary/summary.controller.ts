import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SummaryService } from './summary.service';

@ApiTags('Summary')
@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Account balance summary with optional date range' })
  @ApiQuery({ name: 'startDate', required: false, example: '2020-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2020-12-31' })
  getAccountSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.summaryService.getAccountSummary(startDate, endDate);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Category spend/income summary with optional date range' })
  @ApiQuery({ name: 'startDate', required: false, example: '2020-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2020-12-31' })
  getCategorySummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.summaryService.getCategorySummary(startDate, endDate);
  }
}
