import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateProfileDto {
    @ApiProperty({ example: 'john_doe' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'motdepasse123', minLength: 8 })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}
