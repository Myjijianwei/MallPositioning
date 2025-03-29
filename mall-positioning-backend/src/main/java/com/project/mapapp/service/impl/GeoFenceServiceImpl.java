package com.project.mapapp.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.exception.BusinessException;
import com.project.mapapp.exception.ThrowUtils;
import com.project.mapapp.model.dto.geofence.GeoFenceCreateRequest;
import com.project.mapapp.model.dto.geofence.GeoFenceUpdateRequest;
import com.project.mapapp.model.entity.GeoFence;
import com.project.mapapp.mapper.GeoFenceMapper;
import com.project.mapapp.service.GeoFenceService;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Objects;

/**
 * 电子围栏服务实现类
 */
@Service
public class GeoFenceServiceImpl extends ServiceImpl<GeoFenceMapper, GeoFence>
        implements GeoFenceService {

    private final GeoFenceMapper geoFenceMapper;

    public GeoFenceServiceImpl(GeoFenceMapper geoFenceMapper) {
        this.geoFenceMapper = geoFenceMapper;
    }

    @Override
    public Boolean createGeoFence(GeoFenceCreateRequest request) {
        // 参数校验
        ThrowUtils.throwIf(Objects.isNull(request), ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        ThrowUtils.throwIf(CollectionUtils.isEmpty(request.getCoordinates()) ||
                request.getCoordinates().size() < 3, ErrorCode.PARAMS_ERROR, "至少需要3个坐标点");

        // 构建围栏实体
        GeoFence fence = new GeoFence();
        fence.setUser_id(request.getUserId());
        fence.setDevice_id(request.getDeviceId());
        fence.setName(request.getName());
        fence.setCoordinates(JSON.toJSONString(request.getCoordinates()));

        // 保存到数据库
        return this.save(fence);
    }

    @Override
    public List<GeoFence> listFences(String deviceId, Long userId) {
        // 参数校验
        ThrowUtils.throwIf(deviceId == null || userId == null,
                ErrorCode.PARAMS_ERROR, "设备ID和用户ID不能为空");

        // 构建查询条件
        QueryWrapper<GeoFence> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("device_id", deviceId)
                .eq("user_id", userId)
                .orderByDesc("created_at");

        // 执行查询
        return geoFenceMapper.selectList(queryWrapper);
    }

    @Override
    public boolean deleteGeoFence(Long fenceId, Long userId) {
        // 参数校验
        ThrowUtils.throwIf(fenceId == null || userId == null,
                ErrorCode.PARAMS_ERROR, "围栏ID和用户ID不能为空");

        // 检查围栏是否存在及权限
        GeoFence fence = this.getById(fenceId);
        ThrowUtils.throwIf(fence == null, ErrorCode.NOT_FOUND_ERROR, "围栏不存在");
        // 执行删除
        return this.removeById(fenceId);
    }

    @Override
    public boolean updateGeoFence(GeoFenceUpdateRequest updateRequest, Long userId) {
        // 参数校验
        ThrowUtils.throwIf(updateRequest == null || updateRequest.getId() == null || userId == null,
                ErrorCode.PARAMS_ERROR, "参数不能为空");
        if (updateRequest.getCoordinates() != null) {
            ThrowUtils.throwIf(updateRequest.getCoordinates().size() < 3,
                    ErrorCode.PARAMS_ERROR, "至少需要3个坐标点");
        }

        // 查询现有围栏
        GeoFence existingFence = this.getById(updateRequest.getId());
        ThrowUtils.throwIf(existingFence == null,
                ErrorCode.NOT_FOUND_ERROR, "围栏不存在");

        // 更新字段
        boolean needUpdate = false;
        if (updateRequest.getName() != null && !updateRequest.getName().equals(existingFence.getName())) {
            existingFence.setName(updateRequest.getName());
            needUpdate = true;
        }
        if (updateRequest.getCoordinates() != null) {
            String newCoordinates = JSON.toJSONString(updateRequest.getCoordinates());
            if (!newCoordinates.equals(existingFence.getCoordinates())) {
                existingFence.setCoordinates(newCoordinates);
                needUpdate = true;
            }
        }

        // 执行更新
        return !needUpdate || this.updateById(existingFence);
    }
}