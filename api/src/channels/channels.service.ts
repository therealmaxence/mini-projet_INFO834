import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { Role } from '../profiles/schemas/profile.schema';
import { Visibility } from './entities/channel.entity';
import { Channel, ChannelDocument } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name)
    private channelModel: Model<ChannelDocument>
  ) {}

  async create(owner: string, createChannelDto: CreateChannelDto) {
    return this.channelModel.create({
      ...createChannelDto,
      owner: new Types.ObjectId(owner),
    });
  }

  async findAll() {
    return this.channelModel.find().exec();
  }

  async findBy(criteria: Partial<Channel>) {
    return this.channelModel.find(criteria).exec();
  }

  async findVisible(id: string) {
    const profileId = new Types.ObjectId(id); 
    return this.channelModel.find({
      $or: [
        { owner: profileId },
        { members: { $in: [ profileId ] }},
        { visibility: Visibility.PUBLIC },
      ],
    }).exec();
  }

  async findOne(id: string) {
    const channel = await this.channelModel.findById(id).exec();
    if (!channel) throw new NotFoundException(`Channel #${id} not found`);
    return channel;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto) {
    const channel = await this.channelModel
      .findByIdAndUpdate(id, updateChannelDto, { new: true })
      .exec();
    if (!channel) throw new NotFoundException(`Channel #${id} not found`);
    return channel;
  }

  async remove(id: string) {
    const channel = await this.channelModel.findByIdAndDelete(id).exec();
    if (!channel) throw new NotFoundException(`Channel #${id} not found`);
    return channel;
  }

  isVisible(channel: Channel, user) : boolean {
      const userId = new Types.ObjectId(user._id);
      const hasAutority = this.hasAutority(channel, user)
      const isMember = channel.members.some((m) => m.equals(userId));
  
      return hasAutority || isMember;
    }
  
  hasAutority(channel: Channel, user) : boolean {
    const userId = new Types.ObjectId(user._id);
    const isOwner = channel.owner.equals(userId);
    const isAdmin = user.role === Role.ADMIN;

    return isOwner || isAdmin;
  }
}
