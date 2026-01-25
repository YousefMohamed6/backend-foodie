import { IsNumber, Min } from 'class-validator';

export class CreateTopUpDto {
    @IsNumber()
    @Min(1)
    amount: number;
}
