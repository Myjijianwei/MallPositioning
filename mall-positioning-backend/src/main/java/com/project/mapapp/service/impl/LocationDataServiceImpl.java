package com.project.mapapp.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.model.entity.LocationData;
import com.project.mapapp.service.LocationDataService;
import com.project.mapapp.mapper.LocationDataMapper;
import org.springframework.stereotype.Service;

/**
* @author jjw
* @description 针对表【location_data(位置数据表)】的数据库操作Service实现
* @createDate 2025-03-03 14:31:28
*/
@Service
public class LocationDataServiceImpl extends ServiceImpl<LocationDataMapper, LocationData>
    implements LocationDataService{

}




