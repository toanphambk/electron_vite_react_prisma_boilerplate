import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {api} from '../services/api';

interface LoginState {
  isLoading: boolean;
  isError: string | null;
  email: string;
  password: string;
}

const initialState: LoginState = {
  isLoading: false,
  isError: null,
  email: '',
  password: '',
};

const loginSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    SetEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    SetPassword: (state, action) => {
      state.password = action.payload;
    },
    LoginStart: state => {
      state.isLoading = true;
      state.isError = null;
    },
    LoginSuccess: state => {
      state.isLoading = false;
      state.isError = null;
    },
    LoginFailure: (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.data;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(api.endpoints.authControllerAdminLogin.matchFulfilled, state => {
        loginSlice.caseReducers.LoginSuccess(state);
      })
      .addMatcher(api.endpoints.authControllerAdminLogin.matchPending, state => {
        loginSlice.caseReducers.LoginStart(state);
      })
      .addMatcher(api.endpoints.authControllerAdminLogin.matchRejected, (state, action) => {
        loginSlice.caseReducers.LoginFailure(state, action);
      });
  },
});

export const {LoginStart, LoginSuccess, LoginFailure, SetEmail, SetPassword} = loginSlice.actions;

export default loginSlice.reducer;
