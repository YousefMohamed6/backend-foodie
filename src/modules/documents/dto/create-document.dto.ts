import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateDocumentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ enum: ['vendor', 'driver'] })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsBoolean()
    frontSide: boolean;

    @ApiProperty()
    @IsBoolean()
    backSide: boolean;


    @ApiProperty()
    @IsBoolean()
    expireAt: boolean;

    @ApiProperty()
    @IsBoolean()
    enable: boolean;
}
