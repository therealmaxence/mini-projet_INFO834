import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { MessageType } from './entities/message.entity';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Role } from '../profiles/schemas/profile.schema';
import { Visibility } from '../channels/entities/channel.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>
  ) {}

  async create(owner: string, createMessageDto: CreateMessageDto, file?: Express.Multer.File) {
    let metadata: any | undefined;
    let type = MessageType.TEXT;
    let content = createMessageDto?.content;

    if (file) {
      type = MessageType.FILE;
      content = file.originalname;
      metadata = await this.upload(file);
    }

    return this.messageModel.create({
      owner: new Types.ObjectId(owner),
      channel: new Types.ObjectId(createMessageDto.channel),
      type,
      content,
      file: metadata
    });
  }

  async findAll() {
    return this.messageModel.find().exec();
  }

  async findBy(criteria: Partial<Message>) {
    return this.messageModel.find(criteria).exec();
  }

  async findOne(id: string) {
    const message = await this.messageModel.findById(id).exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    return message;
  }

  async findAllLastMessageChannelVisible(id: string, role: string = Role.USER) {
    const profileId = new Types.ObjectId(id);

    const visibilityMatch = role === 'admin' ? {} : {
        $or: [
            { 'channelData.owner': profileId },
            { 'channelData.members': { $in: [profileId] } },
            { 'channelData.visibility': Visibility.PUBLIC },
        ],
    };

    return this.messageModel.aggregate([
        {
            $lookup: {
                from: 'channels',
                localField: 'channel',
                foreignField: '_id',
                as: 'channelData',
            },
        },
        {
            $unwind: '$channelData',
        },
        {
            $match: visibilityMatch,
        },
        {
            $sort: { created: -1 },
        },
        {
            $group: {
                _id: '$channel',
                lastMessage: { $first: '$$ROOT' },
            },
        },
        {
            $replaceRoot: { newRoot: '$lastMessage' },
        },
    ]);
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    const message = await this.messageModel
      .findByIdAndUpdate(id, updateMessageDto, { new: true })
      .exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    return message;
  }

  async remove(id: string) {
    const message = await this.messageModel.findByIdAndDelete(id).exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    if (message.type == MessageType.FILE) { await this.delete(message?.file?.url) }
    return message;
  }

  private upload(file?: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file?.originalname}`;
      const path = join(__dirname, '../../uploads', filename);

      const stream = createWriteStream(path);

      stream.on('error', reject);

      stream.on('finish', () => {
        resolve({
          originalName: file?.originalname,
          mimeType: file?.mimetype,
          size: file?.size,
          url: `/uploads/${filename}`,
        });
      });

      stream.end(file?.buffer);
    });
  }

  private async delete(url?: string) {
    const filename = url?.split('/uploads/')[1];
    const filePath = join(__dirname, '../../uploads', filename ?? '');
    try {
      await unlink(filePath);
    } catch (err) {
      console.warn('File not found or already deleted:', filePath);
    }
  }

  isOwner(message: Message, user) {
    const userId = new Types.ObjectId(user._id);
    const isOwner = message.owner.equals(userId);
    const isAdmin = user.role === Role.ADMIN;
    return isOwner || isAdmin;
  }
}