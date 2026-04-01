import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type ProfileDocument = HydratedDocument<Profile>;

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema()
export class Profile {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ required: true, enum: Role, default: Role.USER })
    role: Role;

    @Prop({ type: Date, required: true, default: Date.now })
    created: Date;

    @Prop({ type: Date, required: true, default: Date.now })
    updated: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.role = Role.USER;
});

ProfileSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as any;
  update.updated = Date.now();
  if (update?.role) { update.role = Role.USER }
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
});