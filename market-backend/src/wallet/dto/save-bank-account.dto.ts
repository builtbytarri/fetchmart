import { IsNotEmpty, IsString } from 'class-validator';

export class SaveBankAccountDto {
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}
