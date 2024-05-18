import {createApi} from '@reduxjs/toolkit/query/react';
import baseQuery from './baseQuery';

export const emptySplitApi = createApi({
  baseQuery,
  endpoints: () => ({}),
});
