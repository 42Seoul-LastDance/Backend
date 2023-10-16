'use client';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import { useDispatch } from 'react-redux';
import { useChatSocket } from '../../context/chatSocketContext';
import { ChatRoomDto, JoinStatus, RoomStatus } from '../../interface';
import { setChatRoom, setJoin } from '../../redux/userSlice';
import { clearSocketEvent, registerSocketEvent } from '@/app/context/socket';
import { isValid } from '../valid';
import { maxNameLength, maxPasswordLength, maxTypeLength } from '@/app/globals';

const CreateRoomForm = ({ onClose }: { onClose: () => void }) => {
  const chatSocket = useChatSocket();
  const dispatch = useDispatch();
  const [roomName, setRoomName] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [requirePassword, setIsLocked] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);

  useEffect(() => {
    console.log('--------- createRoomForm component ---------');
    const e = [
      {
        event: 'createChatRoom',
        callback: (data: ChatRoomDto) => {
          dispatch(setChatRoom(data));
          dispatch(setJoin(JoinStatus.CHAT));
          onClose();
        },
      },
    ];
    registerSocketEvent(chatSocket!, e);
    return () => {
      clearSocketEvent(chatSocket!, e);
    };
  }, []);

  const handleRoomNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setRoomName(inputValue);
  };

  const handlePrivacyChange = (
    event: React.MouseEvent<HTMLElement>,
    newPrivacy: string | null,
  ) => {
    if (newPrivacy !== null) {
      setIsPrivate(newPrivacy === 'private');
    }
  };

  const handlePasswordToggle = () => {
    setIsLocked(!requirePassword);
    setShowPasswordInput(!showPasswordInput);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const isBadInput = (): boolean => {
    if (
      isValid('방이름이', roomName, maxNameLength, dispatch) === false ||
      (requirePassword &&
        isValid('패스워드가', password, maxPasswordLength, dispatch) === false)
    )
      return true;
    return false;
  };

  const addNewRoom = () => {
    if (isBadInput()) return;

    chatSocket?.emit('createChatRoom', {
      roomName: roomName,
      password: password ? password : null,
      requirePassword: requirePassword,
      status: isPrivate ? RoomStatus.PRIVATE : RoomStatus.PUBLIC,
    });
  };

  return (
    <>
      <Box>
        <TextField
          required
          label="방 이름"
          variant="outlined"
          value={roomName}
          onChange={handleRoomNameChange}
          fullWidth
          margin="normal"
        />
        <ToggleButtonGroup
          value={isPrivate ? 'private' : 'public'}
          exclusive
          onChange={handlePrivacyChange}
          fullWidth
          aria-label="방 프라이버시"
        >
          <ToggleButton value="public" aria-label="퍼블릭">
            퍼블릭
          </ToggleButton>
          <ToggleButton value="private" aria-label="프라이빗">
            프라이빗
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButton
          value="check"
          selected={requirePassword}
          onClick={handlePasswordToggle}
          aria-label="비밀번호 설정"
          color="primary"
          size="small"
        >
          비밀번호 설정
        </ToggleButton>
        {showPasswordInput && (
          <TextField
            label="비밀번호"
            variant="outlined"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            fullWidth
            margin="normal"
          />
        )}
        <Button variant="contained" color="primary" onClick={addNewRoom}>
          완료
        </Button>
      </Box>
    </>
  );
};

export default CreateRoomForm;
