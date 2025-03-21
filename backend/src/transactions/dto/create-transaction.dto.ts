import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsNumberString,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ example: '000051' })
  @IsString()
  reference: string;

  @ApiProperty({ example: 'S00099' })
  @IsString()
  account: string;

  @ApiProperty({ example: '2020-01-13' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '-51.13' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.OUTFLOW })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 'groceries' })
  @IsString()
  category: string;
}
