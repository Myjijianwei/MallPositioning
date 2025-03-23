// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** applyDevice POST /api/msm/applyDevice/${param0} */
export async function applyDeviceUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.applyDeviceUsingPOSTParams,
  options?: { [key: string]: any },
) {
  const { email: param0, ...queryParams } = params;
  return request<API.BaseResponseString_>(`/api/msm/applyDevice/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** sendEmail GET /api/msm/sendEmail/${param0} */
export async function sendEmailUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.sendEmailUsingGETParams,
  options?: { [key: string]: any },
) {
  const { email: param0, ...queryParams } = params;
  return request<API.BaseResponseString_>(`/api/msm/sendEmail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
