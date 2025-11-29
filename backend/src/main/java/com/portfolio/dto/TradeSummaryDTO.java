package com.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TradeSummaryDTO {
    
    private BigDecimal totalProfitLoss;
    private BigDecimal todayProfitLoss;
    private BigDecimal weekProfitLoss;
    private BigDecimal monthProfitLoss;
    
    // Portfolio value tracking
    private BigDecimal totalInvested;       // Sum of all position sizes
    private BigDecimal currentPortfolioValue; // Current value based on prices
    private BigDecimal unrealizedPnL;       // P&L from open trades
    private BigDecimal realizedPnL;         // P&L from closed trades
    
    private Long totalTrades;
    private Long openTrades;
    private Long closedTrades;
    private Long winningTrades;
    private Long losingTrades;
    
    private BigDecimal winRate;
    private BigDecimal averageProfit;
    private BigDecimal averageLoss;
}
