import type {DataEntry, Record} from '@prisma/client';
import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

interface RecordPageState {
  selectedRecord: Record;
  hoverEntry: DataEntry;
}

const initialState: RecordPageState = {
  selectedRecord: {} as Record,
  hoverEntry: {} as DataEntry,
};

const recordPageSlice = createSlice({
  name: 'recordPage',
  initialState,
  reducers: {
    setSelectedRecord: (state, action: PayloadAction<Record>) => {
      state.selectedRecord = action.payload;
    },
    setHoverEntry: (state, action: PayloadAction<DataEntry>) => {
      state.hoverEntry = action.payload;
    },
  },
});

export const {setSelectedRecord, setHoverEntry} = recordPageSlice.actions;

export default recordPageSlice.reducer;
