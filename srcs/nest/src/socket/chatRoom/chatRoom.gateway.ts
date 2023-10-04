import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRoomService } from './chatRoom.service';
import { RoomInfoDto } from './dto/roominfo.dto';
import { JwtService } from '@nestjs/jwt';
@WebSocketGateway({
    port: 3000,
    cors: {
        origin: true,
        withCredentials: true,
    },
    transport: ['websocket'],
    namespace: 'RoomChat',
})
export class ChatRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private chatroomService: ChatRoomService,
        private jwtService: JwtService,
    ) {}

    @WebSocketServer()
    public server: Server;

    // * 커넥션 핸들링 ========================================================
    async handleConnection(socket: Socket) {
        // console.log('token: ', socket.handshake.query.token); // * 테스트용
        // console.log('token: ', socket.handshake.auth.token); // * 실 구현은 auth.token으로 전달 받기
        // const tokenString: string = socket.handshake.query.token as string;
        // try {
        //     const decodedToken = this.jwtService.verify(tokenString, {
        //         secret: process.env.JWT_SECRET_KEY,
        //     });
        //     await this.chatroomService.addNewUser(socket, 1507, this.server);
        // } catch (error) {
        //     socket.disconnect(true);
        //     return;
        // }
        console.log(socket.id, ': new connection.');
        socket.emit('connectSuccess');
    }

    handleDisconnect(socket: Socket) {
        const userId = this.chatroomService.getUserId(socket);
        console.log('disconnect userId : ', userId);
        this.chatroomService.leavePastRoom2(socket, this.server);
        this.chatroomService.deleteUser(socket);
        console.log(socket.id, ': lost connection.');
    }

    // * Getter ===========================================================
    @SubscribeMessage('getBlockUser')
    getBlockUser(socket: Socket) {
        const blockList = this.chatroomService.getUserBlockList(socket);
        socket.emit('getBlockUser', blockList);
    }

    @SubscribeMessage('getChatRoomList')
    getChatRoomList(socket: Socket) {
        // ”roomname”: string,
        // ”isLocked” : boolean,
        // ”status” : roomStatus,
        console.log('----------------------getChatRoomList');
        const chatRoomList = this.chatroomService.getChatRoomList();
        socket.emit('getChatRoomList', chatRoomList);
        // socket.emit('getChatRoomList', {'chatRoomList': {chatRoomList}});
        // Object.fromEntries(chatRoomList)
    }

    @SubscribeMessage('getChatRoomInfo')
    getChatRoomInfo(socket: Socket, payload: JSON) {
        // ”roomName”: string,
        // ”status” : roomStatus,
        const chatRoomInfo = this.chatroomService.getChatRoomInfo(payload['roomName'], payload['status']);
        socket.emit('getChatRoomInfo', chatRoomInfo);
        // Object.fromEntries(chatRoomList)
    }

    // * Message ===========================================================
    @SubscribeMessage('sendMessage')
    sendMessage(socket: Socket, payload: JSON): void {
        this.chatroomService.sendMessage(
            socket,
            payload['roomName'],
            payload['status'],
            payload['userName'],
            payload['content'],
        );
    }

    // * ChatRoom Method ===========================================================
    @SubscribeMessage('createChatRoom')
    createChatRoom(socket: Socket, payload: JSON) {
        // console.log('createChatRoom payload : ', payload);
        this.chatroomService.createChatRoom(socket, Object.assign(new RoomInfoDto(), payload), this.server);
        // * 프론트 요청 : create 후 새로 갱신된 리스트 전송
        const chatRoomList = this.chatroomService.getChatRoomList();
        this.server.emit('getChatRoomList', chatRoomList);
    }

    @SubscribeMessage('joinPublicChatRoom')
    joinPublicChatRoom(socket: Socket, payload: JSON) {
        this.chatroomService.joinPublicChatRoom(socket, payload['roomName'], payload['password'], this.server);
    }

    @SubscribeMessage('joinPrivateChatRoom')
    joinPrivateChatRoom(socket: Socket, payload: JSON) {
        this.chatroomService.joinPrivateChatRoom(socket, payload['roomName'], this.server);
    }

    // @SubscribeMessage('exitChatRoom')
    // exitChatRoom(socket: Socket, payload: JSON) {
    //     this.exitChatRoom(socket, payload['roomName']);
    // }

    // * 채팅방 패스워드 관련 =================================================
    @SubscribeMessage('setRoomPassword')
    setRoomPassword(socket: Socket, payload: JSON) {
        this.chatroomService.setRoomPassword(socket, payload['roomName'], payload['password']);
    }

    @SubscribeMessage('unsetRoomPassword')
    unsetRoomPassword(socket: Socket, payload: JSON) {
        this.chatroomService.unsetRoomPassword(socket, payload['roomName']);
    }

    // * Owner & Operator =====================================================
    @SubscribeMessage('grantUser')
    async grantUser(socket: Socket, payload: JSON) {
        await this.chatroomService.grantUser(socket, payload['roomName'], payload['roomStatus'], payload['targetName']);
    }

    @SubscribeMessage('ungrantUser')
    async ungrantUser(socket: Socket, payload: JSON) {
        await this.chatroomService.ungrantUser(
            socket,
            payload['roomName'],
            payload['roomStatus'],
            payload['targetName'],
        );
    }

    @SubscribeMessage('kickUser')
    async kickUser(socket: Socket, payload: JSON) {
        await this.chatroomService.kickUser(socket, payload['roomName'], payload['targetName'], this.server);
    }

    @SubscribeMessage('muteUser')
    async muteUser(socket: Socket, payload: JSON) {
        await this.chatroomService.muteUser(
            socket,
            payload['status'],
            payload['roomName'],
            payload['targetName'],
            payload['time'],
        );
    }

    @SubscribeMessage('banUser')
    async banUser(socket: Socket, payload: JSON) {
        this.chatroomService.banUser(socket, payload['roomName'], payload['roomStatus'], payload['targetName']);
    }

    @SubscribeMessage('unbanUser')
    async unbanUser(socket: Socket, payload: JSON) {
        this.chatroomService.unbanUser(socket, payload['roomName'], payload['roomStatus'], payload['targetName']);
    }

    // * Block & Unblock =======================================================

    @SubscribeMessage('blockUser')
    async blockUser(socket: Socket, payload: JSON) {
        this.chatroomService.blockUser(socket, payload['targetName']);
    }

    @SubscribeMessage('unBlockUser')
    async unBlockUser(socket: Socket, payload: JSON) {
        this.chatroomService.unBlockUser(socket, payload['targetName']);
    }

    @SubscribeMessage('inviteUser')
    async inviteUser(socket: Socket, payload: JSON) {
        await this.chatroomService.inviteUser(socket, payload['roomName'], payload['userName']);
    }
}
