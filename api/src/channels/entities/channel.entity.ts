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

    @Prop({ type: Date, required: true, default: Date.now })
    created: Date;

    @Prop({ type: Date, required: true, default: Date.now })
    updated: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as any;
  update.updated = Date.now();
  this.setUpdate(update);
});

ChannelSchema.pre<mongoose.Query<any, Channel>>(['find', 'findOne'], async function () {
  this.populate('owner');
  this.populate('members');
});