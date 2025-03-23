// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 定位数据 POST /api/api/location */
export async function locationUsingPost(body: API.LocationData, options?: { [key: string]: any }) {
  return request<string>('/api/api/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
