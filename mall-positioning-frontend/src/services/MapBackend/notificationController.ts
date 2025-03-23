// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** getNotifications GET /api/api/notification/list */
export async function getNotificationsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getNotificationsUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListNotificationMessage_>('/api/api/notification/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** markAllAsRead POST /api/api/notification/markAllAsRead */
export async function markAllAsReadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.markAllAsReadUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/api/notification/markAllAsRead', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** markAsRead POST /api/api/notification/markAsRead */
export async function markAsReadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.markAsReadUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/api/notification/markAsRead', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getUnreadNotificationCount GET /api/api/notification/unreadCount */
export async function getUnreadNotificationCountUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUnreadNotificationCountUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseInt_>('/api/api/notification/unreadCount', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
