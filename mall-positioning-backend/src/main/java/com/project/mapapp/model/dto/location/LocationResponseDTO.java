package com.project.mapapp.model.dto.location;


import com.fasterxml.jackson.annotation.JsonFormat;
import com.project.mapapp.model.entity.LocationDataTest;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * 位置响应DTO
 */
@Data
public class LocationResponseDTO {
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal accuracy;
    private Date createTime;
    private String deviceId;


    // 添加转换方法
    public static LocationResponseDTO fromEntity(LocationReportDTO entity) {
        LocationResponseDTO dto = new LocationResponseDTO();
        dto.setDeviceId(entity.getDeviceId());
        dto.setLatitude(entity.getLatitude());
        dto.setLongitude(entity.getLongitude());
        dto.setAccuracy(entity.getAccuracy());
        dto.setCreateTime(entity.getCreateTime());
        return dto;
    }
}
