package com.project.mapapp.config.RabbitMQ;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue applyQueue() {
        return new Queue("apply_queue", true); // 持久化队列
    }

    @Bean
    public DirectExchange applyExchange() {
        return new DirectExchange("apply_exchange");
    }

    @Bean
    public Binding applyBinding(Queue applyQueue, DirectExchange applyExchange) {
        return BindingBuilder.bind(applyQueue).to(applyExchange).with("apply_routing_key");
    }
}
