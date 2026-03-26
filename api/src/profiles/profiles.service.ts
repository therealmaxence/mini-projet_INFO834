import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>
  ) {}

  async create(createProfileDto: CreateProfileDto) {
    return this.profileModel.create(createProfileDto);
  }

  async findAll() {
    return this.profileModel.find().exec();
  }

  async findBy(criteria: Partial<Profile>) {
    return this.profileModel.find(criteria).exec();
  }

  async findOne(id: string) {
    const profile = await this.profileModel.findById(id).exec();
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    return profile;
  }

  async findByWithPassword(criteria: Partial<Profile>) {
    return this.profileModel.find(criteria).select('+password').exec();
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileModel
      .findByIdAndUpdate(id, updateProfileDto, { new: true })
      .exec();
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    return profile;
  }

  async remove(id: string) {
    const profile = await this.profileModel.findByIdAndDelete(id).exec();
    if (!profile) throw new NotFoundException(`Profile #${id} not found`);
    return profile;
  }
}
