package com.project.mapapp.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.model.entity.GeoFence;
import com.project.mapapp.service.GeoFenceService;
import com.project.mapapp.mapper.GeoFenceMapper;
import org.springframework.stereotype.Service;

/**
* @author jjw
* @description 针对表【geo_fence(电子围栏表)】的数据库操作Service实现
* @createDate 2025-03-03 14:31:28
*/
@Service
public class GeoFenceServiceImpl extends ServiceImpl<GeoFenceMapper, GeoFence>
    implements GeoFenceService{

}




