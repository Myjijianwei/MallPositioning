package com.project.mapapp.manager;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

// 1. 创建会话管理服务
@Service
public class WebSocketSessionManager {
    // 使用线程安全的嵌套Map：监护人ID -> 设备ID -> 会话
    private final ConcurrentMap<Long, ConcurrentMap<String, WebSocketSession>> sessions =
            new ConcurrentHashMap<>();

    // 添加会话
    public void addSession(Long guardianId, String deviceId, WebSocketSession session) {
        sessions.computeIfAbsent(guardianId, k -> new ConcurrentHashMap<>())
                .put(deviceId, session);
    }

    // 移除会话
    public void removeSession(Long guardianId, String deviceId) {
        if (sessions.containsKey(guardianId)) {
            sessions.get(guardianId).remove(deviceId);
        }
    }

    // 获取所有设备会话
    public List<WebSocketSession> getSessions(Long guardianId) {
        return new ArrayList<>(sessions.getOrDefault(guardianId, new ConcurrentHashMap<>()).values());
    }
}