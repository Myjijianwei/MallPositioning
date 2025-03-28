package com.project.mapapp.model.dto.location;


import lombok.Data;

import java.math.BigDecimal;

/**
 * 位置响应DTO
 */
@Data
public class LocationResponseDTO {
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal accuracy;
    private String createTime;
    private String deviceId;

}
