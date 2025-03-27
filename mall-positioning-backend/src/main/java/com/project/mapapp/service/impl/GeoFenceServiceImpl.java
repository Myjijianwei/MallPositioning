package com.project.mapapp.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.exception.ThrowUtils;
import com.project.mapapp.model.dto.geofence.GeoFenceCreateRequest;
import com.project.mapapp.model.entity.GeoFence;
import com.project.mapapp.service.DeviceService;
import com.project.mapapp.service.GeoFenceService;
import com.project.mapapp.mapper.GeoFenceMapper;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
* @author jjw
* @description 针对表【geo_fence(电子围栏表)】的数据库操作Service实现
* @createDate 2025-03-03 14:31:28
*/
@Service
public class GeoFenceServiceImpl extends ServiceImpl<GeoFenceMapper, GeoFence>
    implements GeoFenceService{

    private final GeoFenceMapper geoFenceMapper;


    public GeoFenceServiceImpl(GeoFenceMapper geoFenceMapper) {
        this.geoFenceMapper = geoFenceMapper;
    }

    @Override
    public Boolean createGeoFence(GeoFenceCreateRequest request) {
        GeoFence fence = new GeoFence();
        fence.setUser_id(request.getUserId());
        fence.setDevice_id(request.getDeviceId());
        fence.setName(request.getName());

        // 将 coordinates 列表转换为 JSON 字符串
        String jsonCoordinates = JSON.toJSONString(request.getCoordinates());
        fence.setCoordinates(jsonCoordinates);

        return this.save(fence);
    }

    @Override
    public List<GeoFence> listFences(String deviceId, Long id) {
        QueryWrapper<GeoFence> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("device_id", deviceId);
        queryWrapper.eq("user_id", id);
        return geoFenceMapper.selectList(queryWrapper);
    }
}




