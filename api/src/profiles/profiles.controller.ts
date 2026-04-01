import { Controller, Get, Query, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Profile } from './schemas/profile.schema';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from './schemas/profile.schema';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll() {
    return this.profilesService.findAll();
  }

  @Get('search')
  findBy(@Query() criteria: Partial<Profile>) {
    return this.profilesService.findBy(criteria);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto, @Request() req) {
    if (req.user.sub._id != id && req.user.sub.role != Role.ADMIN) {
      throw new UnauthorizedException(`Not right user`)
    }
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.sub._id != id && req.user.sub.role != Role.ADMIN) {
      throw new UnauthorizedException(`Not right user`)
    }
    return this.profilesService.remove(id);
  }
}
