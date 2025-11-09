import { IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SearchSkillsDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
