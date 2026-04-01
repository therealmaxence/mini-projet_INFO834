import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { Visibility } from '../entities/channel.entity';

export class CreateChannelDto {
    @ApiProperty({ example: 'channel1' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: ['65f1c2e8a3b2c1a123456789'],
        required: false,
        description: 'Liste des IDs des membres',
    })
    @IsArray()
    @IsOptional()
    members?: Types.ObjectId[];

    @ApiProperty({
        enum: Visibility,
        example: Visibility.PRIVATE,
        required: false,
    })
    @IsEnum(Visibility)
    @IsOptional()
    visibility?: Visibility;
}
