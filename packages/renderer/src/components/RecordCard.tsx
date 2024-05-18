import type {TableProps} from 'antd';
import {Card, Input, Button, Table} from 'antd';
import React, {useEffect, useState} from 'react';
import {sendIPC} from '#preload';
import type {DataEntry, Record} from '@prisma/client';
import {useDebouncedCallback} from 'use-debounce';

import {useAppDispatch} from '../redux/hooks';
import {setHoverEntry} from '../redux/UI/RecordPageSlice';
import ImagePopOver from './ImagePopOver';
import {DownloadOutlined} from '@ant-design/icons';

const RecordCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedRecord, setSelectedRecord] = useState<Record>({} as Record);
  const [partId, setPartId] = useState('');

  const [records, setRecord] = useState<Record[]>([]);
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);

  const CustomRow: React.FC = props => {
    return <ImagePopOver rowProps={props}></ImagePopOver>;
  };

  const debounceEntryHover = useDebouncedCallback((entry: DataEntry) => {
    dispatch(setHoverEntry(entry));
  }, 300);

  const recordRowActions = (record: Record) => {
    return {
      onClick: () => {
        onRecordRowClick(record);
      },
    };
  };

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

  useEffect(() => {
    getDataEntries(selectedRecord);
  }, [selectedRecord]);

  const getAllRecordsByPartID = async (partId: string) => {
    try {
      setSelectedRecord({} as Record);
      const _records = await sendIPC({signalName: 'record:getAll', data: {partId}});
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecord(_records);
    } catch (error) {
      console.log(error);
    }
  };

  const getDataEntries = async (recordId: Record) => {
    try {
      if (!recordId.id) {
        console.log('No selected record');
        return;
      }
      setDataEntries([]);
      const _dataEntries = await sendIPC({
        signalName: 'dataEntry:getAll',
        data: {recordId: recordId.id},
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
      extra={
        <>
          <Input
            className="w-48 mr-4"
            placeholder="VinID"
            value={partId}
            onChange={e => setPartId(e.target.value)}
          ></Input>
          <Button
            type="primary"
            onClick={() => getAllRecordsByPartID(partId)}
          >
            Load
          </Button>
        </>
      }
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

export default RecordCard;
