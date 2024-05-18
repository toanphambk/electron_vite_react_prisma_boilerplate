import {onMainEventHandler} from '#preload';
import {CheckCircleOutlined, LoadingOutlined} from '@ant-design/icons';
import {message, Progress} from 'antd';
import React, {useEffect, useState} from 'react';

const ImportProgressMessage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileName, setFileName] = useState<string>('');
  const key = 'Import Progress';

  useEffect(() => {
    onMainEventHandler('image:saveProgress', (event, percent) => {
      setProgress(percent as number);
    });
    onMainEventHandler('record:save', (event, fileName) => {
      setFileName(fileName as string);
    });
  }, []);

  useEffect(() => {
    if (progress > 0) {
      messageApi.open({
        key,
        content: (
          <div className="">
            <div className="flex flex-row items-center mt-5 ml-10 mr-20 min-w-64">
              {progress != 100 ? (
                <LoadingOutlined className="text-green-500"></LoadingOutlined>
              ) : (
                <CheckCircleOutlined className="text-green-500"> </CheckCircleOutlined>
              )}
              <div className="ml-4 font-semibold">Import file : {fileName}.</div>
            </div>
            <Progress
              className="w-full my-5"
              percent={progress}
            />
          </div>
        ),
      });
    }
    return () => {
      setProgress(0);
    };
  }, [progress, fileName]);

  return <>{contextHolder}</>;
};

export default ImportProgressMessage;
