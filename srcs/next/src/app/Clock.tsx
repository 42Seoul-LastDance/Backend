'use client'

import React, { useState, useEffect } from "react";

function Clock() {
    const [time, setTime] = useState(new Date());
    
    useEffect(() => {
        const intervalId = setInterval(() => {
        setTime(new Date()); // 1초마다 현재 시간으로 업데이트
        }, 1000);
    
        // 컴포넌트가 언마운트되면 setInterval 해제
        return () => clearInterval(intervalId);
    }, []);
    
    return (
        <div>
        <h2>Current Time:</h2>
        <p>{time.toLocaleTimeString()}</p>
        </div>
    );
}

export default Clock;