import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ChannelDocument = mongoose.HydratedDocument<Channel>;

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Schema()
export class Channel {
    @Prop({ required: true })
    name: string;

    @Prop({
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    })
    owner: mongoose.Types.ObjectId;

    @Prop({
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
      default: []
    })
    members: mongoose.Types.ObjectId[];

    @Prop({ enum: Visibility, default: Visibility.PRIVATE, required: true })
    visibility: Visibility;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);