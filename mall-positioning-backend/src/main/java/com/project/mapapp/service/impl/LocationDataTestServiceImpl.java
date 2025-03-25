package com.project.mapapp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.model.dto.location.LocationResponseDTO;
import com.project.mapapp.model.entity.LocationData;
import com.project.mapapp.model.entity.LocationDataTest;
import com.project.mapapp.service.LocationDataTestService;
import com.project.mapapp.mapper.LocationDataTestMapper;
import com.project.mapapp.service.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
* @author jjw
* @description 针对表【location_data_test(位置数据表)】的数据库操作Service实现
* @createDate 2025-03-25 09:36:34
*/
@Service
public class LocationDataTestServiceImpl extends ServiceImpl<LocationDataTestMapper, LocationDataTest>
    implements LocationDataTestService{

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private LocationDataTestMapper locationDataTestMapper;

    /**
     * 处理位置上报
     */
    public boolean processLocation(
            String deviceId,
            BigDecimal latitude,
            BigDecimal longitude,
            BigDecimal accuracy,
            Long guardianId) {

        // 1. 保存到数据库
        LocationDataTest location = new LocationDataTest();
        location.setDevice_id(deviceId);
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setAccuracy(accuracy);
        location.setGuardian_id(guardianId);

        int insert = locationDataTestMapper.insert(location);

        // 2. 通过WebSocket通知监护人
        webSocketService.notifyGuardian(guardianId, convertToResponseDTO(location));

        return insert > 0;
    }

    /**
     * 获取最新位置
     */
    public LocationResponseDTO getLatestLocation(String deviceId, Long guardianId) {
        QueryWrapper<LocationDataTest> query = new QueryWrapper<>();
        query.eq("device_id", deviceId)
                .eq("guardian_id", guardianId)
                .orderByDesc("create_time")
                .last("LIMIT 1");

        LocationDataTest location = locationDataTestMapper.selectOne(query);
        return convertToResponseDTO(location);
    }

    private LocationResponseDTO convertToResponseDTO(LocationDataTest location) {
        if (location == null) return null;

        LocationResponseDTO dto = new LocationResponseDTO();
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        dto.setAccuracy(location.getAccuracy());
        dto.setDeviceId(location.getDevice_id());
        dto.setCreateTime(location.getCreate_time());
        return dto;
    }

}




