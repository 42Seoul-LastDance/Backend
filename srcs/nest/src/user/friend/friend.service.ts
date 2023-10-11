import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user.service';
import { UserStatus } from '../user-status.enum';
import { FriendStatus } from './friend.enum';

@Injectable()
export class FriendService {
    constructor(
        @InjectRepository(Friend)
        private friendRepository: FriendRepository,
        private userService: UserService,
    ) {}

    async getFriendData(userId: number, friendId: number): Promise<Friend | null> {
        const query: Friend = await this.friendRepository
            .createQueryBuilder('friend')
            .where('(friend.requestUserId = :userId AND friend.targetUserId = :friendId)', { userId, friendId })
            .getOne();
        if (query) return query;

        const query2: Friend = await this.friendRepository
            .createQueryBuilder('friend')
            .where('(friend.requestUserId = :friendId AND friend.targetUserId = :userId)', { userId, friendId })
            .getOne();
        if (!query2) return null; // No matching friend record found
        return query2;
    }

    async getInvitations(userId: number) {
        try {
            const requestUserIds = await this.friendRepository
                .createQueryBuilder('friend')
                .select('friend.requestUserId')
                .where('friend.targetUserId = :userId', { userId })
                .andWhere('friend.status = :status', { status: FriendStatus.REQUESTED })
                .distinct(true)
                .getRawMany();

            return requestUserIds.map((result) => result.requestUserId);
        } catch (error) {
            console.error('Error retrieving requestUserIds:', error.message);
            return [];
        }
    }

    async getFriendList(userId: number): Promise<Array<{ username: string; status: UserStatus }>> {
        // { {friendName, friendStatus}, {,}, … } 형식 맞는지 확인
        const friendList: Array<{ username: string; status: UserStatus }> = [];

        console.log('userid', userId);
        let foundFriend: Friend[];

        try {
            foundFriend = await this.friendRepository.find({
                where: [{ requestUserId: userId }, { targetUserId: userId }],
            });

            console.log('foundFriend : ', foundFriend);

            for (const friend of foundFriend) {
                let friendData;
                if (userId === friend.requestUserId)
                    friendData = await this.userService.findUserById(friend.targetUserId);
                else friendData = await this.userService.findUserById(friend.requestUserId);
                console.log('{username, status:}', friendData);
                friendList.push({ username: friendData.userName, status: friendData.status });
                console.log('ppushed~~~~~~~~~');
            }
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> getFriendList');
        }
        console.log('friend list: ', friendList);
        return friendList;
    }

    async getFriendStatus(userId: number, friendName: string): Promise<FriendStatus> {
        try {
            const friendId = (await this.userService.getUserByUserName(friendName)).id;
            const data = await this.getFriendData(userId, friendId);
            if (!data) return FriendStatus.UNKNOWN;
            if (data.requestUserId === friendId && data.status === FriendStatus.REQUESTED) return FriendStatus.LAGGING;
            return data.status; //FRIEND, REQUESTED
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> getFriendStatus');
        }
    }

    async requestFriend(userId: number, friendName: string): Promise<string> {
        try {
            //친구 상태 확인
            const status = await this.getFriendStatus(userId, friendName);
            switch (status) {
                //요청한 적이 있거나 이미 친구이면 무시
                case FriendStatus.FRIEND:
                case FriendStatus.REQUESTED:
                    return;
                //상대방에게 요청 받은 적이 있으면 친구 수락
                case FriendStatus.LAGGING:
                    await this.acceptRequest(userId, friendName);
                    return;
                //기록 없을 경우 DB처리 진행
                case FriendStatus.UNKNOWN:
                    const friendId = (await this.userService.getUserByUserName(friendName)).id;
                    const newData = this.friendRepository.create({
                        requestUserId: userId,
                        targetUserId: friendId,
                        status: FriendStatus.REQUESTED,
                    } as Friend);
                    await this.friendRepository.save(newData);
                    return;
                default:
                    console.log('error >>> requestFriend >>> default');
            }
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> requestFriend');
        }
    }

    async deleteFriend(userId: number, friendName: string) {
        try {
            const friendId = (await this.userService.getUserByUserName(friendName)).id;
            const data = await this.getFriendData(userId, friendId);
            if (!data || data.status !== FriendStatus.FRIEND) return;
            await this.friendRepository.delete(data.id);
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> deleteFriend');
        }
    }

    async getInvitation(userId: number) {
        try {
            return await this.getInvitations(userId);
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> getInvitation');
        }
    }

    async acceptRequest(userId: number, friendName: string) {
        try {
            const status = await this.getFriendStatus(userId, friendName);
            if (status !== FriendStatus.LAGGING) return;

            const friendId = (await this.userService.getUserByUserName(friendName)).id;
            await this.friendRepository.update(
                { requestUserId: friendId, targetUserId: userId },
                { status: FriendStatus.FRIEND },
            );
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> acceptRequest');
        }
    }

    async declineRequest(userId: number, friendName: string) {
        try {
            const status = await this.getFriendStatus(userId, friendName);
            if (status !== FriendStatus.LAGGING) return;

            const friendId = (await this.userService.getUserByUserName(friendName)).id;
            const data = await this.getFriendData(userId, friendId);
            await this.friendRepository.delete(data.id);
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('friendService >> declineRequest');
        }
    }
}
