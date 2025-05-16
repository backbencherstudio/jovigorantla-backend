import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, MinLength } from 'class-validator';

export class VerifyOtpDto {

  @IsNotEmpty()
  @ApiProperty()
  email?: string;

  @ApiProperty({
    type: String,
    example: '123456',
  })
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP should be 6 digits' })
  otp?: string;
}
