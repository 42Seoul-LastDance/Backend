import {
    Controller,
    Get,
    Post,
    HttpStatus,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { FortytwoAuthGuard } from './fortytwo.guard';
import { UserService } from 'src/user/user.service';
// import { RegenerateJwtGuard } from './regenerate-auth.guard';
import { RegenerateAuthGuard } from './regenerateAuth.guard';
import { JwtAuthGuard } from './jwtAuth.guard';
import { MailService } from 'src/mail/mail.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private mailService: MailService,
    ) {}
    // * 1. 현재 클라이언트가 유효한 jwt 토큰을 가지고 있는지 확인 (메인 페이지에서)
    // * 2. 유효하지 않다면 `/42login`으로 보내서 oauth 인증 (로그인 페이지 -> 42 intra)
    // * 3. oauth 인증 후 해당 유저가 가입되어 있지 않으면 저장 (default 2fa : true)
    // * 4. 2fa:true 라면 nodemailer를 통해 2fa 인증
    // * 5. 2fa 인증 후 (or 가입되어 있는데 2fa:false 라면) 토큰과 함께 메인 페이지 리다이렉션

    @Get('login')
    @UseGuards(JwtAuthGuard)
    async login(@Res() res: Response) {
        // 프론트에 로그인  버튼 이랑  연결.
        // 이미 클라이언트가 유효한 access token(jwt)을 소유하고 있는지  -> front에서 메인페이지 접속 요청하면 확인 후 redirect
        //* @UseGuards(JwtAuthGuard) return true;인 경우 이 함수가 실행될거같아요
        // 아니라면 /auth/42login 이동 시켜서 로그인 or 회원가입
        // 소유하고 있다면 바로 메인으로 이동시키기
    }

    //로그인 관련 부분 남은 일
    //1. 2fa 연결 ======================= 오늘1
    //2. 신규 가입 페이지 연결 ======================= 오늘2
    //2-1. 이미지 파일 업로드 -> multer!  ========== 오늘 3

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

    @Get('require2fa')
    twofactorAuthentication(@Res() res: Response) {
        // 메일 보내기
        this.mailService.sendMail();
        res.status(HttpStatus.OK);
        return res.redirect('/');
    }

    @Get('requestJwt') // TODO :
    async requestJwt(@Req() req) {
        //TODO userInfoDto 와 함께 받아서
        //TODO 값이 있는 부분은 update하고, 2fa == true 인 경우 인증된 상태인지 함수로 확인 후
        //TODO jwt 발급
    }

    @Get('/42login')
    @UseGuards(FortytwoAuthGuard)
    async oauth42() {
        console.log('42 login called');
        return 'success';
    }

    @Get('/') // TODO 엔드포인트랑 함수 이름 고치기
    async tempsignUp() {
        //프론트에서 처음 회원 가입시 username, 2fa 정보를 받고 (메일 인증하기 버튼 클릭 -> 이 url로 옴.)
        //request 에
        return 'success';
    }

    @Get('/callback')
    @UseGuards(FortytwoAuthGuard)
    async callBack(@Req() req, @Res() res: Response) {
        console.log('42 callback 함수 호출');

        const { jwt, refreshToken } = await this.authService.signIn(req.user);
        res.cookie('access_token', jwt, {
            // httpOnly: true,
            maxAge: +process.env.COOKIE_MAX_AGE,
            sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
            secure: false,
        });

        res.cookie('refresh_token', refreshToken, {
            // httpOnly: true,
            // maxAge: +process.env.COOKIE_MAX_AGE,
            maxAge: 100000000, //테스트용으로 숫자 길게 맘대로 해둠
            sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
            secure: false,
        });

        res.status(HttpStatus.OK);
        // TODO: main page 로 redirect
        // return res.redirect('/auth/cookie-check');
        return res.redirect('/');
    }

    @Get('/regenerate-token')
    @UseGuards(RegenerateAuthGuard) //TODO Regenerate-jwt strategy bearer로 하는건지 확인 필요
    async regenerateToken(@Req() req, @Res() res) {
        const regeneratedToken = await this.authService.regenerateJwt(req);
        res.cookie('access_token', regeneratedToken, {
            // httpOnly: true,
            maxAge: +process.env.COOKIE_MAX_AGE,
            sameSite: true, //: Lax 옵션으로 특정 상황에선 요청이 전송되는 방식.CORS 로 가능하게 하자.
            secure: false,
        });
        res.status(HttpStatus.OK);
        return res.send();
    }

    @Get('cookie-check')
    checkCooke(@Req() req) {
        console.log(req);
    }

    @Get('/request-jwt')
    regenerateJwt(@Req() req) {
        return req;
    }

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
