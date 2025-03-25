package com.project.mapapp.controller;


import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.common.ResultUtils;
import com.project.mapapp.model.dto.location.LocationReportDTO;
import com.project.mapapp.model.dto.location.LocationResponseDTO;
import com.project.mapapp.service.LocationDataTestService;
import com.project.mapapp.service.UserService;
import com.project.mapapp.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;

@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
@Validated
@Slf4j
public class LocationDataController {

    private final LocationDataTestService locationService;
    private final UserService userService;
    private final WebSocketService webSocketService;

    /**
     * 上报当前位置
     */
    @PostMapping("/report")
    public BaseResponse<String> reportLocation(@RequestBody LocationReportDTO dto) {
        log.info("收到位置上报: {}", dto);

        boolean success = locationService.processLocation(
                dto.getDeviceId(),
                dto.getLatitude(),
                dto.getLongitude(),
                dto.getAccuracy(),
                dto.getGuardianId()
        );

        if (success) {
            // 主动触发一次推送测试
            LocationResponseDTO responseDTO = LocationResponseDTO.fromEntity(dto);
            webSocketService.notifyGuardian(dto.getGuardianId(), responseDTO);
            return ResultUtils.success("上报成功");
        }
        return ResultUtils.error(ErrorCode.OPERATION_ERROR);
    }

    /**
     * 获取最新位置
     */
    @GetMapping("/latestLocationByDeviceID")
    public BaseResponse<LocationResponseDTO> getLatestLocation(String deviceId, HttpServletRequest request) {
        Long guardianId = userService.getLoginUser(request).getId();
        LocationResponseDTO response = locationService.getLatestLocation(deviceId, guardianId);
        return ResultUtils.success(response);
    }
}