package com.project.mapapp.controller;

import cn.hutool.core.util.ObjUtil;
import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.common.ResultUtils;
import com.project.mapapp.exception.ThrowUtils;
import com.project.mapapp.model.dto.geofence.GeoFenceCreateRequest;
import com.project.mapapp.model.entity.GeoFence;
import com.project.mapapp.model.entity.User;
import com.project.mapapp.service.GeoFenceService;
import com.project.mapapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
@RequestMapping("/api/geo-fence")
@RequiredArgsConstructor
public class GeoFenceController {
    private final GeoFenceService geoFenceService;
    private final UserService userService;

    @PostMapping("/create")
    public BaseResponse<Boolean> createGeoFence(
            @RequestBody GeoFenceCreateRequest getGeoFenceCreateRequest,
            HttpServletRequest request
            ) {
        ThrowUtils.throwIf(ObjUtil.isEmpty(getGeoFenceCreateRequest), ErrorCode.PARAMS_ERROR);
        getGeoFenceCreateRequest.setUserId(String.valueOf(userService.getLoginUser(request).getId()));
        boolean is=geoFenceService.createGeoFence(getGeoFenceCreateRequest);
        return ResultUtils.success(is);
    }

//    @PostMapping("/delete/{id}")
//    public BaseResponse<Boolean> deleteGeoFence(
//            @PathVariable Long id,
//            HttpServletRequest request
//    ) {
//        return geoFenceService.deleteGeoFence(id, userId);
//    }

    @GetMapping("/list")
    public BaseResponse<List<GeoFence>> listFences(
            @RequestParam String deviceId,
            HttpServletRequest request
    ) {
        User loginUser = userService.getLoginUser(request);
        List<GeoFence> geoFences = geoFenceService.listFences(deviceId, loginUser.getId());
        return ResultUtils.success(geoFences);
    }
}
