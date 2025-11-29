package com.portfolio.service;

import com.portfolio.dto.TradeSummaryDTO;
import com.portfolio.model.CloseReason;
import com.portfolio.model.Trade;
import com.portfolio.model.TradeStatus;
import com.portfolio.model.TradeType;
import com.portfolio.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TradeService {

    private final TradeRepository tradeRepository;

    // Create a new trade
    public Trade createTrade(Trade trade) {
        return tradeRepository.save(trade);
    }

    // Get all trades
    @Transactional(readOnly = true)
    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    // Get trade by ID
    @Transactional(readOnly = true)
    public Optional<Trade> getTradeById(Long id) {
        return tradeRepository.findById(id);
    }

    // Update trade
    public Trade updateTrade(Long id, Trade tradeDetails) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));

        trade.setCoin(tradeDetails.getCoin());
        trade.setTradeType(tradeDetails.getTradeType());
        trade.setEntryPrice(tradeDetails.getEntryPrice());
        trade.setExitPrice(tradeDetails.getExitPrice());
        trade.setQuantity(tradeDetails.getQuantity());
        trade.setLeverage(tradeDetails.getLeverage());
        trade.setPositionSize(tradeDetails.getPositionSize());
        trade.setFees(tradeDetails.getFees());
        trade.setExchange(tradeDetails.getExchange());
        trade.setStatus(tradeDetails.getStatus());
        trade.setNotes(tradeDetails.getNotes());
        trade.setStopLoss(tradeDetails.getStopLoss());
        trade.setTakeProfit(tradeDetails.getTakeProfit());
        trade.setLiquidationPrice(tradeDetails.getLiquidationPrice());
        trade.setTpHit(tradeDetails.getTpHit());
        trade.setLiquidated(tradeDetails.getLiquidated());
        trade.setCloseReason(tradeDetails.getCloseReason());
        trade.setTradeDate(tradeDetails.getTradeDate());
        trade.setCloseDate(tradeDetails.getCloseDate());

        return tradeRepository.save(trade);
    }

    // Delete trade
    public void deleteTrade(Long id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));
        tradeRepository.delete(trade);
    }

    // Close a trade with reason
    public Trade closeTrade(Long id, BigDecimal exitPrice, CloseReason closeReason) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));

        trade.setExitPrice(exitPrice);
        trade.setStatus(TradeStatus.CLOSED);
        trade.setCloseDate(LocalDateTime.now());
        trade.setCloseReason(closeReason);
        
        // Set the appropriate flags based on close reason
        if (closeReason == CloseReason.TP_HIT) {
            trade.setTpHit(true);
            trade.setLiquidated(false);
        } else if (closeReason == CloseReason.LIQUIDATED) {
            trade.setTpHit(false);
            trade.setLiquidated(true);
        } else {
            trade.setTpHit(false);
            trade.setLiquidated(false);
        }

        return tradeRepository.save(trade);
    }

    // Get trades by coin
    @Transactional(readOnly = true)
    public List<Trade> getTradesByCoin(String coin) {
        return tradeRepository.findByCoinIgnoreCase(coin);
    }

    // Get trades by status
    @Transactional(readOnly = true)
    public List<Trade> getTradesByStatus(TradeStatus status) {
        return tradeRepository.findByStatus(status);
    }

    // Get trades by type
    @Transactional(readOnly = true)
    public List<Trade> getTradesByType(TradeType tradeType) {
        return tradeRepository.findByTradeType(tradeType);
    }

    // Get trades by date range
    @Transactional(readOnly = true)
    public List<Trade> getTradesByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return tradeRepository.findByTradeDateBetween(start, end);
    }

    // Get trade summary/statistics
    @Transactional(readOnly = true)
    public TradeSummaryDTO getTradeSummary() {
        TradeSummaryDTO summary = new TradeSummaryDTO();

        // Total P&L (realized from closed trades)
        BigDecimal realizedPnL = tradeRepository.getTotalProfitLoss();
        summary.setRealizedPnL(realizedPnL != null ? realizedPnL : BigDecimal.ZERO);
        summary.setTotalProfitLoss(realizedPnL);

        // Portfolio tracking
        BigDecimal totalInvested = tradeRepository.getTotalPositionSize();
        BigDecimal openPositionSize = tradeRepository.getTotalOpenPositionSize();
        summary.setTotalInvested(totalInvested != null ? totalInvested : BigDecimal.ZERO);
        
        // Calculate unrealized P&L and current portfolio value from open trades
        List<Trade> openTrades = tradeRepository.findByStatus(TradeStatus.OPEN);
        BigDecimal unrealizedPnL = BigDecimal.ZERO;
        BigDecimal currentValue = BigDecimal.ZERO;
        
        for (Trade trade : openTrades) {
            BigDecimal positionSize = trade.getPositionSize() != null ? trade.getPositionSize() : BigDecimal.ZERO;
            BigDecimal entryPrice = trade.getEntryPrice();
            BigDecimal currentPrice = trade.getCurrentPrice() != null ? trade.getCurrentPrice() : entryPrice;
            Integer leverage = trade.getLeverage() != null ? trade.getLeverage() : 1;
            
            if (entryPrice != null && entryPrice.compareTo(BigDecimal.ZERO) > 0) {
                // Calculate P&L based on trade type with leverage
                // For LONG: profit when price goes up (currentPrice > entryPrice)
                // For SHORT: profit when price goes down (currentPrice < entryPrice)
                BigDecimal priceChangePercent;
                if (trade.getTradeType() == TradeType.LONG) {
                    priceChangePercent = currentPrice.subtract(entryPrice).divide(entryPrice, 8, java.math.RoundingMode.HALF_UP);
                } else {
                    // SHORT: profit when price drops
                    priceChangePercent = entryPrice.subtract(currentPrice).divide(entryPrice, 8, java.math.RoundingMode.HALF_UP);
                }
                
                // Apply leverage to the change
                BigDecimal leveragedChange = priceChangePercent.multiply(BigDecimal.valueOf(leverage));
                
                // Current value = positionSize * (1 + leveragedChange)
                BigDecimal tradeCurrentValue = positionSize.multiply(BigDecimal.ONE.add(leveragedChange));
                currentValue = currentValue.add(tradeCurrentValue);
                
                // P&L = current value - position size
                BigDecimal tradePnL = tradeCurrentValue.subtract(positionSize);
                unrealizedPnL = unrealizedPnL.add(tradePnL);
            } else {
                currentValue = currentValue.add(positionSize);
            }
        }
        
        summary.setUnrealizedPnL(unrealizedPnL);
        // Current portfolio = open position value + realized P&L from closed trades
        summary.setCurrentPortfolioValue(currentValue.add(realizedPnL != null ? realizedPnL : BigDecimal.ZERO));

        // Trade counts
        Long totalClosed = tradeRepository.countClosedTrades();
        Long winningTrades = tradeRepository.countWinningTrades();
        Long losingTrades = tradeRepository.countLosingTrades();

        summary.setTotalTrades(tradeRepository.count());
        summary.setOpenTrades((long) openTrades.size());
        summary.setClosedTrades(totalClosed);
        summary.setWinningTrades(winningTrades);
        summary.setLosingTrades(losingTrades);

        // Win rate
        if (totalClosed > 0) {
            BigDecimal winRate = BigDecimal.valueOf(winningTrades)
                    .divide(BigDecimal.valueOf(totalClosed), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            summary.setWinRate(winRate);
        } else {
            summary.setWinRate(BigDecimal.ZERO);
        }

        // Average profit/loss
        summary.setAverageProfit(tradeRepository.getAverageProfit());
        summary.setAverageLoss(tradeRepository.getAverageLoss());

        // Today's P&L
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        summary.setTodayProfitLoss(tradeRepository.getTotalProfitLossBetweenDates(todayStart, todayEnd));

        // This week's P&L
        LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
        summary.setWeekProfitLoss(tradeRepository.getTotalProfitLossBetweenDates(weekStart, todayEnd));

        // This month's P&L
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        summary.setMonthProfitLoss(tradeRepository.getTotalProfitLossBetweenDates(monthStart, todayEnd));

        return summary;
    }

    // Get unique coins list
    @Transactional(readOnly = true)
    public List<String> getUniqueCoins() {
        return tradeRepository.findAllUniqueCoins();
    }

    // Get unique exchanges list
    @Transactional(readOnly = true)
    public List<String> getUniqueExchanges() {
        return tradeRepository.findAllUniqueExchanges();
    }
}
