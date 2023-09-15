import React from 'react';
import axios from 'axios';

interface ButtonProps {
  onClick: () => void;
}

const LoginButton: React.FC<ButtonProps> = ({ onClick }) => {
  const handleClick = async () => {
    try {
      // Axios를 사용하여 서버로 GET 요청 보내기
      const response = await axios.get('https://10.12.4.3:3000'); // 서버의 실제 API URL로 변경하세요
      
      // 요청이 성공하면 응답 데이터를 출력
      console.log('서버 응답 데이터:', response.data);
      
      // 클릭 이벤트 핸들러 실행
      onClick();
    } catch (error) {
      // 요청이 실패한 경우 에러 처리
      console.error('서버 요청 실패:', error);
    }
  };

  return (
    <button onClick={handleClick}>Submit</button>
  );
};

export default LoginButton;
