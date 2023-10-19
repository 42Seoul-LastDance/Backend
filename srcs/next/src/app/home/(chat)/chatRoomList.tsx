'use client';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CreateRoomButton from './createRoomButton';
import { useChatSocket } from '../../context/chatSocketContext';
import {
  ChatRoomDto,
  EmitResult,
  Events,
  GetChatRoomListJSON,
  JoinStatus,
} from '../../interface';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDispatch } from 'react-redux';
import { setChatRoom, setJoin } from '../../redux/userSlice';
import { isValid } from '../valid';
import { myAlert } from '../alert';
import { clearSocketEvent, registerSocketEvent } from '@/app/context/socket';
import { useEffect, useState } from 'react';
import { Grow, ListItemIcon } from '@mui/material';
import { maxPasswordLength } from '@/app/globals';
import LockIcon from '@mui/icons-material/Lock';
import CreateRoomForm from './createRoomForm';
const ChatRoomList: React.FC = () => {
  const chatRoom = useSelector((state: RootState) => state.user.chatRoom);
  const chatSocket = useChatSocket();
  const dispatch = useDispatch();
  const roomList = useSelector((state: RootState) => state.room.roomList);
  const join = useSelector((state: RootState) => state.user.join);
  const [click, setClick] = useState<boolean>(false);

  useEffect(() => {
    const e: Events[] = [
      {
        event: 'getChatRoomInfo',
        callback: (data: ChatRoomDto) => {
          dispatch(setChatRoom(data));
        },
      },
      {
        event: 'joinPublicChatRoom',
        once: true,
        callback: (data: EmitResult) => {
          setClick(false);
          if (data.result === true) {
            dispatch(setJoin(JoinStatus.CHAT));
            myAlert('success', data.reason, dispatch);
          } else {
            // 밴 당했을 때, 비밀번호 틀렸을 때, (서버 자료구조에 이상이 있을 때, 서버한테 데이터 잘 못 보냈을 때)
            // if (join !== JoinStatus.CHAT) dispatch(setJoin(JoinStatus.NONE));
            myAlert('error', data.reason, dispatch);
          }
        },
      },
    ];
    registerSocketEvent(chatSocket!, e);
    return () => {
      clearSocketEvent(chatSocket!, e);
    };
  }, [join, chatRoom, click]);

  const joinRoom = (room: GetChatRoomListJSON) => {
    setClick(true);
    let password;
    if (room.requirePassword) {
      password = prompt(); // 비밀번호 비동기 입력
      if (!isValid('비밀번호가', password!, maxPasswordLength, dispatch))
        return;
    }
    chatSocket!.emit('joinPublicChatRoom', {
      roomName: room.roomName,
      password: password ? password : null,
    });
  };

  return (
    <>
      <List aria-label="ChatRoom-List">
        {roomList.map((room: GetChatRoomListJSON, rowIdx: number) => {
          return room.roomName !== chatRoom?.roomName ? (
            <Grow in={true} key={room.roomName} timeout={1000}>
              <ListItem
                divider
                onClick={() => joinRoom(room)}
                className="list-item"
              >
                <ListItemText primary={`${room.roomName}`} />
                {room.requirePassword ? (
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                ) : null}
              </ListItem>
            </Grow>
          ) : null;
        })}
      </List>
      <CreateRoomForm />
    </>
  );
};
export default ChatRoomList;
