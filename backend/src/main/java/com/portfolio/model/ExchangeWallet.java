package com.portfolio.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_wallets", 
       uniqueConstraints = @UniqueConstraint(
           name = "uk_exchange_user", 
           columnNames = {"exchange_name", "user_id"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Exchange name is required")
    @Column(name = "exchange_name", nullable = false, length = 50)
    private String exchangeName;

    @NotNull(message = "Total balance is required")
    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    @Column(name = "total_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalBalance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
