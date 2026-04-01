import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMessageDto {
    @ApiProperty({
        example: '65f1c2e8a3b2c1a123456789',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    channel: Types.ObjectId;

    @ApiProperty({
        example: 'Hello world',
        required: false,
    })
    @IsOptional()
    @IsString()
    content?: string;
}
