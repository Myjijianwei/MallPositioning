// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** bindDevice POST /api/device/bindDevice */
export async function bindDeviceUsingPost(
  body: API.DeviceBindRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/device/bindDevice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getDeviceById GET /api/device/getDeviceById */
export async function getDeviceByIdUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseDevice_>('/api/device/getDeviceById', {
    method: 'GET',
    ...(options || {}),
  });
}

/** listAllDevice GET /api/device/listAllDevice */
export async function listAllDeviceUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListDeviceQueryRequest_>('/api/device/listAllDevice', {
    method: 'GET',
    ...(options || {}),
  });
}

/** listDeviceById GET /api/device/listDeviceById */
export async function listDeviceByIdUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListDeviceQueryRequest_>('/api/device/listDeviceById', {
    method: 'GET',
    ...(options || {}),
  });
}

/** updateDevice POST /api/device/updateDevice */
export async function updateDeviceUsingPost(
  body: API.DeviceUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/device/updateDevice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
