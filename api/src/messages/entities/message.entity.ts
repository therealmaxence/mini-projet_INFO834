import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type MessageDocument = mongoose.HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
}

@Schema()
export class Message {
    @Prop({
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    })
    owner: mongoose.Types.ObjectId;

    @Prop({
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
    })
    channel: mongoose.Types.ObjectId;

    @Prop({
        type: String,
        enum: MessageType,
        required: true,
    })
    type: MessageType;

    @Prop()
    content?: string;

    @Prop({
        type: {
            url: String,
            mimeType: String,
            size: Number,
            originalName: String,
        },
    })
    file?: {
        url: string;
        mimeType: string;
        size: number;
        originalName: string;
    };

    @Prop({ type: Date, required: true, default: Date.now })
    created: Date;

    @Prop({ type: Date, required: true, default: Date.now })
    updated: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as any;
  update.updated = Date.now();
  this.setUpdate(update);
});

MessageSchema.pre<mongoose.Query<any, Message>>(['find', 'findOne'], async function () {
  this.populate('owner');
  this.populate('channel');
});

MessageSchema.post('save', async function (doc, next) {
  await doc.populate('owner');
  await doc.populate('channel');
  next();
});

MessageSchema.pre<mongoose.Aggregate<any>>('aggregate', function () {
  this.pipeline().push(
    {
      $lookup: {
        from: 'profiles', // ou le nom de ta collection owner
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        'owner.password': 0,
      },
    },
    {
      $lookup: {
        from: 'channels',
        localField: 'channel',
        foreignField: '_id',
        as: 'channel',
      },
    },
    { $unwind: { path: '$channel', preserveNullAndEmptyArrays: true } }
  );
});