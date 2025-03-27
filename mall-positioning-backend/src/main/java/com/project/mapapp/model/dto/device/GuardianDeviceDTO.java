package com.project.mapapp.model.dto.device;

import lombok.Data;

@Data
public class GuardianDeviceDTO extends DeviceDTO {
    private String wardId;
    private String wardName;
    private String relationship;
}
