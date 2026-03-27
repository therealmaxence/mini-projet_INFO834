import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesModule } from './profiles/profiles.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongo-primary:27017,mongo-secondary:27017/?replicaSet=rs0'),
    ProfilesModule,
    AuthModule,
    ChannelsModule,
    MessagesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
