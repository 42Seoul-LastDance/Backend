'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Drawer,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // 설정 아이콘 추가
import ChatSetting from './chatSetting';
import { RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChatMessage,
  ChattingPageProps,
  JoinStatus,
  SendMessageJson,
  receiveMessage,
} from '../../interface';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { setChatRoom, setJoin } from '@/app/redux/userSlice';
import { myAlert } from '../alert';
import { useRouter } from 'next/navigation';
import sendRequest from '@/app/api';
import { clearSocketEvent, registerSocketEvent } from '@/app/context/socket';
import { isValid } from '../valid';
import { maxTypeLength } from '@/app/globals';

const ChattingPage = (props: ChattingPageProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 설정 아이콘 클릭 시 설정창 표시 여부
  const dispatch = useDispatch();
  const chatRoom = useSelector((state: RootState) => state.user.chatRoom);
  const myName = useSelector((state: RootState) => state.user.userName);
  const listRef = useRef<HTMLDivElement | null>(null);
  const join = useSelector((state: RootState) => state.user.join);
  const router = useRouter();
  const friendName = useSelector((state: RootState) => state.dm.friendName);
  let target: string | undefined | null = undefined;
  const [mount, setMount] = useState<boolean>(false);

  join === JoinStatus.CHAT
    ? (target = chatRoom?.roomName)
    : (target = friendName);

  useEffect(() => {
    console.log('--------- chattingPage component ---------');
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;

    const e = [
      {
        event: 'sendMessage',
        once: true,
        callback: (data: ChatMessage) => {
          if (join === JoinStatus.CHAT)
            props.socket?.emit('receiveMessage', data);
          else if (
            // dm일때 target이랑 받아온 username이랑 다르면 안그림 (방어)
            join === JoinStatus.DM &&
            (data.userName === friendName || data.userName === myName)
          ) {
            // setChatMessages((prevMessages) => [...prevMessages, data]);
            setChatMessages([...chatMessages, data]);
          } else console.log('join이 CHAT도 아니고 DM도 아님.');
        },
      },
      {
        event: 'receiveMessage',
        once: true,
        callback: (data: receiveMessage) => {
          if (data.canReceive === false) return;

          let newMsg: ChatMessage = {
            userName: data.userName,
            content: data.content,
          };
          setChatMessages([...chatMessages, newMsg]);
          // setChatMessages((prevMessages) => [...prevMessages, newMsg]);
        },
      },
      {
        event: 'explodeRoom',
        callback: handleExitRoom,
      },
    ];
    registerSocketEvent(props.socket!, e);
    return () => {
      clearSocketEvent(props.socket!, e);
    };
  }, [join, chatMessages, mount]);

  useEffect(() => {
    if (join === JoinStatus.DM) prevDmMessages();
    else if (join === JoinStatus.CHAT) setChatMessages([]);
    // TODO : 채팅방 입장 -> 퇴장 -> 다시 입장 시 메시지 안 옴!
  }, [target]);

  // 기존 DM메시지 가져오기
  const prevDmMessages = async () => {
    const response = await sendRequest('get', `/DM/with/${friendName}`, router); // ChatMessages[] 로 올 예정
    setChatMessages(response.data);
  };

  // 메세지 보내기
  const SendMessage = () => {
    if (!inputMessage) return;

    props.socket?.emit('sendMessage', {
      roomName: target,
      userName: myName!,
      content: inputMessage,
      status: chatRoom?.status,
    });

    setInputMessage('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') SendMessage();
  };

  const toggleSettings = () => {
    props.socket?.emit('getMemberStateList', {
      roomName: chatRoom?.roomName,
      status: chatRoom?.status,
    });
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValid('메세지가', e.target.value + ' ⏎', maxTypeLength, dispatch))
      setInputMessage(e.target.value);
  };

  const handleExitRoom = () => {
    dispatch(setChatRoom(null));
    props.socket?.emit('exitChatRoom');
    myAlert('success', '채팅방을 나갔습니다', dispatch);
    dispatch(setJoin(JoinStatus.NONE));
  };

  return (
    <Container
      maxWidth="sm"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      {join === JoinStatus.CHAT && (
        <>
          <IconButton
            color="primary"
            aria-label="settings"
            sx={{ position: 'absolute', bottom: '16px', right: '20px' }}
            onClick={toggleSettings}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            color="primary"
            aria-label="quit"
            sx={{ position: 'absolute', bottom: '16px', right: '60px' }}
            onClick={handleExitRoom}
          >
            <DirectionsRunIcon />
          </IconButton>
          <Drawer anchor="right" open={isSettingsOpen} onClose={toggleSettings}>
            <ChatSetting />
          </Drawer>
        </>
      )}
      <Card
        className="mt-4"
        style={{
          height: '700px',
          width: '35rem',
          margin: 'auto',
          alignItems: 'center',
        }}
      >
        <CardContent
          style={{ overflowY: 'auto', height: 'calc(100% - 105px)' }}
        >
          {target}
          <List
            ref={listRef as React.RefObject<HTMLUListElement>}
            style={{ maxHeight: '550px', overflowY: 'auto' }}
          >
            {chatMessages?.map((msg, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={msg.userName} // undefined userName
                  secondary={msg.content}
                  style={{
                    textAlign: myName === msg.userName ? 'right' : 'left', // 방 폭파되고 undefined되어있는 이슈
                    paddingRight: '8px',
                    paddingLeft: '8px',
                  }}
                />
                <div
                  style={{
                    textAlign: myName === msg.userName ? 'left' : 'right',
                    fontSize: '12px',
                    color: 'gray',
                  }}
                ></div>
              </ListItem>
            ))}
          </List>
        </CardContent>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
          <TextField
            fullWidth
            id="msgText"
            variant="outlined"
            label="Message"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyDown}
          />
          <Button
            id="sendBtn"
            variant="contained"
            color="primary"
            size="large"
            onClick={SendMessage}
            style={{ marginLeft: '8px' }}
          >
            Send
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default ChattingPage;
