import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty()
  name?: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // first_name?: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // last_name?: string;

  @IsNotEmpty()
  @ApiProperty()
  email?: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'password should be minimum 8' })
  @ApiProperty()
  password: string;

  @ApiProperty({
    type: String,
    example: 'user',
  })
  type?: string;

  @ApiProperty({
    type: String,
    example: '123456',
  })
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP should be 6 digits' })
  otp?: string;
}
