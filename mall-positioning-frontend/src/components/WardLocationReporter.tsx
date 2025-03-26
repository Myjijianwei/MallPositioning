// components/WardLocationReporter.tsx
import { useLocationReporting } from '@/hooks/useLocationReporting';
import { Button } from 'antd';

const WardLocationReporter = () => {
  const { accuracy, isActive, start, stop } = useLocationReporting({
    interval: 10000,
    onReport: async (position) => {
      try {
        await fetch('/api/location/report', {
          method: 'POST',
          body: JSON.stringify({
            deviceId: 'current_device_id',
            ...position
          })
        });
      } catch (error) {
        console.error('上报失败', error);
      }
    }
  });

  return (
    <div className="report-status">
      <p>定位精度: {accuracy}m</p>
      <Button onClick={isActive ? stop : start}>
        {isActive ? '停止上报' : '开始上报'}
      </Button>
    </div>
  );
};
