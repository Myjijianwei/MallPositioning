package com.project.mapapp.controller;


import cn.hutool.core.util.ObjUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.project.mapapp.annotation.AuthCheck;
import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.common.ResultUtils;
import com.project.mapapp.constant.UserConstant;
import com.project.mapapp.exception.ThrowUtils;
import com.project.mapapp.mapper.DeviceMapper;
import com.project.mapapp.model.dto.device.DeviceBindRequest;
import com.project.mapapp.model.dto.device.DeviceQueryRequest;
import com.project.mapapp.model.dto.device.DeviceUpdateRequest;
import com.project.mapapp.model.entity.Device;
import com.project.mapapp.model.entity.User;
import com.project.mapapp.service.DeviceService;
import com.project.mapapp.service.UserService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/device")
public class DeviceController {
    @Autowired
    private DeviceService deviceService;

    @Autowired
    private UserService userService;
    @Autowired
    private DeviceMapper deviceMapper;

    @GetMapping("/listAllDevice")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<List<DeviceQueryRequest>> listAllDevice() {
        QueryWrapper<Device> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", 1);
        List<Device> devices = deviceMapper.selectList(queryWrapper);
        List<DeviceQueryRequest> deviceQueryRequests = devices.stream().map(device -> {
            DeviceQueryRequest deviceQueryRequest = new DeviceQueryRequest();
            BeanUtils.copyProperties(device, deviceQueryRequest);
            return deviceQueryRequest;
        }).collect(Collectors.toList());
        BeanUtils.copyProperties(devices, deviceQueryRequests);
        return ResultUtils.success(deviceQueryRequests);
    }

    @GetMapping("/listDeviceById")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<List<DeviceQueryRequest>> listDeviceById(HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        QueryWrapper<Device> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", loginUser.getId());
        List<Device> devices = deviceMapper.selectList(queryWrapper);
        List<DeviceQueryRequest> deviceQueryRequests = devices.stream().map(device -> {
            DeviceQueryRequest deviceQueryRequest = new DeviceQueryRequest();
            BeanUtils.copyProperties(device, deviceQueryRequest);
            return deviceQueryRequest;
        }).collect(Collectors.toList());
        BeanUtils.copyProperties(devices, deviceQueryRequests);
        return ResultUtils.success(deviceQueryRequests);
    }


    @PostMapping("/bindDevice")
    public BaseResponse<String> bindDevice(@RequestBody DeviceBindRequest device, HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        ThrowUtils.throwIf(loginUser == null || device == null, ErrorCode.PARAMS_ERROR);
        Boolean isBindSuccess = deviceService.bindDevice(device.getDeviceId(), loginUser.getId(), loginUser.getEmail());
        ThrowUtils.throwIf(!isBindSuccess, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success("绑定成功");
    }

    @GetMapping("/getDeviceById")
    public BaseResponse<Device> getDeviceById(HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        ThrowUtils.throwIf(loginUser == null, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Device> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", loginUser.getId());
        Device device = deviceMapper.selectOne(queryWrapper);
        return ResultUtils.success(device);
    }

    @PostMapping("/updateDevice")
    public BaseResponse<String> updateDevice(@RequestBody DeviceUpdateRequest deviceUpdateRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(ObjUtil.isEmpty(deviceUpdateRequest), ErrorCode.PARAMS_ERROR);
        boolean is=deviceService.updateDevice(deviceUpdateRequest);
        if(is){
            return ResultUtils.success("更新成功！");
        }
        return ResultUtils.success("更新失败");
    }

}

