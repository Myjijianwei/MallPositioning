package com.project.mapapp.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.project.mapapp.model.entity.Alert;
import com.project.mapapp.service.AlertService;
import com.project.mapapp.mapper.AlertMapper;
import org.springframework.stereotype.Service;

/**
* @author jjw
* @description 针对表【alert(报警记录表)】的数据库操作Service实现
* @createDate 2025-03-03 14:31:28
*/
@Service
public class AlertServiceImpl extends ServiceImpl<AlertMapper, Alert>
    implements AlertService{

}




