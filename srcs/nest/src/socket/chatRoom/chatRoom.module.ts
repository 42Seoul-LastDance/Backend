import { Module } from '@nestjs/common';
import { ChatRoomGateway } from './chatRoom.gateway';
import { ChatRoomService } from './chatRoom.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { BlockedUsers } from 'src/user/blockedUsers/blockedUsers.entity';
import { BlockedUsersRepository } from 'src/user/blockedUsers/blockedUsers.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUsersModule } from 'src/user/blockedUsers/blockedUsers.module';
import { SocketUsersService } from '../socketUsersService/socketUsers.service';
import { SocketUsersModule } from '../socketUsersService/socketUsers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BlockedUsers]),
        TypeOrmModule.forFeature([BlockedUsersRepository]),
        UserModule,
        JwtModule,
        SocketUsersModule,
    ],
    providers: [ChatRoomGateway, ChatRoomService, SocketUsersService],
})
export class ChatRoomModule {}
