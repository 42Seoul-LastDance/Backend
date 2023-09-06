import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FortytwoAuthGuard } from './fortytwo.guard';
import { Auth42Dto } from './dto/auth42.dto';
import { UserService } from 'src/user/user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('authorization')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

    @ApiOperation({
        summary: '42 login API',
        description: '인트라 로그인 페이지로 리다이렉트 합니다.',
    })
    @Get('/42login')
    @UseGuards(FortytwoAuthGuard)
    async login() {
        //실패하면 이쪽으로 오나..?
        console.log('42 login called');
        return 'success';
    }

    @ApiOperation({
        summary: '42 login callback API',
        description:
            '인트라 로그인 후, 신규 유저인지 기존 유저인지 판별합니다.',
    })
    @Get('/callback')
    @UseGuards(FortytwoAuthGuard)
    async callBack() {
        console.log('callback 함수 호출');
        const loginUser: Auth42Dto = this.authService.getUserData();

        try {
            //등록된 유저의 경우 => main화면으로
            const user = await this.userService.getUserBySlackId(
                loginUser.login,
            );

            return user;
        } catch (error) {
            //신규 유저의 경우 => 회원가입 화면으로
            if (error.status == '404') return '신규 유저입니다';
            else return '잘못된 접근입니다';
        }
    }
}
