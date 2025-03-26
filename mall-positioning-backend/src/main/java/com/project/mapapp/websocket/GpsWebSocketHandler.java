package com.project.mapapp.websocket;

import com.project.mapapp.manager.WebSocketSessionManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import javax.annotation.PreDestroy;
import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.*;

@Service
@Slf4j
public class GpsWebSocketHandler extends TextWebSocketHandler {
    private static final long HEARTBEAT_INTERVAL = 45; // 延长心跳间隔，单位：秒
    private static final long HEARTBEAT_TIMEOUT = 60; // 延长超时时间，单位：秒

    private final WebSocketSessionManager sessionManager;
    private final ScheduledExecutorService heartbeatExecutor;

    @Autowired
    public GpsWebSocketHandler(WebSocketSessionManager sessionManager) {
        this.sessionManager = sessionManager;
        this.heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "websocket-heartbeat");
            t.setDaemon(true);
            return t;
        });
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long guardianId = getGuardianId(session);
        String deviceId = getDeviceId(session);

        if (guardianId == null || deviceId == null) {
            log.warn("Invalid connection attempt - missing parameters: guardianId={}, deviceId={}",
                    guardianId, deviceId);
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        log.info("WebSocket connected: guardianId={}, deviceId={}", guardianId, deviceId);
        sessionManager.addSession(guardianId, deviceId, session);
        startHeartbeat(guardianId, deviceId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long guardianId = getGuardianId(session);
        String deviceId = getDeviceId(session);

        if (guardianId != null && deviceId != null) {
            log.info("WebSocket closed: guardianId={}, deviceId={}, status={}",
                    guardianId, deviceId, status);
            sessionManager.removeSession(guardianId, deviceId);
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 处理接收到的文本消息，如果需要对心跳响应等进行处理，可以在这里添加逻辑
        String payload = message.getPayload();
        log.debug("Received text message: {}", payload);
        // 示例：可以添加对心跳响应的处理逻辑
        if ("heartbeat".equals(payload)) {
            log.debug("Received heartbeat response from guardianId={}, deviceId={}",
                    getGuardianId(session), getDeviceId(session));
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        Long guardianId = getGuardianId(session);
        String deviceId = getDeviceId(session);

        log.error("WebSocket transport error: guardianId={}, deviceId={}, error={}",
                guardianId, deviceId, exception.getMessage(), exception);

        if (guardianId != null && deviceId != null) {
            sessionManager.removeSession(guardianId, deviceId);
        }

        try {
            session.close(CloseStatus.SERVER_ERROR);
        } catch (IOException e) {
            log.debug("Error while closing errored session", e);
        }
    }

    private void startHeartbeat(Long guardianId, String deviceId, WebSocketSession session) {
        ScheduledFuture<?> future = heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new PingMessage());
                    log.debug("Sent ping to guardianId={}, deviceId={}", guardianId, deviceId);

                    // 安排超时检查
                    heartbeatExecutor.schedule(() -> {
                        if (session.isOpen()) {
                            log.warn("Heartbeat timeout for guardianId={}, deviceId={}",
                                    guardianId, deviceId);
                            closeSession(session, CloseStatus.SESSION_NOT_RELIABLE);
                        }
                    }, HEARTBEAT_TIMEOUT, TimeUnit.SECONDS);
                }
            } catch (IOException e) {
                log.warn("Heartbeat failed for guardianId={}, deviceId={}: {}",
                        guardianId, deviceId, e.getMessage());
                closeSession(session, CloseStatus.SESSION_NOT_RELIABLE);
            }
        }, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);

        sessionManager.registerHeartbeatTask(guardianId, deviceId, future);
    }

    private void closeSession(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (IOException e) {
            log.debug("Error while closing session", e);
        }

        Long guardianId = getGuardianId(session);
        String deviceId = getDeviceId(session);
        if (guardianId != null && deviceId != null) {
            sessionManager.removeSession(guardianId, deviceId);
        }
    }

    private Long getGuardianId(WebSocketSession session) {
        Map<String, String> queryParams = parseQueryString(session.getUri());
        String paramValue = queryParams.get("guardianId");
        if (paramValue != null) {
            try {
                return Long.parseLong(paramValue);
            } catch (NumberFormatException e) {
                log.error("Invalid guardianId format: {}", paramValue);
            }
        }
        return null;
    }

    private String getDeviceId(WebSocketSession session) {
        Map<String, String> queryParams = parseQueryString(session.getUri());
        return queryParams.get("deviceId");
    }

    private Map<String, String> parseQueryString(URI uri) {
        Map<String, String> queryParams = new HashMap<>();
        String query = uri.getQuery();
        if (query != null) {
            String[] pairs = query.split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                if (idx != -1) {
                    queryParams.put(pair.substring(0, idx), pair.substring(idx + 1));
                }
            }
        }
        return queryParams;
    }

    @PreDestroy
    public void destroy() {
        try {
            heartbeatExecutor.shutdownNow();
            sessionManager.cleanupAll();
        } catch (Exception e) {
            log.error("Error during WebSocket handler shutdown", e);
        }
    }
}