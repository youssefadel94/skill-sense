import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractFromCvDto {
  @ApiProperty({
    description: 'User ID to associate the extracted skills with',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'URL to CV file (optional if file is uploaded)',
    example: 'https://example.com/resume.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}

export class ExtractFromGitHubDto {
  @ApiProperty({
    description: 'User ID to associate the extracted skills with',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'GitHub username',
    example: 'octocat',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ExtractFromLinkedInDto {
  @ApiProperty({
    description: 'User ID to associate the extracted skills with',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://www.linkedin.com/in/username',
  })
  @IsUrl()
  @IsNotEmpty()
  profileUrl: string;
}
