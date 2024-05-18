import {Card, Button} from 'antd';
import React, {useEffect, useState} from 'react';
import {sendIPC} from '#preload';

const SettingCard: React.FC = () => {
  const [setting, setSetting] = useState<string>('');

  useEffect(() => {
    getSetting();
  }, []);

  const getSetting = async () => {
    const result = await sendIPC({signalName: 'setting:get'});
    if (result) {
      setSetting(result.recordDir);
    }
  };

  const settingSave = async () => {
    const _setting = await sendIPC({signalName: 'setting:save', data: setting});
    if (_setting) {
      console.log(_setting);
      setSetting(_setting.recordDir);
    }
  };

  return (
    <Card
      title="Setting"
      className="w-full"
    >
      <div className="flex flex-row items-center">
        <div className="w-full text-black">{setting}</div>

        <Button
          className="ml-4"
          onClick={() => settingSave()}
        >
          Setting
        </Button>
      </div>
    </Card>
  );
};

export default SettingCard;
