import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    port: 3000,
    cors: {
        origin: true,
        withCredentials: true,
    },
    transport: ['websocket'],
    namespace: 'Game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private gameService: GameService,
        private jwtService: JwtService,
    ) {}

    @WebSocketServer()
    server: Server;

    async handleConnection(client: Socket) {
        const tokenString: string = client.handshake.auth.token as string;
        try {
            if (!tokenString) throw new Error('jwt is empty.');
            const decodedToken = this.jwtService.verify(tokenString, {
                secret: process.env.JWT_SECRET_KEY,
            });
            await this.gameService.createPlayer(client, decodedToken.sub);
        } catch (error) {
            console.log('error : ', error.message);
            if (error.message === 'jwt expired') {
                client.emit('expireToken');
            }
            client.disconnect(true);
            return;
        }
        console.log(client.id, ': new connection. (Game)');
    }

    async handleDisconnect(client: Socket) {
        await this.gameService.handleDisconnect(client.id);
        this.gameService.deletePlayer(client.id);
        console.log(client.id, ': lost connection. (Game)');
    }

    //* Match Game ======================================
    //매칭게임요청 -> 큐 등록 or waitRoom 등록
    @SubscribeMessage('pushQueue')
    async pushQueue(client: Socket, clientInfo: JSON) {
        //TESTCODE
        console.log('pushQueue:', client.id);
        await this.gameService.pushQueue(client.id, +clientInfo['gameMode']);
    }

    //큐에 있던 플레이어 나감
    @SubscribeMessage('popQueue')
    async popQueue(client: Socket) {
        //TESTCODE
        // console.log('popQueue:', client.id);
        await this.gameService.popQueue(client.id);
    }

    //* Friend Game ======================================
    @SubscribeMessage('inviteGame')
    async inviteGame(client: Socket, gameInfo: JSON) {
        await this.gameService.inviteGame(client.id, +gameInfo['gameMode'], gameInfo['friendName']);
    }

    @SubscribeMessage('agreeInvite')
    async agreeInvite(client: Socket, gameInfo: JSON) {
        await this.gameService.agreeInvite(client.id, gameInfo['friendName']);
    }

    @SubscribeMessage('denyInvite')
    denyInvite(client: Socket, gameInfo: JSON) {
        this.gameService.denyInvite(client.id, gameInfo['friendName']);
    }

    //* Game Room ======================================
    @SubscribeMessage('getReady')
    getReady(client: Socket) {
        //TESTCODE
        // console.log('getReady:', client.id);
        this.gameService.getReady(client.id);
    }

    //* In Game ======================================
    //패들 움직임, 상대에게 패들위치 전달
    @SubscribeMessage('movePaddle')
    movePaddle(client: Socket, gameInfo: JSON) {
        this.gameService.movePaddle(client.id, gameInfo);
    }

    //validCheck
    @SubscribeMessage('validCheck')
    async validCheck(client: Socket, gameInfo: JSON) {
        //TESTCODE
        // console.log('validCheck:', client.id);
        await this.gameService.validCheck(client.id, gameInfo);
    }

    @SubscribeMessage('ballHit')
    async ballHit(client: Socket, gameInfo: JSON) {
        //TESTCODE
        // console.log('ballHit:', client.id);
        await this.gameService.ballHit(client.id, gameInfo);
    }

    //emoji send
    @SubscribeMessage('sendEmoji')
    sendEmoji(client: Socket, emoji: string) {
        this.gameService.sendEmoji(client.id, emoji['type']);
    }

    @SubscribeMessage('outGame')
    async outGame(client: Socket) {
        await this.gameService.outGame(client.id);
    }
}
