package com.portfolio.repository;

import com.portfolio.model.ExchangeWallet;
import com.portfolio.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExchangeWalletRepository extends JpaRepository<ExchangeWallet, Long> {
    
    // Find wallets by user
    List<ExchangeWallet> findByUser(User user);
    
    // Find wallet by exchange name and user
    Optional<ExchangeWallet> findByExchangeNameIgnoreCaseAndUser(String exchangeName, User user);
    
    // Find wallet by ID and user (for security)
    Optional<ExchangeWallet> findByIdAndUser(Long id, User user);
    
    // Check if wallet exists for user and exchange
    boolean existsByExchangeNameIgnoreCaseAndUser(String exchangeName, User user);
    
    @Query("SELECT SUM(e.totalBalance) FROM ExchangeWallet e WHERE e.user = :user")
    BigDecimal getTotalBalanceByUser(@Param("user") User user);
}
