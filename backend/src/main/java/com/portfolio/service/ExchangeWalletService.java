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

    public ExchangeWallet createWallet(ExchangeWallet wallet) {
        return walletRepository.save(wallet);
    }

    @Transactional(readOnly = true)
    public List<ExchangeWallet> getAllWallets() {
        return walletRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeWallet> getWalletById(Long id) {
        return walletRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeWallet> getWalletByExchange(String exchangeName) {
        return walletRepository.findByExchangeNameIgnoreCase(exchangeName);
    }

    public ExchangeWallet updateWallet(Long id, ExchangeWallet walletDetails) {
        ExchangeWallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + id));

        wallet.setExchangeName(walletDetails.getExchangeName());
        wallet.setTotalBalance(walletDetails.getTotalBalance());
        wallet.setNotes(walletDetails.getNotes());

        return walletRepository.save(wallet);
    }

    public void deleteWallet(Long id) {
        ExchangeWallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + id));
        walletRepository.delete(wallet);
    }

    // Get wallet summary with used/available balance
    @Transactional(readOnly = true)
    public Map<String, Object> getWalletSummary(Long walletId) {
        ExchangeWallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found with id: " + walletId));

        return calculateWalletSummary(wallet);
    }

    // Get all wallets with summaries
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllWalletSummaries() {
        List<ExchangeWallet> wallets = walletRepository.findAll();
        return wallets.stream()
                .map(this::calculateWalletSummary)
                .toList();
    }

    private Map<String, Object> calculateWalletSummary(ExchangeWallet wallet) {
        // Get all open trades for this exchange
        List<Trade> openTrades = tradeRepository.findByExchangeIgnoreCaseAndStatus(
                wallet.getExchangeName(), TradeStatus.OPEN);

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
        BigDecimal total = walletRepository.getTotalBalance();
        return total != null ? total : BigDecimal.ZERO;
    }
}
