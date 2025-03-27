package com.project.mapapp.controller;


import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.common.ResultUtils;
import com.project.mapapp.mapper.ApplicationMapper;
import com.project.mapapp.mapper.DeviceMapper;
import com.project.mapapp.model.dto.location.LocationReportDTO;
import com.project.mapapp.model.dto.location.LocationResponseDTO;
import com.project.mapapp.model.entity.Application;
import com.project.mapapp.model.entity.Device;
import com.project.mapapp.service.LocationDataTestService;
import com.project.mapapp.service.UserService;
import com.project.mapapp.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
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
    private final DeviceMapper deviceMapper;
    private final ApplicationMapper applicationMapper;

    /**
     * 上报当前位置
     */
    @PostMapping("/report")
    public BaseResponse<String> reportLocation(@RequestBody LocationReportDTO dto) {
        log.info("收到位置上报: {}", dto);
        QueryWrapper<Device> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id",dto.getWardId());
        String deviceId = deviceMapper.selectOne(queryWrapper).getId();
        dto.setDeviceId(deviceId);
        //ward_device_id
        QueryWrapper<Application> applicationQueryWrapper = new QueryWrapper<>();
        applicationQueryWrapper.eq("ward_device_id",deviceId);
        Long guardianId = Long.valueOf(applicationMapper.selectOne(applicationQueryWrapper).getGuardian_id());
        dto.setGuardianId(guardianId);


        boolean success = locationService.processLocation(
                dto.getDeviceId(),
                dto.getLatitude(),
                dto.getLongitude(),
                dto.getAccuracy(),
                dto.getGuardianId()
        );

        if (success) {
            // 主动触发一次推送测试
            LocationResponseDTO locationResponseDTO = new LocationResponseDTO();
            BeanUtils.copyProperties(dto, locationResponseDTO);
            webSocketService.notifyGuardian(dto.getGuardianId(), locationResponseDTO);
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