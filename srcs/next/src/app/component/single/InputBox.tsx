import React, { useState } from 'react';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ value, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="Enter text..."
      value={value}
      onChange={handleInputChange}
    />
  );
};

export default InputBox;