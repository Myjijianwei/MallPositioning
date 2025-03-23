// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** confirmApplication POST /api/apply/confirm */
export async function confirmApplicationUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.confirmApplicationUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/apply/confirm', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getApplicationsByGid POST /api/apply/getApplicationsByGId */
export async function getApplicationsByGidUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getApplicationsByGidUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListApplication_>('/api/apply/getApplicationsByGId', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** submitApplication POST /api/apply/submit */
export async function submitApplicationUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.submitApplicationUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseApplication_>('/api/apply/submit', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
