package com.portfolio.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "trades")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cascade delete investments when trade is deleted
    @OneToMany(mappedBy = "trade", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Investment> investments;

    @NotBlank(message = "Coin symbol is required")
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String coin;

    @NotNull(message = "Trade type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false, length = 10)
    private TradeType tradeType;

    @NotNull(message = "Entry price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Entry price must be positive")
    @Column(name = "entry_price", nullable = false, precision = 18, scale = 8)
    private BigDecimal entryPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Exit price must be positive")
    @Column(name = "exit_price", precision = 18, scale = 8)
    private BigDecimal exitPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Current price must be positive")
    @Column(name = "current_price", precision = 18, scale = 8)
    private BigDecimal currentPrice;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be positive")
    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal quantity;

    @NotNull(message = "Leverage is required")
    @Min(value = 1, message = "Leverage must be at least 1")
    @Max(value = 125, message = "Leverage cannot exceed 125")
    @Column(nullable = false)
    private Integer leverage;

    @Column(name = "position_size", precision = 18, scale = 2)
    private BigDecimal positionSize;

    @Column(name = "profit_loss", precision = 18, scale = 2)
    private BigDecimal profitLoss;

    @Column(name = "profit_loss_pct", precision = 8, scale = 2)
    private BigDecimal profitLossPercentage;

    @Column(precision = 18, scale = 2)
    private BigDecimal fees;

    @Size(max = 50)
    @Column(length = 50)
    private String exchange;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TradeStatus status = TradeStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "stop_loss", precision = 18, scale = 8)
    private BigDecimal stopLoss;

    @Column(name = "take_profit", precision = 18, scale = 8)
    private BigDecimal takeProfit;

    // Liquidation price (manual entry)
    @Column(name = "liquidation_price", precision = 18, scale = 8)
    private BigDecimal liquidationPrice;

    // Checkbox: TP hit
    @Column(name = "tp_hit", nullable = false)
    private Boolean tpHit = false;

    // Checkbox: Liquidated
    @Column(name = "liquidated", nullable = false)
    private Boolean liquidated = false;

    // How the trade was closed: TP_HIT, LIQUIDATED, MANUAL
    @Enumerated(EnumType.STRING)
    @Column(name = "close_reason", length = 20)
    private CloseReason closeReason;

    @NotNull(message = "Trade date is required")
    @Column(name = "trade_date", nullable = false)
    private LocalDateTime tradeDate;

    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateProfitLoss();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateProfitLoss();
    }

    // Calculate profit/loss based on entry/exit price, quantity, leverage, and trade type
    public void calculateProfitLoss() {
        if (exitPrice != null && entryPrice != null && quantity != null && leverage != null) {
            BigDecimal priceDiff;
            if (tradeType == TradeType.LONG) {
                priceDiff = exitPrice.subtract(entryPrice);
            } else {
                priceDiff = entryPrice.subtract(exitPrice);
            }
            
            // Calculate position size
            this.positionSize = entryPrice.multiply(quantity);
            
            // Calculate P&L with leverage
            BigDecimal rawPnL = priceDiff.multiply(quantity).multiply(BigDecimal.valueOf(leverage));
            
            // Subtract fees if present
            if (fees != null) {
                this.profitLoss = rawPnL.subtract(fees);
            } else {
                this.profitLoss = rawPnL;
            }
            
            // Calculate percentage
            if (positionSize.compareTo(BigDecimal.ZERO) > 0) {
                this.profitLossPercentage = this.profitLoss
                        .divide(positionSize, 2, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
        }
    }
}
