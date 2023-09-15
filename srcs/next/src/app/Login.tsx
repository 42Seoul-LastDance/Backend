import axios, { AxiosResponse } from 'axios';

const serverURL = 'http://10.12.4.3:3000'; // 서버 URL을 여기에 추가하세요.

export const requestLogin = async (email: string, pw: string): Promise<string | Record<string, any>> => {
  try {
    const response: AxiosResponse = await axios.post(
      `${serverURL}/42login/`,
      {
        email: email,
        password: pw,
      },
      { withCredentials: true }
    );

    // Token이 필요한 API 요청 시 header Authorization에 token을 추가합니다.
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.data);
      return "이메일 혹은 비밀번호를 확인하세요.";
    } else {
      console.error('네트워크 오류:', error.message);
      return "서버에 연결할 수 없습니다.";
    }
  }
};
