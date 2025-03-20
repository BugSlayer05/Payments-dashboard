import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '!HorsePurpleHatRun9' })
  @IsString()
  @MinLength(8)
  password: string;
}
