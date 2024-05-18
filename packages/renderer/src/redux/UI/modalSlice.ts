import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface ModalState {
  isActive: boolean;
  childComponent: React.ReactNode | null;
}

const initialState: ModalState = {
  isActive: false,
  childComponent: null,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    removeModal: () => initialState,
    setModal: (state, action: PayloadAction<React.ReactNode>) => {
      state.childComponent = action.payload;
      state.isActive = true;
    },
  },
});

export const {setModal, removeModal} = modalSlice.actions;

export default modalSlice.reducer;
