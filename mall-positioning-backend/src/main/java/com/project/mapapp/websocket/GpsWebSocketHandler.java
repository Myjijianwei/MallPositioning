package com.project.mapapp.websocket;


import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class GpsWebSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(GpsWebSocketHandler.class);

    // 存储监护人和被监护人的 WebSocket 会话
    private final Map<String, Map<String, WebSocketSession>> guardianSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String monitorId = getMonitorIdFromSession(session);
        String guardianId = getGuardianIdFromSession(session);
        if (monitorId != null && guardianId != null) {
            guardianSessions.computeIfAbsent(guardianId, k -> new ConcurrentHashMap<>()).put(monitorId, session);
            log.info("监护人 {} 监控端 {} 连接成功", guardianId, monitorId);
            startHeartbeat(session); // 启动心跳检测
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String monitorId = getMonitorIdFromSession(session);
        String guardianId = getGuardianIdFromSession(session);
        if (monitorId != null && guardianId != null) {
            guardianSessions.getOrDefault(guardianId, new ConcurrentHashMap<>()).remove(monitorId);
            log.info("监护人 {} 监控端 {} 断开连接", guardianId, monitorId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket 传输错误: {}", exception.getMessage());
        guardianSessions.values().forEach(sessions -> sessions.values().remove(session)); // 移除失效的会话
    }

    // 推送 GPS 数据到指定监护人的监控端
    public void sendGpsDataToGuardian(String guardianId, String monitorId, String gpsData) {
        Map<String, WebSocketSession> sessions = guardianSessions.get(guardianId);
        if (sessions != null) {
            WebSocketSession session = sessions.get(monitorId);
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(gpsData));
                } catch (IOException e) {
                    log.error("推送 GPS 数据失败: {}", e.getMessage());
                    sessions.remove(monitorId); // 移除失效的会话
                }
            }
        }
    }

    // 启动心跳检测
    private void startHeartbeat(WebSocketSession session) {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(() -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage("heartbeat"));
                }
            } catch (IOException e) {
                log.error("心跳检测失败，关闭会话: {}", session.getId(), e);
                guardianSessions.values().forEach(sessions -> sessions.values().remove(session)); // 移除失效的会话
            }
        }, 0, 30, TimeUnit.SECONDS); // 每 30 秒发送一次心跳
    }

    // 获取监控端的唯一 ID
    private String getMonitorIdFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.contains("monitorId=")) {
            return query.split("monitorId=")[1];
        }
        return null;
    }

    // 获取监护人的唯一 ID
    private String getGuardianIdFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.contains("guardianId=")) {
            return query.split("guardianId=")[1];
        }
        return null;
    }
}