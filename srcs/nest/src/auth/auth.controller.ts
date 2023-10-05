import {
    Controller,
    Get,
    Post,
    HttpStatus,
    Req,
    Res,
    UseGuards,
    UnauthorizedException,
    Query,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { FortytwoAuthGuard } from './fortytwo.guard';
import { UserService } from 'src/user/user.service';
import { RegenerateAuthGuard } from './regenerateAuth.guard';
import { JwtAuthGuard } from './jwtAuth.guard';
import { Jwt2faGuard } from './jwt2fa.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}
    // * 1. 현재 클라이언트가 유효한 jwt 토큰을 가지고 있는지 확인 (메인 페이지에서)
    // * 2. 유효하지 않다면 `/42login`으로 보내서 oauth 인증 (로그인 페이지 -> 42 intra)
    // * 3. oauth 인증 후 해당 유저가 가입되어 있지 않으면 저장 (default 2fa : true)
    // * 4. 2fa:true 라면 nodemailer를 통해 2fa 인증
    // * 5. 2fa 인증 후 (or 가입되어 있는데 2fa:false 라면) 토큰과 함께 메인 페이지 리다이렉션

    //추가로 같이 했으면 하는 일
    //1. 파이프 관련 내용 ======================= 오늘 juhoh 정리예정
    //2. socket.io -> 게임 큐, 게임 진행, 채팅 DM

    //나눠서 할 일
    //1. 게임(socket.io 제외) + elo(수식 구현) + 게임 큐
    //2. 채팅룸(public, private, secret): 방장 나가면 터짐 (채팅 DM 제외)
    //3. DM: 대화내용 DB에 저장
    //4. 친구추가 및 유저 관련내용
    //5. 관리자(?)
    //6.

    @Get('/42login')
    @UseGuards(FortytwoAuthGuard)
    async oauth42() {
        console.log('42 login called');
        return 'success';
    }

    @Get('/callback')
    @UseGuards(FortytwoAuthGuard)
    async callBack(@Req() req, @Res() res: Response) {
        console.log('42 callback 함수 호출');

        //유저 검색해 신규 유저면 등록해줌 => 유저 리턴 (0912 작업 내용)
        const user = await this.authService.signUser(req.user);

        if (user.require2fa === true) {
            //TODO 2fa token 발급 후 메일 보내고 '2fa' 문자열 send
            res.status(HttpStatus.OK);
            const token = this.authService.generate2fa(user.id);
            res.cookie('2fa_token', token, {
                maxAge: +process.env.JWT_ENROLL_COOKIE_TIME, //테스트용으로 숫자 길게 맘대로 해둠: 3분
                // sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
                // secure: false,
            });

            //mail 보내기
            return res.status(200).json({
                message: '2fa',
            });
            return;
        }

        const { token, refreshToken } = this.authService.generateAuthToken(user);
        res.cookie('token', token, {
            maxAge: +process.env.JWT_ENROLL_COOKIE_TIME, //테스트용으로 숫자 길게 맘대로 해둠: 3분
            // sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
            // secure: false,
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: +process.env.JWT_ENROLL_COOKIE_TIME, //테스트용으로 숫자 길게 맘대로 해둠: 3분
            // sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
            // secure: false,
        });
        return res.status(200).json({
            message: 'success',
        });
    }

    @Get('verify2fa')
    @UseGuards(Jwt2faGuard)
    async verify2fa(@Req() req, @Query('code') code: string, @Res() res: Response) {
        const isAuthenticated = await this.userService.verifyUser2faCode(req.authDto.sub, code);
        if (isAuthenticated) {
            //jwt 발급 후 메인페이지 리다이렉트
            console.log('2fa verified, redirect to main page');
            this.authService.signjwtToken(res, req.authDto);
            res.clearCookie('2fa_token');
            return res.redirect(process.env.FRONT_URL + '/main');
        } else throw new UnauthorizedException('verify failed');
    }

    /* 
    ?requestJwt를 핸들러로 만들지 않는 방식으로 진행하면 어떨까요?
    42login, 2fa 확인 후에 바로 jwt 발급해주는걸로 하면 될거같아요
    그럼 /auth/requestJwt 에 직접 접근할 수 있는 방법이 없으니까 보안에도 좋을 것 같습니다.
    @Get('requestJwt') // TODO :
    // @UseGuard(JwtAccessGuard)    //TODO
    async requestJwt(@Req() req, @Res() res) {
        //TODO userInfoDto 와 함께 받아서
        //TODO 값이 있는 부분은 update하고, 2fa == true 인 경우 인증된 상태인지 함수로 확인 후
        //TODO jwt 발급

        // * requestJwt로 이사할 친구들
        // const { jwt, refreshToken } = await this.authService.signIn(req.user);
        // res.cookie('access_token', jwt, {
        //     // httpOnly: true,
        //     maxAge: +process.env.COOKIE_MAX_AGE,
        //     sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
        //     secure: false,
        // });

        // res.cookie('refresh_token', refreshToken, {
        //     // httpOnly: true,
        //     // maxAge: +process.env.COOKIE_MAX_AGE,
        //     maxAge: 100000000, //테스트용으로 숫자 길게 맘대로 해둠
        //     sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
        //     secure: false,
        // });
        // * ---------------------------

        res.status(HttpStatus.OK);
        // TODO: main page 로 redirect
        // return res.redirect('/auth/cookie-check');
        return res.redirect('/');
    }
    */

    //하기 함수 필요여부 확인 필요
    @Get('/') // TODO 엔드포인트랑 함수 이름 고치기
    async tempsignUp() {
        //프론트에서 처음 회원 가입시 username, 2fa 정보를 받고 (메일 인증하기 버튼 클릭 -> 이 url로 옴.)
        //request 에
        return 'success';
    }

    @Get('/regenerateToken')
    @UseGuards(RegenerateAuthGuard) //TODO Regenerate-jwt strategy bearer로 하는건지 확인 필요
    async regenerateToken(@Req() req, @Res() res) {
        this.authService.signRegeneratejwt(res, req);
        return res.send();
    }

    // @Get('cookie-check')
    // checkCooke(@Req() req) {
    //     console.log(req);
    // }

    @Post('/logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: any, @Res() res: Response) {
        console.log('logout called');
        await this.userService.removeRefreshToken(req.user);
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.send({
            message: 'logout success',
        });
    }
}
