'use client';

import { useState, useEffect, useCallback } from 'react';
// import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { RootState } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  setAlreadyPlayed,
  setIsMatchInProgress,
  setIsMatched,
  setNames,
  setCustomSet,
} from '../redux/matchSlice';
import { useGameSocket } from '../contexts/gameSocketContext';
import { ReactUnityEventParameter } from 'react-unity-webgl/distribution/types/react-unity-event-parameters';
import EmojiButtons from './emojiButtons';
import UserPannel from './userPannel';
import {
  PlayerSide,
  Emoji,
  GameJoinMode,
  GameEndStatus,
  GameMode,
} from '../enums';
import { setEmoji } from '../redux/matchSlice';
import { useRouter } from 'next/navigation';
import { GameOverJson, SendEmojiJson, StartGameJson } from '../interfaces';
import { Button } from '@mui/material';

const Game = () => {
  const { unityProvider, sendMessage, addEventListener, removeEventListener } =
    useUnityContext({
      loaderUrl: '/build/Pong.loader.js',
      dataUrl: '/build/Pong.data.unityweb',
      frameworkUrl: '/build/Pong.framework.js.unityweb',
      codeUrl: '/build/Pong.wasm.unityweb',
    });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const dispatch = useDispatch();
  const customSet = useSelector((state: RootState) => state.match.customSet);
  const socket = useGameSocket();
  const router = useRouter();
  var mySide: PlayerSide = PlayerSide.NONE;

  // react to unity
  const Init = () => {
    setIsReady(false);
    if (!socket?.hasListeners('startGame')) {
      socket?.on('startGame', (json: StartGameJson) => {
        if (json.isFirst) mySide = json.side;
        setIsPlaying(true);
        dispatch(
          setNames({
            leftName: json.leftName,
            rightName: json.rightName,
          }),
        );
        sendMessage('GameManager', 'StartGame', JSON.stringify(json));
      });
    }
    if (!socket?.hasListeners('movePaddle')) {
      socket?.on('movePaddle', (json: JSON) => {
        if (mySide === PlayerSide.LEFT)
          sendMessage(
            'RightPaddle',
            'MoveOpponentPaddle',
            JSON.stringify(json),
          );
        else if (mySide === PlayerSide.RIGHT)
          sendMessage('LeftPaddle', 'MoveOpponentPaddle', JSON.stringify(json));
        else
          console.log(
            'err : movePaddle event detected but, player side is NONE',
          );
      });
    }
    if (!socket?.hasListeners('gameOver')) {
      socket?.on('gameOver', (json: GameOverJson) => {
        sendMessage('GameManager', 'GameOver', JSON.stringify(json));
        setIsPlaying(false);
        if (
          (customSet.joinMode === GameJoinMode.CUSTOM_RECV ||
            customSet.joinMode === GameJoinMode.CUSTOM_SEND) &&
          json.reason !== GameEndStatus.DISCONNECT
        )
          setIsReady(false);
      });
    }
    if (!socket?.hasListeners('ballHit')) {
      socket?.on('ballHit', (json: JSON) => {
        sendMessage('Ball', 'SynchronizeBallPos', JSON.stringify(json));
      });
    }
  };

  const handleUnityException = useCallback((data: ReactUnityEventParameter) => {
    alert('Unity Exception : ' + data);
  }, []);
  const handleValidCheck = useCallback((data: ReactUnityEventParameter) => {
    socket?.emit('validCheck', JSON.parse(data as string));
  }, []);
  const handleMovePaddle = useCallback((data: ReactUnityEventParameter) => {
    socket?.emit('movePaddle', JSON.parse(data as string));
  }, []);
  const handleBallHit = useCallback((data: ReactUnityEventParameter) => {
    socket?.emit('ballHit', JSON.parse(data as string));
  }, []);
  const handleBlur = () => {
    socket?.emit('outGame');
  };

  // unity to react
  useEffect(() => {
    addEventListener('Init', Init);
    addEventListener('MovePaddle', handleMovePaddle);
    addEventListener('ValidCheck', handleValidCheck);
    addEventListener('BallHit', handleBallHit);
    addEventListener('UnityException', handleUnityException);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleBlur);

    return () => {
      removeEventListener('Init', Init);
      removeEventListener('MovePaddle', handleMovePaddle);
      removeEventListener('ValidCheck', handleValidCheck);
      removeEventListener('BallHit', handleBallHit);
      removeEventListener('UnityException', handleUnityException);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleBlur);
    };
  }, [
    window.removeEventListener,
    window.addEventListener,
    handleBlur,
    addEventListener,
    removeEventListener,
    handleUnityException,
    handleValidCheck,
    handleMovePaddle,
    Init,
    handleBallHit,
  ]);

  useEffect(() => {
    dispatch(
      setNames({
        leftName: '???',
        rightName: '???',
      }),
    );

    return () => {
      dispatch(setIsMatchInProgress({ isMatchInProgress: false }));
      dispatch(setAlreadyPlayed({ alreadyPlayed: true }));
      dispatch(
        setCustomSet({
          joinMode: GameJoinMode.MATCH,
          gameMode: GameMode.NONE,
          opponentName: undefined,
          opponentSlackId: undefined,
        }),
      );
    };
  }, []);

  if (!socket?.hasListeners('sendEmoji')) {
    socket?.on('sendEmoji', (json: SendEmojiJson) => {
      if (json.type === Emoji.HI) {
        dispatch(setEmoji({ emoji: '/emoji/emoji_HI.png' }));
      } else if (json.type === Emoji.THUMBUP)
        dispatch(setEmoji({ emoji: '/emoji/emoji_THUMBUP.png' }));
      else if (json.type === Emoji.FANFARE)
        dispatch(setEmoji({ emoji: '/emoji/emoji_FANFARE.png' }));
      else if (json.type === Emoji.TONGUE)
        dispatch(setEmoji({ emoji: '/emoji/emoji_TONGUE.png' }));
      else if (json.type === Emoji.SUNGLASSES)
        dispatch(setEmoji({ emoji: '/emoji/emoji_SUNGLASSES.png' }));
      else if (json.type === Emoji.BADWORDS)
        dispatch(setEmoji({ emoji: '/emoji/emoji_BADWORDS.png' }));
      else if (json.type === Emoji.WITCH)
        dispatch(setEmoji({ emoji: '/emoji/emoji_witch.png' }));
      if (timeoutId) clearTimeout(timeoutId);
      const newTimeoutId = setTimeout(() => {
        dispatch(setEmoji({ emoji: '' }));
      }, 2000);
      setTimeoutId(newTimeoutId);
    });
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <div style={containerStyle}>
        <UserPannel screenSide={PlayerSide.LEFT} />
        <Unity
          unityProvider={unityProvider}
          style={{ width: 1024, height: 576, minWidth: 1024, minHeight: 576 }}
        />
        <UserPannel screenSide={PlayerSide.RIGHT} />
      </div>

      <EmojiButtons />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            borderRadius: '15px',
          }}
          onClick={() => {
            setIsReady(true);
            socket?.emit('getReady');
          }}
          disabled={isReady}
        >
          Get Ready
        </Button>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            borderRadius: '15px',
          }}
          onClick={() => {
            dispatch(setIsMatched({ isMatched: false }));
            dispatch(setIsMatchInProgress({ isMatchInProgress: false }));
            socket?.disconnect();
            router.push('/home');
          }}
          disabled={isPlaying}
        >
          Exit Room
        </Button>
      </div>
    </>
  );
};

export default Game;
