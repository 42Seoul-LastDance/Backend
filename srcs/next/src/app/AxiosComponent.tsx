import React, { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';

interface AxiosComponentProps {
  url: string;
}

const AxiosComponent: React.FC<AxiosComponentProps> = ({ url }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Axios를 사용하여 서버에서 데이터를 가져옵니다.
    axios.get(url)
      .then((response: AxiosResponse) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, [url]);

  return (
    <div>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          <h2>Fetched Data</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AxiosComponent;
