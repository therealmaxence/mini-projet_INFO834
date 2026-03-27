import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateMessageDto {
    @ApiProperty({
        example: 'Hello world',
        required: false,
    })
    @IsOptional()
    @IsString()
    content?: string;
}
