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
export async function getDeviceByIdUsingGet1(options?: { [key: string]: any }) {
  return request<API.BaseResponseDevice_>('/api/device/getDeviceById', {
    method: 'GET',
    ...(options || {}),
  });
}

/** getDeviceById GET /api/device/getDeviceById/${param0} */
export async function getDeviceByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDeviceByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  const { guardianId: param0, ...queryParams } = params;
  return request<API.BaseResponseDevice_>(`/api/device/getDeviceById/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** getGuardianDevices GET /api/device/getGuardianDevices */
export async function getGuardianDevicesUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGuardianDevicesUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListDevice_>('/api/device/getGuardianDevices', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getWardDevice GET /api/device/getWardDeviceByGuardId/${param0} */
export async function getWardDeviceUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getWardDeviceUsingGETParams,
  options?: { [key: string]: any },
) {
  const { guardianId: param0, ...queryParams } = params;
  return request<API.BaseResponseListWardDeviceInfo_>(
    `/api/device/getWardDeviceByGuardId/${param0}`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
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
