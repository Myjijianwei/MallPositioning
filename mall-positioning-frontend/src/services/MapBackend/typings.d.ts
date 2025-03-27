declare namespace API {
  type Application = {
    created_at?: string;
    guardian_id?: string;
    id?: number;
    status?: string;
    updated_at?: string;
    ward_device_id?: string;
  };

  type applyDeviceUsingPOSTParams = {
    /** email */
    email: string;
  };

  type BaseResponseApplication_ = {
    code?: number;
    data?: Application;
    message?: string;
  };

  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseDevice_ = {
    code?: number;
    data?: Device;
    message?: string;
  };

  type BaseResponseDeviceInfo_ = {
    code?: number;
    data?: DeviceInfo;
    message?: string;
  };

  type BaseResponseInt_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseListApplication_ = {
    code?: number;
    data?: Application[];
    message?: string;
  };

  type BaseResponseListDevice_ = {
    code?: number;
    data?: Device[];
    message?: string;
  };

  type BaseResponseListDeviceInfo_ = {
    code?: number;
    data?: DeviceInfo[];
    message?: string;
  };

  type BaseResponseListDeviceQueryRequest_ = {
    code?: number;
    data?: DeviceQueryRequest[];
    message?: string;
  };

  type BaseResponseListGeoFence_ = {
    code?: number;
    data?: GeoFence[];
    message?: string;
  };

  type BaseResponseListLocationResponseDTO_ = {
    code?: number;
    data?: LocationResponseDTO[];
    message?: string;
  };

  type BaseResponseListNotificationMessage_ = {
    code?: number;
    data?: NotificationMessage[];
    message?: string;
  };

  type BaseResponseListUserVO_ = {
    code?: number;
    data?: UserVO[];
    message?: string;
  };

  type BaseResponseListWardRequest_ = {
    code?: number;
    data?: WardRequest[];
    message?: string;
  };

  type BaseResponseLocationResponseDTO_ = {
    code?: number;
    data?: LocationResponseDTO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponsePageUserVO_ = {
    code?: number;
    data?: PageUserVO_;
    message?: string;
  };

  type BaseResponseString_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseUser_ = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO_ = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type BaseResponseWardInfo_ = {
    code?: number;
    data?: WardInfo;
    message?: string;
  };

  type confirmApplicationUsingPOSTParams = {
    /** isApproved */
    isApproved: boolean;
    /** notificationId */
    notificationId: number;
  };

  type DeleteRequest = {
    id?: number;
  };

  type Device = {
    bindData?: string;
    created_at?: string;
    device_description?: string;
    id?: string;
    name?: string;
    relationship?: string;
    status?: number;
    updated_at?: string;
    user_id?: number;
  };

  type DeviceBindRequest = {
    deviceId?: string;
    deviceName?: string;
    status?: number;
  };

  type DeviceInfo = {
    created_at?: string;
    current?: number;
    deviceId?: string;
    deviceName?: string;
    device_description?: string;
    emergencyContact?: string;
    guardianId?: number;
    guardianName?: string;
    pageSize?: number;
    relationship?: string;
    sortField?: string;
    sortOrder?: string;
    userAge?: number;
    wardId?: number;
    wardName?: string;
    latitude?: number;
    longitude?: number;
  };

  type DeviceQueryRequest = {
    created_at?: string;
    current?: number;
    device_description?: string;
    id?: string;
    name?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
    updated_at?: string;
    user_id?: number;
  };

  type DeviceUpdateRequest = {
    device_description?: string;
    id?: string;
    name?: string;
  };

  type GeoFence = {
    coordinates?: Record<string, any>;
    created_at?: string;
    device_id?: string;
    id?: number;
    name?: string;
    updated_at?: string;
    user_id?: string;
  };

  type GeoFenceCreateRequest = {
    coordinates?: number[][];
    deviceId?: string;
    id?: string;
    name?: string;
    userId?: string;
  };

  type getApplicationsByGidUsingPOSTParams = {
    /** guardianId */
    guardianId?: string;
  };

  type getDeviceByIdUsingGETParams = {
    /** guardianId */
    guardianId: string;
  };

  type getGuardianDevicesUsingGETParams = {
    /** wardId */
    wardId: number;
  };

  type getLatestLocationUsingGETParams = {
    /** deviceId */
    deviceId?: string;
  };

  type getLocationHistoryUsingGETParams = {
    /** deviceId */
    deviceId: string;
    /** endTime */
    endTime?: string;
    /** startTime */
    startTime?: string;
  };

  type getMySelfDeviceInfoUsingGETParams = {
    /** id */
    id?: number;
  };

  type getNotificationsUsingGETParams = {
    /** userId */
    userId: number;
  };

  type getUnreadNotificationCountUsingGETParams = {
    /** userId */
    userId: number;
  };

  type getUserByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getWardByGidUsingPOSTParams = {
    /** guardianId */
    guardianId?: number;
  };

  type getWardDeviceUsingGETParams = {
    /** guardianId */
    guardianId: string;
  };

  type getWardInfoUsingGETParams = {
    /** wardId */
    wardId?: string;
  };

  type listFencesUsingGETParams = {
    /** deviceId */
    deviceId: string;
  };

  type listUserByPageUsingGETParams = {
    current?: number;
    id?: number;
    mpOpenId?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    unionId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type listUserUsingGETParams = {
    current?: number;
    id?: number;
    mpOpenId?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    unionId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type LocationReportDTO = {
    accuracy?: number;
    createTime?: string;
    deviceId?: string;
    guardianId?: number;
    latitude?: number;
    longitude?: number;
    wardId?: number;
  };

  type LocationResponseDTO = {
    accuracy?: number;
    createTime?: string;
    deviceId?: string;
    latitude?: number;
    longitude?: number;
  };

  type markAllAsReadUsingPOSTParams = {
    /** userId */
    userId: number;
  };

  type markAsReadUsingPOSTParams = {
    /** notificationId */
    notificationId: number;
  };

  type NotificationMessage = {
    application_id?: string;
    created_at?: string;
    id?: number;
    is_read?: number;
    message?: string;
    status?: string;
    userName?: string;
    user_id?: string;
  };

  type OrderItem = {
    asc?: boolean;
    column?: string;
  };

  type PageUserVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: UserVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type sendEmailUsingGETParams = {
    /** email */
    email: string;
  };

  type submitApplicationUsingPOSTParams = {
    /** guardianId */
    guardianId: string;
    /** wardDeviceId */
    wardDeviceId: string;
  };

  type updateWardRelationshipUsingPOSTParams = {
    /** guardianId */
    guardianId?: string;
    /** relationship */
    relationship?: string;
    /** wardId */
    wardId?: string;
  };

  type User = {
    createTime?: string;
    email?: string;
    id?: number;
    isDelete?: number;
    updateTime?: string;
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userPassword?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserAddRequest = {
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userRole?: string;
  };

  type UserLoginRequest = {
    code?: string;
    email?: string;
    userAccount?: string;
    userPassword?: string;
  };

  type UserRegisterRequest = {
    checkPassword?: string;
    code?: string;
    email?: string;
    userAccount?: string;
    userPassword?: string;
    userRole?: string;
  };

  type UserUpdateRequest = {
    code?: string;
    email?: string;
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    createTime?: string;
    email?: string;
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type WardInfo = {
    deviceName?: string;
    emergencyContact?: string;
    id?: number;
    relationship?: string;
    userAge?: number;
    userId?: number;
  };

  type WardRequest = {
    deviceId?: string;
    deviceName?: string;
    id?: number;
    name?: string;
    userId?: number;
  };
}
