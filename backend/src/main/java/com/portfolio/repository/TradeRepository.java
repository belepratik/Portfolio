package com.portfolio.repository;

import com.portfolio.model.Trade;
import com.portfolio.model.TradeStatus;
import com.portfolio.model.TradeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    // Find trades by coin
    List<Trade> findByCoinIgnoreCase(String coin);

    // Find trades by status
    List<Trade> findByStatus(TradeStatus status);

    // Find trades by type
    List<Trade> findByTradeType(TradeType tradeType);

    // Find trades by exchange
    List<Trade> findByExchangeIgnoreCase(String exchange);

    // Find trades between dates
    List<Trade> findByTradeDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find trades by coin and status
    List<Trade> findByCoinIgnoreCaseAndStatus(String coin, TradeStatus status);

    // Get total profit/loss
    @Query("SELECT COALESCE(SUM(t.profitLoss), 0) FROM Trade t WHERE t.status = 'CLOSED'")
    BigDecimal getTotalProfitLoss();

    // Get total profit/loss for a date range
    @Query("SELECT COALESCE(SUM(t.profitLoss), 0) FROM Trade t WHERE t.status = 'CLOSED' AND t.closeDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalProfitLossBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Count winning trades
    @Query("SELECT COUNT(t) FROM Trade t WHERE t.status = 'CLOSED' AND t.profitLoss > 0")
    Long countWinningTrades();

    // Count losing trades
    @Query("SELECT COUNT(t) FROM Trade t WHERE t.status = 'CLOSED' AND t.profitLoss < 0")
    Long countLosingTrades();

    // Count total closed trades
    @Query("SELECT COUNT(t) FROM Trade t WHERE t.status = 'CLOSED'")
    Long countClosedTrades();

    // Get average profit of winning trades
    @Query("SELECT COALESCE(AVG(t.profitLoss), 0) FROM Trade t WHERE t.status = 'CLOSED' AND t.profitLoss > 0")
    BigDecimal getAverageProfit();

    // Get average loss of losing trades
    @Query("SELECT COALESCE(AVG(t.profitLoss), 0) FROM Trade t WHERE t.status = 'CLOSED' AND t.profitLoss < 0")
    BigDecimal getAverageLoss();

    // Get most traded coins
    @Query("SELECT t.coin, COUNT(t) as tradeCount FROM Trade t GROUP BY t.coin ORDER BY tradeCount DESC")
    List<Object[]> getMostTradedCoins();

    // Get all unique coins
    @Query("SELECT DISTINCT t.coin FROM Trade t ORDER BY t.coin")
    List<String> findAllUniqueCoins();

    // Get all unique exchanges
    @Query("SELECT DISTINCT t.exchange FROM Trade t WHERE t.exchange IS NOT NULL ORDER BY t.exchange")
    List<String> findAllUniqueExchanges();

    // Get total position size (invested amount) for open trades
    @Query("SELECT COALESCE(SUM(t.positionSize), 0) FROM Trade t WHERE t.status = 'OPEN'")
    BigDecimal getTotalOpenPositionSize();

    // Get total position size for all trades
    @Query("SELECT COALESCE(SUM(t.positionSize), 0) FROM Trade t")
    BigDecimal getTotalPositionSize();

    // Get total position size for closed trades
    @Query("SELECT COALESCE(SUM(t.positionSize), 0) FROM Trade t WHERE t.status = 'CLOSED'")
    BigDecimal getTotalClosedPositionSize();
}
