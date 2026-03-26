import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateProfileDto } from '../profiles/dto/create-profile.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() createProfileDto: CreateProfileDto ) {
        return this.authService.register(createProfileDto);
    }

    @Post('login')
    login(@Body() createProfileDto: CreateProfileDto ) {
        return this.authService.login(createProfileDto);
    }
}
