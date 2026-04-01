import { SetMetadata, CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { Role } from '../profiles/schemas/profile.schema';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) { throw new UnauthorizedException(); }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch { throw new UnauthorizedException(); }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user?.sub?.role === role);
    
    if (!hasRole) throw new ForbiddenException('Accès refusé : rôle insuffisant');

    return true;
  }
}