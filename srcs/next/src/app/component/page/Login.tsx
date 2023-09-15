import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../single/Button';

const Login: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 페이지 로드 시 토큰 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // JWT 토큰으로 서버 요청 보내기
  const sendRequestWithToken = async () => {
    try {
      // 클라이언트에서 저장한 토큰 사용
      const response = await axios.get('서버 API 엔드포인트', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('서버 응답 데이터:', response.data);
    } catch (error) {
      // 토큰이 만료되었거나 인증 실패한 경우
      console.error('서버 요청 실패:', error);
      setError('인증 실패');
    }
  };

  // 토큰 재발급 요청
  const refreshAuthToken = async () => {
    try {
      // 서버로 리프레시 토큰 전송
      const response = await axios.post('서버 리프레시 엔드포인트', {
        refreshToken: '리프레시 토큰',
      });

      // 새로운 JWT 토큰 저장
      const newToken = response.data.accessToken;
      setToken(newToken);

      // 로컬 스토리지에 저장 -> 추후 리덕스 스토어로 변경
      localStorage.setItem('jwtToken', newToken);

      // 이후에 원래 요청을 재시도
      sendRequestWithToken();
    } catch (error) {
      // 리프레시 토큰이 만료되었거나 인증 실패한 경우
      console.error('토큰 재발급 실패:', error);
      setError('토큰 재발급 실패');
    }
  };

  return (
    <div>
      {token ? (
        <div>
          <h2>인증 성공</h2>
          <Button onClick={sendRequestWithToken}>서버 요청 보내기</Button>
        </div>
      ) : (
        <div>
          <h2>로그인 페이지</h2>
          <Button onClick={refreshAuthToken}>토큰 재발급 요청</Button>
          {error && <p>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Login;
