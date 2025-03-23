package com.project.mapapp.config.RabbitMQ;


import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.project.mapapp.mapper.ApplicationMapper;
import com.project.mapapp.model.dto.application.ApplicationMessage;
import com.project.mapapp.model.entity.Application;
import com.project.mapapp.service.ApplicationService;
import com.project.mapapp.service.DeviceService;
import com.project.mapapp.service.NotificationService;
import com.rabbitmq.client.Channel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class ApplicationConsumer {

    @Autowired
    private ApplicationMapper applicationMapper;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private NotificationService notificationService;
    @Autowired
    private ApplicationService applicationService;

    @RabbitListener(queues = "apply_queue")
    public void receiveApplication(ApplicationMessage message, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        try {
            // 打印接收到的消息
            log.info("收到申请：监护人ID={}, 被监护人设备ID={}", message.getGuardianId(), message.getWardDeviceId());

            // 查询申请记录
            QueryWrapper<Application> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("ward_device_id", message.getWardDeviceId())
                    .eq("guardian_id", message.getGuardianId());
            Application application = applicationMapper.selectOne(queryWrapper);

            if (application == null) {
                log.warn("未找到对应的申请记录：监护人ID={}, 被监护人设备ID={}", message.getGuardianId(), message.getWardDeviceId());
                channel.basicAck(deliveryTag, false); // 确认消息
                return;
            }

            Long aId = applicationService.getApplicationId(message.getGuardianId(), message.getWardDeviceId());
            String applicationId = String.valueOf(aId);
            // 通知监护人：申请已提交
            notificationService.notifyGuardian(message.getGuardianId(), "申请已提交，等待审批", applicationId);


            // 自动审批逻辑
            boolean isDeviceValid = deviceService.validateDevice(message.getWardDeviceId());
            if (isDeviceValid) {
                application.setStatus("PENDING_CONFIRMATION"); // 状态改为“待确认”
                log.info("申请已通过初审，等待被监护人确认：被监护人设备ID={}", message.getWardDeviceId());

                // 通知监护人：申请已通过，等待被监护人确认
                notificationService.notifyGuardian(message.getGuardianId(), "申请审核已通过，等待被监护人确认",applicationId);

                // 通知被监护人：您有一条待确认的绑定申请
                notificationService.notifyWard(message.getWardDeviceId(), "您有一条待确认的绑定申请",applicationId);
            } else {
                application.setStatus("REJECTED"); // 状态改为“已拒绝”
                log.info("申请审核被拒绝：被监护人设备ID={}", message.getWardDeviceId());

                // 通知监护人：申请被拒绝
                notificationService.notifyGuardian(message.getGuardianId(), "申请审核被拒绝，设备ID无效",applicationId);

                // 通知被监护人：绑定申请被拒绝
                notificationService.notifyWard(message.getWardDeviceId(), "绑定申请被拒绝",applicationId);
            }

            // 更新申请状态
            applicationMapper.updateById(application);

            // 手动确认消息
            channel.basicAck(deliveryTag, false);
        } catch (Exception e) {
            log.error("处理申请失败：监护人ID={}, 被监护人设备ID={}, 错误信息={}",
                    message.getGuardianId(), message.getWardDeviceId(), e.getMessage(), e);
            channel.basicNack(deliveryTag, false, true); // 重新入队
        }
    }
}