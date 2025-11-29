package com.portfolio.repository;

import com.portfolio.model.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    // Find all investments for a trade
    List<Investment> findByTradeIdOrderByInvestmentDateDesc(Long tradeId);

    // Get total invested amount for a trade
    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Investment i WHERE i.trade.id = :tradeId")
    BigDecimal getTotalInvestedByTradeId(@Param("tradeId") Long tradeId);

    // Delete all investments for a trade
    void deleteByTradeId(Long tradeId);
}
