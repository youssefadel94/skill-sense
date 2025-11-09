import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/profile.dto';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.createProfile(createProfileDto);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.profileService.getProfile(id);
  }

  @Get()
  async listProfiles() {
    return this.profileService.listProfiles();
  }

  @Delete(':id')
  async deleteProfile(@Param('id') id: string) {
    return this.profileService.deleteProfile(id);
  }
}
