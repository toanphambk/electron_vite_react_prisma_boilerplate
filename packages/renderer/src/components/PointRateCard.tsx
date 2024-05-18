import type {InputRef, TableColumnType, TableProps} from 'antd';
import {DatePicker, Input, Space} from 'antd';
import {Card, Button, Table} from 'antd';
import type {FormEvent} from 'react';
import React, {useRef, useState} from 'react';
import {sendIPC} from '#preload';
import type {PointRate, getPointRateParam} from '../../../main/src/service/Data-Manager.interface';
import {SearchOutlined} from '@ant-design/icons';
import type {FilterDropdownProps} from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
type DataIndex = keyof PointRate;

const PointRateCard: React.FC = () => {
  const [formData, setFormData] = useState<getPointRateParam>({} as getPointRateParam);
  const [pointRate, setPointRate] = useState<PointRate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<PointRate> => ({
    filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters, close}) => (
      <div
        style={{padding: 8}}
        onKeyDown={e => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{marginBottom: 8, display: 'block'}}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{width: 90}}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{width: 90}}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({closeDropdown: false});
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{color: filtered ? '#1677ff' : undefined}} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: visible => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });
  const getPointRate = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      console.log(formData);
      setPointRate([]);
      const result = await sendIPC({signalName: 'getPointRate:byTimeModel', data: formData});
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(result);
      setPointRate(result);
    } catch (error) {
      console.log(error);
    }
  };

  const pointRateCollumn: TableProps<PointRate>['columns'] = [
    {
      title: 'Robot Name',
      dataIndex: 'robotName',
      ...getColumnSearchProps('robotName'),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      ...getColumnSearchProps('position'),
    },
    {
      title: 'Welding Point',
      dataIndex: 'weldingPoint',
      ...getColumnSearchProps('weldingPoint'),
    },
    {
      title: 'Visionpro rate',
      render: ({visionproFailRate}: PointRate) => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            visionproFailRate < 10 ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {100 - visionproFailRate + '%'}
        </div>
      ),
    },
    {
      title: 'Deep Learning rate',
      render: ({deeplearningFailRate}: PointRate) => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            deeplearningFailRate < 10 ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {100 - deeplearningFailRate + '%'}
        </div>
      ),
    },
    {
      title: 'Overall rate',
      render: ({overallFailRate}: PointRate) => (
        <div
          className={`w-20 rounded-lg items-center mx-auto text-white text-center font-semibold ${
            overallFailRate < 10 ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {100 - overallFailRate + '%'}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Point Success Rate"
      className="w-full"
      extra={
        <form onSubmit={(e: FormEvent<HTMLFormElement>) => getPointRate(e)}>
          <Input
            className="w-20 mr-4"
            placeholder="Model"
            value={formData.model}
            required={true}
            onChange={e => setFormData({...formData, model: e.target.value.toUpperCase()})}
          ></Input>
          <DatePicker.RangePicker
            format="YYYY-MM-DD"
            showTime={{format: 'HH:mm'}}
            required={true}
            onChange={date => {
              const timeString = date?.map(date => date?.toISOString());
              if (timeString && timeString[0] && timeString[1]) {
                setFormData({...formData, start: timeString[0], end: timeString[1]});
              }
            }}
          />
          <Button
            className="mx-5"
            type="primary"
            htmlType="submit"
          >
            Load
          </Button>
        </form>
      }
    >
      <Table
        dataSource={pointRate}
        columns={pointRateCollumn}
        rowKey={pointRate => pointRate.robotName + pointRate.position + pointRate.weldingPoint}
        sortDirections={['descend', 'ascend']}
        rowClassName={'cursor-pointer font-semibold'}
        bordered
      />
    </Card>
  );
};

export default PointRateCard;
