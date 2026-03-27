import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateProfileDto } from '../profiles/dto/create-profile.dto';
import { Profile } from 'src/profiles/schemas/profile.schema';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
    constructor(
        private profilesService: ProfilesService,
        private jwtService: JwtService
    ) {}

    async register(createProfileDto: CreateProfileDto) {
        const profiles = await this.profilesService.findBy({ username: createProfileDto.username });
        if (profiles.length > 0) throw new ConflictException(`Un profil avec cet username existe déjà`);
        const profile = await this.profilesService.create(createProfileDto);
        return this.token(profile);
    }

    async login(createProfileDto: CreateProfileDto) {
        const profiles = await this.profilesService.findByWithPassword({ username: createProfileDto.username });
        if (profiles.length === 0) throw new UnauthorizedException(`Username ou mot de passe incorrect`);
        
        const profile = profiles[0];
        const verified = await bcrypt.compare(createProfileDto.password, profile.password);
        if (!verified) {
            throw new UnauthorizedException(`Username ou mot de passe incorrect`);
        }

        return this.token(profile);
    }

    async token(profile: Profile) {
        const payload = { sub: profile };
        const expiresIn = jwtConstants.signOptions.expiresIn;

        return {
            access_token: await this.jwtService.signAsync(payload),
            expiresIn: Math.floor(Date.now() / 1000) + expiresIn
        }
    }
}