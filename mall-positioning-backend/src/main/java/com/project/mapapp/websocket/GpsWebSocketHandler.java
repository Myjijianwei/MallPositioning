package com.project.mapapp.websocket;

import com.project.mapapp.manager.WebSocketSessionManager;
import io.netty.util.concurrent.ScheduledFuture;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

// 2. 修改GpsWebSocketHandler
@Service
@Slf4j
public class GpsWebSocketHandler extends TextWebSocketHandler {
    private final WebSocketSessionManager sessionManager;
    private final ScheduledExecutorService heartbeatExecutor =
            Executors.newScheduledThreadPool(4);

    @Autowired
    public GpsWebSocketHandler(WebSocketSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long guardianId = getGuardianId(session);
        String deviceId = getParameter(session, "deviceId");

        if (guardianId != null && deviceId != null) {
            sessionManager.addSession(guardianId, deviceId, session);
            startHeartbeat(session); // 开启心跳
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long guardianId = getGuardianId(session);
        String deviceId = getParameter(session, "deviceId");
        if (guardianId != null && deviceId != null) {
            sessionManager.removeSession(guardianId, deviceId);
        }
    }

    private void startHeartbeat(WebSocketSession session) {
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new PingMessage());
                }
            } catch (IOException e) {
                closeSession(session);
            }
        }, 30, 30, TimeUnit.SECONDS); // 30秒间隔
    }

    private void closeSession(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close(CloseStatus.SERVER_ERROR);
            }
        } catch (IOException e) {
            // 忽略关闭时的异常
        } finally {
            Long guardianId = getGuardianId(session);
            String deviceId = getParameter(session, "deviceId");
            if (guardianId != null && deviceId != null) {
                sessionManager.removeSession(guardianId, deviceId);
            }
        }
    }

    private Long getGuardianId(WebSocketSession session) {
        String paramValue = getParameter(session, "guardianId");
        if (paramValue != null) {
            try {
                return Long.parseLong(paramValue);
            } catch (NumberFormatException e) {
                log.error("GuardianId参数格式错误", e);
                return null;
            }
        }
        return null;
    }

    private String getParameter(WebSocketSession session, String param) {
        String query = session.getUri().getQuery();
        if (query != null) {
            String[] params = query.split("&");
            for (String p : params) {
                if (p.startsWith(param + "=")) {
                    return p.substring((param + "=").length());
                }
            }
        }
        return null;
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket传输错误: {}", exception.getMessage());
        closeSession(session);
    }
}