import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Request, UseGuards, UnauthorizedException, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, RolesGuard } from '../auth/auth.guard';
import { memoryStorage } from 'multer';
import { MessageType } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { ChannelsService } from '../channels/channels.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import * as express from 'express';
import { Role } from 'src/profiles/schemas/profile.schema';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage()}))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req
  ) {
    await this.channelsService.findOne(createMessageDto.channel.toString()); // Check if channel exists
    return this.messagesService.create(req.user.sub._id, createMessageDto, file);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.sub.role == Role.ADMIN)
      return this.messagesService.findAll();
    return this.messagesService.findBy({ owner: req.user.sub._id })
  }

  @Get('channel/:id')
  async findAllByChannel(@Param('id') id: string, @Request() req) {
    const channel = await this.channelsService.findOne(id);
    const isVisible = this.channelsService.isVisible(channel, req.user.sub);

    if (!isVisible) { throw new UnauthorizedException("Message not visible") }

    return this.messagesService.findBy({ channel: channel._id });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const message = await this.messagesService.findOne(id);
    const isVisible = this.channelsService.isVisible(message?.channel, req.user.sub);

    if (!isVisible) { throw new UnauthorizedException("Message not visible") }

    return message;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto, @Request() req) {
    const message = await this.messagesService.findOne(id);
    const isOwner = this.messagesService.isOwner(message,  req.user.sub);

    if (!isOwner) { throw new UnauthorizedException("You are not the owner") }

    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const message = await this.messagesService.findOne(id);
    const isOwner = this.messagesService.isOwner(message,  req.user.sub);

    if (!isOwner) { throw new UnauthorizedException("You are not the owner") }

    return this.messagesService.remove(id);
  }

  @Get('download/:id')
  async download(
    @Param('id') id: string,
    @Res() res: express.Response,
    @Request() req
  ) {
    const message = await this.messagesService.findOne(id);
    const isVisible = this.channelsService.isVisible(message?.channel, req.user.sub);

    if (!isVisible) { throw new UnauthorizedException("Message not visible") }
    if (message?.type != MessageType.FILE) { throw new NotFoundException('Not found file or not a file')}
    
    const filename = message?.file?.url.split('/uploads/')[1];
    const filePath = join(__dirname, '../../uploads', filename ?? '');

    const stream = createReadStream(filePath);
    res.set({
      'Content-Disposition': `attachment; filename="${message?.file?.originalName}"`,
      'Content-Type': message?.file?.mimeType,
    });
    stream.pipe(res);
  }
}
