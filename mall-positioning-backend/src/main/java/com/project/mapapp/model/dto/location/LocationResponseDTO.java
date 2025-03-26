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

}
