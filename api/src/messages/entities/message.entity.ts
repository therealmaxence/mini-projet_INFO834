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
}

export const MessageSchema = SchemaFactory.createForClass(Message);