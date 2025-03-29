// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** getLocationHistory GET /api/location/history */
export async function getLocationHistoryUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLocationHistoryUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListLocationResponseDTO_>('/api/location/history', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getLatestLocation GET /api/location/latestLocationByDeviceID */
export async function getLatestLocationUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLatestLocationUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLocationResponseDTO_>('/api/location/latestLocationByDeviceID', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** reportLocation POST /api/location/report */
export async function reportLocationUsingPost(
  body: API.LocationReportDTO,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/location/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
