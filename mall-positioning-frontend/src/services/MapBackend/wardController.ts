// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** getWardInfo GET /api/ward/getWardInfo */
export async function getWardInfoUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getWardInfoUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseWardInfo_>('/api/ward/getWardInfo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** updateWardRelationship POST /api/ward/updateRelationship */
export async function updateWardRelationshipUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateWardRelationshipUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/ward/updateRelationship', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
