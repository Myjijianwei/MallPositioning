// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** listAlerts GET /api/alerts */
export async function listAlertsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listAlertsUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageAlertVO_>('/api/alerts', {
    method: 'GET',
    params: {
      // current has a default value: 1
      current: '1',

      // pageSize has a default value: 10
      pageSize: '10',

      ...params,
    },
    ...(options || {}),
  });
}

/** getAlertDetail GET /api/alerts/${param0} */
export async function getAlertDetailUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAlertDetailUsingGETParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseAlertDetailVO_>(`/api/alerts/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** ignoreAlert PUT /api/alerts/${param0}/ignore */
export async function ignoreAlertUsingPut(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.ignoreAlertUsingPUTParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean_>(`/api/alerts/${param0}/ignore`, {
    method: 'PUT',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** resolveAlert PUT /api/alerts/${param0}/resolve */
export async function resolveAlertUsingPut(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.resolveAlertUsingPUTParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean_>(`/api/alerts/${param0}/resolve`, {
    method: 'PUT',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** batchUpdateAlertStatus POST /api/alerts/batchUpdateStatus */
export async function batchUpdateAlertStatusUsingPost(
  body: API.AlertBatchUpdateDTO,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/alerts/batchUpdateStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteAlert POST /api/alerts/delete */
export async function deleteAlertUsingPost(body: number[], options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/alerts/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** updateAlertStatus POST /api/alerts/updateStatus */
export async function updateAlertStatusUsingPost(
  body: API.AlertBatchUpdateDTO,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/alerts/updateStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
