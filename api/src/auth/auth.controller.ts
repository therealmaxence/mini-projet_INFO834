import { Body, Controller, Post, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateProfileDto } from '../profiles/dto/create-profile.dto';
import { AuthGuard } from './auth.guard';

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

    @Get('me')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    me(@Request() req) {
        const { password, ...profile } = req.user.sub;
        return profile;
    }
}
