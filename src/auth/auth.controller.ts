import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/auth.dto';
import { CreateUserDto } from '../dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimit } from '../decorators/rate-limit.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit(10, 60) // 10 attempts per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    console.log('Login request received:', loginDto);
    try {
      const result = await this.authService.login(loginDto);
      console.log('Login successful:', result);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @RateLimit(10, 60)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() req) {
    await this.authService.logout(req.user.id, req.headers.authorization?.split(' ')[1]);
    return { message: 'Logged out successfully' };
  }
} 