package com.portfolio.controller;

import com.portfolio.model.ExchangeWallet;
import com.portfolio.service.ExchangeWalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExchangeWalletController {

    private final ExchangeWalletService walletService;

    @PostMapping
    public ResponseEntity<ExchangeWallet> createWallet(@Valid @RequestBody ExchangeWallet wallet) {
        ExchangeWallet created = walletService.createWallet(wallet);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ExchangeWallet>> getAllWallets() {
        return ResponseEntity.ok(walletService.getAllWallets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExchangeWallet> getWalletById(@PathVariable Long id) {
        return walletService.getWalletById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/exchange/{exchangeName}")
    public ResponseEntity<ExchangeWallet> getWalletByExchange(@PathVariable String exchangeName) {
        return walletService.getWalletByExchange(exchangeName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExchangeWallet> updateWallet(@PathVariable Long id, @Valid @RequestBody ExchangeWallet wallet) {
        try {
            ExchangeWallet updated = walletService.updateWallet(id, wallet);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWallet(@PathVariable Long id) {
        try {
            walletService.deleteWallet(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get wallet summary with used/available balance
    @GetMapping("/{id}/summary")
    public ResponseEntity<Map<String, Object>> getWalletSummary(@PathVariable Long id) {
        try {
            Map<String, Object> summary = walletService.getWalletSummary(id);
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get all wallets with summaries
    @GetMapping("/summaries")
    public ResponseEntity<List<Map<String, Object>>> getAllWalletSummaries() {
        return ResponseEntity.ok(walletService.getAllWalletSummaries());
    }

    // Get total balance across all exchanges
    @GetMapping("/total-balance")
    public ResponseEntity<BigDecimal> getTotalBalance() {
        return ResponseEntity.ok(walletService.getTotalBalance());
    }
}
