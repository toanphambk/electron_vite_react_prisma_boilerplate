import React, {useState, useCallback, useMemo} from 'react';
import {Popover, Image} from 'antd';
import {sendIPC} from '#preload';
import {Buffer} from 'buffer';
import {useAppSelector} from '../redux/hooks';

type ImagePopoverProps = {
  rowProps: React.HTMLAttributes<HTMLTableRowElement>;
};

const ImagePopOver: React.FC<ImagePopoverProps> = ({rowProps}) => {
  // Update the type of the component
  const [imageSrc, setImageSrc] = useState<string>('');
  const {hoverEntry} = useAppSelector(state => state.recordPageReducer);
  const {robotName, position, recordId} = hoverEntry;

  useMemo(() => {
    const getImage = async () => {
      if (robotName && position && recordId) {
        const image = await sendIPC({
          signalName: 'image:getOne',
          data: {robotName, position, recordId},
        });
        if (image && image.imageBuffer && robotName && position && recordId) {
          const buffer = Buffer.from(image.imageBuffer).toString('base64');
          const base64Image = `data:image/png;base64,${buffer}`;
          setImageSrc(base64Image);
          return;
        }
        setImageSrc('');
      }
    };
    getImage();
  }, [robotName, position, recordId]);

  const popoverContent = useCallback(
    () => (
      <Image
        src={imageSrc}
        alt="Image"
        loading="eager"
        preview={false}
        width={500}
      />
    ),
    [imageSrc],
  );

  return (
    <Popover
      mouseEnterDelay={0.3}
      content={popoverContent}
      placement="topRight"
      children={<tr {...rowProps} />}
    ></Popover>
  );
};

export default ImagePopOver;
