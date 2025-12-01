package com.portfolio.repository;

import com.portfolio.model.ExchangeWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ExchangeWalletRepository extends JpaRepository<ExchangeWallet, Long> {
    
    Optional<ExchangeWallet> findByExchangeNameIgnoreCase(String exchangeName);
    
    boolean existsByExchangeNameIgnoreCase(String exchangeName);
    
    @Query("SELECT SUM(e.totalBalance) FROM ExchangeWallet e")
    BigDecimal getTotalBalance();
}
