package com.portfolio.controller;

import com.portfolio.dto.TradeSummaryDTO;
import com.portfolio.model.CloseReason;
import com.portfolio.model.Trade;
import com.portfolio.model.TradeStatus;
import com.portfolio.model.TradeType;
import com.portfolio.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TradeController {

    private final TradeService tradeService;

    // Create a new trade
    @PostMapping
    public ResponseEntity<Trade> createTrade(@Valid @RequestBody Trade trade) {
        Trade createdTrade = tradeService.createTrade(trade);
        return new ResponseEntity<>(createdTrade, HttpStatus.CREATED);
    }

    // Get all trades
    @GetMapping
    public ResponseEntity<List<Trade>> getAllTrades() {
        List<Trade> trades = tradeService.getAllTrades();
        return ResponseEntity.ok(trades);
    }

    // Get trade by ID
    @GetMapping("/{id}")
    public ResponseEntity<Trade> getTradeById(@PathVariable Long id) {
        return tradeService.getTradeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update trade
    @PutMapping("/{id}")
    public ResponseEntity<Trade> updateTrade(@PathVariable Long id, @Valid @RequestBody Trade trade) {
        try {
            Trade updatedTrade = tradeService.updateTrade(id, trade);
            return ResponseEntity.ok(updatedTrade);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete trade
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrade(@PathVariable Long id) {
        try {
            tradeService.deleteTrade(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Close a trade
    @PatchMapping("/{id}/close")
    public ResponseEntity<Trade> closeTrade(
            @PathVariable Long id,
            @RequestBody Map<String, Object> closeData) {
        try {
            BigDecimal exitPrice = new BigDecimal(closeData.get("exitPrice").toString());
            String closeReasonStr = (String) closeData.get("closeReason");
            CloseReason closeReason = CloseReason.valueOf(closeReasonStr);
            Trade closedTrade = tradeService.closeTrade(id, exitPrice, closeReason);
            return ResponseEntity.ok(closedTrade);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get trades by coin
    @GetMapping("/coin/{coin}")
    public ResponseEntity<List<Trade>> getTradesByCoin(@PathVariable String coin) {
        List<Trade> trades = tradeService.getTradesByCoin(coin);
        return ResponseEntity.ok(trades);
    }

    // Get trades by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Trade>> getTradesByStatus(@PathVariable TradeStatus status) {
        List<Trade> trades = tradeService.getTradesByStatus(status);
        return ResponseEntity.ok(trades);
    }

    // Get trades by type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Trade>> getTradesByType(@PathVariable TradeType type) {
        List<Trade> trades = tradeService.getTradesByType(type);
        return ResponseEntity.ok(trades);
    }

    // Get trades by date range
    @GetMapping("/date-range")
    public ResponseEntity<List<Trade>> getTradesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Trade> trades = tradeService.getTradesByDateRange(startDate, endDate);
        return ResponseEntity.ok(trades);
    }

    // Get trade summary/statistics
    @GetMapping("/summary")
    public ResponseEntity<TradeSummaryDTO> getTradeSummary() {
        TradeSummaryDTO summary = tradeService.getTradeSummary();
        return ResponseEntity.ok(summary);
    }

    // Get unique coins
    @GetMapping("/coins")
    public ResponseEntity<List<String>> getUniqueCoins() {
        List<String> coins = tradeService.getUniqueCoins();
        return ResponseEntity.ok(coins);
    }

    // Get unique exchanges
    @GetMapping("/exchanges")
    public ResponseEntity<List<String>> getUniqueExchanges() {
        List<String> exchanges = tradeService.getUniqueExchanges();
        return ResponseEntity.ok(exchanges);
    }
}
