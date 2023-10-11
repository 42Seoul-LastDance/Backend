import { Body, Controller, Get, Param, ParseIntPipe, Put, Req, Res, UseGuards } from '@nestjs/common';
import { DirectMessageService } from './directMessage.service';
import { JwtAuthGuard } from 'src/auth/jwtAuth.guard';
import { UserService } from 'src/user/user.service';
import { DirectMessageInfoDto } from './dto/directMessageInfo.dto';

@Controller('DM')
export class DirectMessageController {
    constructor(
        private readonly directMessageService: DirectMessageService,
        private readonly userService: UserService,
    ) {}

    @Get('/with/:userName')
    @UseGuards(JwtAuthGuard)
    async getLoggedDMs(@Param('userName') userName: string, @Req() req, @Res() res) {
        const loggedDMs: DirectMessageInfoDto[] = await this.directMessageService.findRecentDMs(
            req.user.sub,
            userName,
            30,
        );
        return res.status(200).json(loggedDMs);
    }

    @Put('/send/:userName')
    @UseGuards(JwtAuthGuard)
    async sendMessage(@Param('userName') userName: string, @Body('content') content: string, @Req() req, @Res() res) {
        const receiverId: number = (await this.userService.getUserByUserName(userName)).id;
        await this.directMessageService.saveMessage(req.user.sub, receiverId, true, content);
        return res.status(200).send();
    }
}
