package com.project.mapapp.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * 报警记录表
 * @TableName alert
 */
@TableName(value ="alert")
@Data
public class Alert {
    /**
     * 报警记录ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 设备ID
     */
    private String device_id;

    /**
     * 报警类型
     */
    private Object type;

    /**
     * 报警信息
     */
    private String message;

    /**
     * 触发时间
     */
    private Date triggered_at;

    /**
     * 解决时间
     */
    private Date resolved_at;

    /**
     * 报警状态
     */
    private Object status;
}