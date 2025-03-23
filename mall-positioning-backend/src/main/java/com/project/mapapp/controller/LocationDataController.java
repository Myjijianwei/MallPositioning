package com.project.mapapp.controller;

import cn.hutool.core.convert.Convert;
import com.project.mapapp.model.entity.LocationData;
import com.project.mapapp.websocket.GpsWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

@CrossOrigin
@RestController
@RequestMapping("/api")
@Api("GPS定位")
public class LocationDataController {

    @Autowired
    private GpsWebSocketHandler gpsWebSocketHandler;

    @PostMapping("/location")
    @ApiOperation("定位数据")
    public String location(@RequestBody LocationData gpsData) {
        // 打印接收到的 GPS 数据
        System.out.println("接收到的GPS数据: " + gpsData.getLatitude() + ", " + gpsData.getLongitude());

        // 根据监护人 ID 和监控端 ID，将 GPS 数据推送到指定监护人的监控端
        gpsWebSocketHandler.sendGpsDataToGuardian(
                Convert.toStr(gpsData.getGuardianId()), // 监护人 ID
                Convert.toStr(gpsData.getMonitorId()),  // 监控端 ID
                gpsData.toString()       // GPS 数据
        );

        return "GPS数据已接收并推送给监控端";
    }
}