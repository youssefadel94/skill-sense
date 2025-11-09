import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class ExtractFromCvDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

export class ExtractFromGitHubDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ExtractFromLinkedInDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsUrl()
  @IsNotEmpty()
  profileUrl: string;
}
