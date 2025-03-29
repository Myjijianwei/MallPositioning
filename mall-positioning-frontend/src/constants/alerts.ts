// 警报状态枚举 - 与后端完全一致
export const AlertStatus = {
  UNRESOLVED: { code: 'UNRESOLVED', text: '未解决', color: 'red' },
  RESOLVED: { code: 'RESOLVED', text: '已解决', color: 'green' },
  IGNORED: { code: 'IGNORED', text: '已忽略', color: 'gray' },
  DELETED: { code: 'DELETED', text: '已删除', color: 'gray' }
};

// 警报类型枚举 - 与后端完全一致
export const AlertType = {
  GEO_FENCE: 'GEO_FENCE',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  BATTERY_LOW: 'BATTERY_LOW',
  SOS: 'SOS'
};

// 警报级别枚举
export const AlertLevel = {
  HIGH: { code: 'HIGH', text: '高', color: 'red' },
  MEDIUM: { code: 'MEDIUM', text: '中', color: 'orange' },
  LOW: { code: 'LOW', text: '低', color: 'green' }
};

// 工具方法
export const getStatusByCode = (code: string) => {
  return Object.values(AlertStatus).find(item => item.code === code) || AlertStatus.UNRESOLVED;
};

export const getAlertTypeText = (type: string) => {
  switch (type) {
    case AlertType.GEO_FENCE: return '围栏报警';
    case AlertType.DEVICE_OFFLINE: return '设备离线';
    case AlertType.BATTERY_LOW: return '低电量';
    case AlertType.SOS: return '紧急求助';
    default: return type;
  }
};

export const getAlertLevelText = (level: string) => {
  return AlertLevel[level]?.text || level;
};
