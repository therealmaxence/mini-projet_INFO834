import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../profiles/schemas/profile.schema';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@Body() createChannelDto: CreateChannelDto, @Request() req) {
    return this.channelsService.create(req.user.sub._id, createChannelDto);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.sub.role == Role.ADMIN)
      return this.channelsService.findAll();
    else
      return this.channelsService.findVisible(req.user.sub._id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const channel = await this.channelsService.findOne(id);
    const isVisible = this.channelsService.isVisible(channel, req.user.sub);

    if (!isVisible) {
      throw new UnauthorizedException('Not allowed to access this channel')
    }
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto, @Request() req) {
    const channel = await this.channelsService.findOne(id);
    const hasAutority = this.channelsService.hasAutority(channel, req.user.sub);

    if (!hasAutority) {
      throw new UnauthorizedException('Not allowed to modify this channel')
    }

    return this.channelsService.update(id, updateChannelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const channel = await this.channelsService.findOne(id);
    const hasAutority = this.channelsService.hasAutority(channel, req.user.sub);

    if (!hasAutority) {
      throw new UnauthorizedException('Not allowed to delete this channel')
    }

    return this.channelsService.remove(id);
  }
}