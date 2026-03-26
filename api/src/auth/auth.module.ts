import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { jwtConstants } from './constants';

@Module({
  imports: [
    ProfilesModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: jwtConstants.signOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
