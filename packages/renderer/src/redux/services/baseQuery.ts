import {fetchBaseQuery} from '@reduxjs/toolkit/dist/query';
// import type {RootState} from '../store';

const BASE_URL = 'http://localhost:3000/';
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  // prepareHeaders: (headers, {getState}) => {
  //   const token = (getState() as RootState).authReducer.token;
  //   if (token) {
  //     headers.set('authorization', `Bearer ${token}`);
  //   }
  //   return headers;
  // },
});

export default baseQuery;
