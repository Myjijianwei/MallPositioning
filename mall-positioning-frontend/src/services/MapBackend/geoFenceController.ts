// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** createGeoFence POST /api/api/geo-fence/create */
export async function createGeoFenceUsingPost(
  body: API.GeoFenceCreateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/api/geo-fence/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteGeoFence POST /api/api/geo-fence/delete/${param0} */
export async function deleteGeoFenceUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteGeoFenceUsingPOSTParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean_>(`/api/api/geo-fence/delete/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** listFences GET /api/api/geo-fence/list */
export async function listFencesUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listFencesUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListGeoFence_>('/api/api/geo-fence/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** updateGeoFence POST /api/api/geo-fence/update */
export async function updateGeoFenceUsingPost(
  body: API.GeoFenceUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/api/geo-fence/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
