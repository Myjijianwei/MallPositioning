package com.project.mapapp.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 位置数据表
 * @TableName location_data
 */
@TableName(value ="location_data")
@Data
public class LocationData {
    /**
     * 位置记录ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 设备ID
     */
    private String device_id;

    /**
     * 时间戳
     */
    private Date timestamp;

    /**
     * 纬度
     */
    private BigDecimal latitude;

    /**
     * 经度
     */
    private BigDecimal longitude;

    /**
     * 定位精度
     */
    private BigDecimal accuracy;

    /**
     * 定位来源
     */
    private String source;

    /**
     * 监护人 ID
     */
    private Long guardianId;

    /**
     * 监控端 ID
     */
    private Long monitorId;

}