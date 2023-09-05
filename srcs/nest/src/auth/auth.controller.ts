import {
    Controller,
    Get,
    Param,
    Request,
    Body,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FortytwoAuthGuard } from './fortytwo.guard';
import { Auth42Dto } from './dto/auth42.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) {}

    @Get('/42login')
    @UseGuards(FortytwoAuthGuard)
    async login() {
        console.log'42 login called')
        return 'success';
    }

    @Get('/callback')
    @UseGuards(FortytwoAuthGuard)
    async callBack() {
        console.log('callback 함수 호출');
        const loginUser: Auth42Dto = this.authService.getUserData();
        
        try {
            //등록된 유저의 경우 => main화면으로
            const user = await this.userService.getUserBySlackId(loginUser.login);
            
            return loginUser;
        } catch (error) {
            //신규 유저의 경우 => 회원가입 화면으로
            if (error.status == '404')
                return '신규 유저입니다';
            else
                return '잘못된 접근입니다';
            
        }
    }
}
