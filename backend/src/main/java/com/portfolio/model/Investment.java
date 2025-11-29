package com.portfolio.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trade_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Trade trade;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be positive")
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @NotNull(message = "Price at investment is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    @Column(name = "price_at_investment", nullable = false, precision = 18, scale = 8)
    private BigDecimal priceAtInvestment;

    @Column(name = "current_value", precision = 18, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "profit_loss", precision = 18, scale = 2)
    private BigDecimal profitLoss;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @NotNull
    @Column(name = "investment_date", nullable = false)
    private LocalDateTime investmentDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (investmentDate == null) {
            investmentDate = LocalDateTime.now();
        }
    }
}
