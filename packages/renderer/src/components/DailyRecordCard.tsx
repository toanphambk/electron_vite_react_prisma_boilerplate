import type {TableProps} from 'antd';
import {Card, Button, Table} from 'antd';
import React, {useEffect, useState} from 'react';
import {sendIPC} from '#preload';
import type {DataEntry, Record} from '@prisma/client';
import {useDebouncedCallback} from 'use-debounce';

import {useAppDispatch} from '../redux/hooks';
import {setHoverEntry} from '../redux/UI/RecordPageSlice';
import ImagePopOver from './ImagePopOver';
import {DownloadOutlined} from '@ant-design/icons';

const getCurrentTime = () => {
  const currentDate = new Date();

  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);

  return {startOfDay, endOfDay};
};

const DailyRecordCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedRecord, setSelectedRecord] = useState<Record>({} as Record);
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [records, setRecord] = useState<Record[]>([]);

  const CustomRow: React.FC = props => {
    return <ImagePopOver rowProps={props}></ImagePopOver>;
  };

  useEffect(() => {
    getAllRecordsByTime();
    const interval = setInterval(() => {
      getAllRecordsByTime();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRecord?.id) {
      getDataEntries();
    }
  }, [selectedRecord]);

  const recordRowActions = (record: Record) => {
    return {
      onClick: () => {
        onRecordRowClick(record);
      },
    };
  };

  const debounceEntryHover = useDebouncedCallback((entry: DataEntry) => {
    dispatch(setHoverEntry(entry));
  }, 200);

  const entryRowActions = (entry: DataEntry) => {
    return {
      onMouseOver: async () => {
        debounceEntryHover(entry);
      },
    };
  };

  const onRecordRowClick = (record: Record) => {
    if (record.id === selectedRecord.id) {
      return;
    }
    setSelectedRecord(record);
  };

  const getAllRecordsByTime = async () => {
    try {
      const {startOfDay, endOfDay} = getCurrentTime();

      const query = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };

      const _records = await sendIPC({
        signalName: 'record:getAll',
        data: query,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecord(_records);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const getDataEntries = async () => {
    try {
      if (!selectedRecord.id) {
        console.log('No selected record');
        return;
      }
      setDataEntries([]);
      const _dataEntries = await sendIPC({
        signalName: 'dataEntry:getAll',
        data: {recordId: selectedRecord.id},
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      setDataEntries(_dataEntries);
    } catch (error) {
      console.log(error);
    }
  };

  const recordColumns: TableProps<Record>['columns'] = [
    {
      title: 'Part ID',
      dataIndex: 'partId',
      key: 'partId',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: createAt => new Date(createAt).toLocaleString(),
      sorter: (a, b) => Number(a.createdAt) - Number(b.createdAt),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      render: (text, record) => (
        <Button onClick={() => sendIPC({signalName: 'openExcel:ByID', data: record.id})}>
          {text}
        </Button>
      ),
    },
  ];

  const dataEntryColumns: TableProps<DataEntry>['columns'] = [
    {
      title: 'Robot',
      dataIndex: 'robotName',
    },
    {
      title: 'Position',
      dataIndex: 'position',
    },
    {
      title: 'Welding Point',
      dataIndex: 'weldingPoint',
    },
    {
      title: 'Vision Pro Result',
      dataIndex: 'visionProResult',
      render: visionProResult => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            visionProResult === 'OK' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {visionProResult}
        </div>
      ),
    },
    {
      title: 'Deep Learning Result',
      dataIndex: 'deepLearningResult',
      render: deepLearningReult => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            deepLearningReult === 'OK' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {deepLearningReult}
        </div>
      ),
    },
    {
      title: 'Overall Result',
      dataIndex: 'overallResult',
      render: overallResult => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            overallResult === 'OK' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {overallResult}
        </div>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'id',
      render: id => (
        <div className="flex items-center justify-center w-full">
          <DownloadOutlined
            onClick={() => sendIPC({signalName: 'iamge:saveToMachine', data: {id}})}
          />
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Record"
      className="w-full"
    >
      <Table
        onRow={recordRowActions}
        rowSelection={{
          hideSelectAll: true,
          selectedRowKeys: [selectedRecord.id],
          type: 'radio',
        }}
        dataSource={records}
        columns={recordColumns}
        rowKey={record => (record?.id ? record.id : '')}
        pagination={{pageSize: 5}}
        sortDirections={['descend', 'ascend']}
        rowClassName={'cursor-pointer font-semibold'}
        bordered
      />
      {selectedRecord.id && (
        <Table
          onRow={entryRowActions}
          loading={dataEntries.length === 0}
          dataSource={dataEntries}
          columns={dataEntryColumns}
          rowKey={dataEntry => (dataEntry?.id ? dataEntry.id : '')}
          sortDirections={['descend', 'ascend']}
          rowClassName={'cursor-pointer font-semibold'}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          components={{
            body: {
              row: CustomRow,
            },
          }}
          bordered
        />
      )}
    </Card>
  );
};

export default DailyRecordCard;
