package com.project.mapapp.model.dto.device;

import lombok.Data;

@Data
public class WardDeviceDTO extends DeviceDTO {
    private String guardianId;
    private String guardianName;
    private String relationship;
}
