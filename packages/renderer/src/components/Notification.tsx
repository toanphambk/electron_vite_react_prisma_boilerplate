import React, {useEffect} from 'react';
import {onMainEventHandler} from '#preload';
import {notification} from 'antd';

const Notification: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    onMainEventHandler('noti:error', (event, msg) => {
      api.error({
        message: msg as string,
        duration: 0,
      });
    });

    onMainEventHandler('noti:info', (event, msg) => {
      api.info({
        message: msg as string,
        duration: 0,
      });
    });
  }, []);

  return <>{contextHolder}</>;
};

export default Notification;
