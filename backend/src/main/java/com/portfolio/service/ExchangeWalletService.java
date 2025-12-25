package com.portfolio.service;

import com.portfolio.model.ExchangeWallet;
import com.portfolio.model.Trade;
import com.portfolio.model.TradeStatus;
import com.portfolio.repository.ExchangeWalletRepository;
import com.portfolio.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ExchangeWalletService {

    private final ExchangeWalletRepository walletRepository;
    private final TradeRepository tradeRepository;
    private final UserService userService;

    public ExchangeWallet createWallet(ExchangeWallet wallet) {
        wallet.setUser(userService.getCurrentUser());
        return walletRepository.save(wallet);
    }

    @Transactional(readOnly = true)
    public List<ExchangeWallet> getAllWallets() {
        return walletRepository.findByUser(userService.getCurrentUser());
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeWallet> getWalletById(Long id) {
        return walletRepository.findByIdAndUser(id, userService.getCurrentUser());
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeWallet> getWalletByExchange(String exchangeName) {
        return walletRepository.findByExchangeNameIgnoreCaseAndUser(exchangeName, userService.getCurrentUser());
    }

    public ExchangeWallet updateWallet(Long id, ExchangeWallet walletDetails) {
        ExchangeWallet wallet = walletRepository.findByIdAndUser(id, userService.getCurrentUser())
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + id));

        wallet.setExchangeName(walletDetails.getExchangeName());
        wallet.setTotalBalance(walletDetails.getTotalBalance());
        wallet.setNotes(walletDetails.getNotes());

        return walletRepository.save(wallet);
    }

    public void deleteWallet(Long id) {
        ExchangeWallet wallet = walletRepository.findByIdAndUser(id, userService.getCurrentUser())
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + id));
        walletRepository.delete(wallet);
    }

    // Get wallet summary with used/available balance
    @Transactional(readOnly = true)
    public Map<String, Object> getWalletSummary(Long walletId) {
        ExchangeWallet wallet = walletRepository.findByIdAndUser(walletId, userService.getCurrentUser())
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + walletId));

        return calculateWalletSummary(wallet);
    }

    // Get all wallets with summaries
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllWalletSummaries() {
        List<ExchangeWallet> wallets = walletRepository.findByUser(userService.getCurrentUser());
        return wallets.stream()
                .map(this::calculateWalletSummary)
                .toList();
    }

    private Map<String, Object> calculateWalletSummary(ExchangeWallet wallet) {
        // Get all open trades for this exchange
        List<Trade> openTrades = tradeRepository.findByExchangeIgnoreCaseAndStatusAndUser(
                wallet.getExchangeName(), TradeStatus.OPEN, userService.getCurrentUser());

        BigDecimal usedBalance = openTrades.stream()
                .map(t -> t.getPositionSize() != null ? t.getPositionSize() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableBalance = wallet.getTotalBalance().subtract(usedBalance);

        Map<String, Object> summary = new HashMap<>();
        summary.put("id", wallet.getId());
        summary.put("exchangeName", wallet.getExchangeName());
        summary.put("totalBalance", wallet.getTotalBalance());
        summary.put("usedBalance", usedBalance);
        summary.put("availableBalance", availableBalance);
        summary.put("openTradesCount", openTrades.size());
        summary.put("notes", wallet.getNotes());
        summary.put("updatedAt", wallet.getUpdatedAt());

        return summary;
    }

    // Get total balance across all exchanges
    @Transactional(readOnly = true)
    public BigDecimal getTotalBalance() {
        BigDecimal total = walletRepository.getTotalBalanceByUser(userService.getCurrentUser());
        return total != null ? total : BigDecimal.ZERO;
    }
}
