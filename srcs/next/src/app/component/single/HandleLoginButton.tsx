import React from 'react';
import { Link } from 'react-router-dom'; // React Router의 Link 컴포넌트를 import
import Button from './Button'; // LoginButton 컴포넌트 파일 경로에 맞게 수정하세요.

const HandleLoginButton = () => {
  const handleButtonClick = () => {
    // 원하는 링크로 이동합니다.
    window.location.href = 'https://google.com'; // 이동하고자 하는 링크로 변경하세요.
  };

  return (
    <div>
      <h1>My App</h1>
      <Button onClick={handleButtonClick} />
    </div>
  );
};

export default HandleLoginButton;
