package com.project.mapapp.service;

import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.model.dto.geofence.GeoFenceCreateRequest;
import com.project.mapapp.model.entity.GeoFence;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
* @author jjw
* @description 针对表【geo_fence(电子围栏表)】的数据库操作Service
* @createDate 2025-03-03 14:31:28
*/
public interface GeoFenceService extends IService<GeoFence> {

    Boolean createGeoFence(GeoFenceCreateRequest getGeoFenceCreateRequest);

    List<GeoFence> listFences(String deviceId, Long id);
}
