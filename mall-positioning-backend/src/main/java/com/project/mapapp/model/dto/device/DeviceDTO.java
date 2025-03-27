package com.project.mapapp.model.dto.device;

import lombok.Data;

@Data
public class DeviceDTO {
    private String id;
    private String name;
    private Integer status;
    private String createdAt;
    private String updatedAt;
    private Integer userId;
    private String deviceDescription;
    private String bindData;
}
