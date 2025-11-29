package com.portfolio.controller;

import com.portfolio.dto.InvestmentDTO;
import com.portfolio.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/trades/{tradeId}/investments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class InvestmentController {

    private final InvestmentService investmentService;

    // Add investment to a trade
    @PostMapping
    public ResponseEntity<InvestmentDTO> addInvestment(
            @PathVariable Long tradeId,
            @Valid @RequestBody InvestmentDTO dto) {
        InvestmentDTO created = investmentService.addInvestment(tradeId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // Get all investments for a trade
    @GetMapping
    public ResponseEntity<List<InvestmentDTO>> getInvestments(@PathVariable Long tradeId) {
        List<InvestmentDTO> investments = investmentService.getInvestmentsByTradeId(tradeId);
        return ResponseEntity.ok(investments);
    }

    // Get total invested for a trade
    @GetMapping("/total")
    public ResponseEntity<BigDecimal> getTotalInvested(@PathVariable Long tradeId) {
        BigDecimal total = investmentService.getTotalInvested(tradeId);
        return ResponseEntity.ok(total);
    }

    // Update investment
    @PutMapping("/{investmentId}")
    public ResponseEntity<InvestmentDTO> updateInvestment(
            @PathVariable Long tradeId,
            @PathVariable Long investmentId,
            @Valid @RequestBody InvestmentDTO dto) {
        try {
            InvestmentDTO updated = investmentService.updateInvestment(investmentId, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete investment
    @DeleteMapping("/{investmentId}")
    public ResponseEntity<Void> deleteInvestment(
            @PathVariable Long tradeId,
            @PathVariable Long investmentId) {
        try {
            investmentService.deleteInvestment(investmentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
