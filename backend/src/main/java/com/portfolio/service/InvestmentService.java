package com.portfolio.service;

import com.portfolio.dto.InvestmentDTO;
import com.portfolio.model.Investment;
import com.portfolio.model.Trade;
import com.portfolio.repository.InvestmentRepository;
import com.portfolio.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final TradeRepository tradeRepository;

    // Add investment to a trade
    public InvestmentDTO addInvestment(Long tradeId, InvestmentDTO dto) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + tradeId));

        Investment investment = new Investment();
        investment.setTrade(trade);
        investment.setAmount(dto.getAmount());
        investment.setPriceAtInvestment(dto.getPriceAtInvestment());
        investment.setNotes(dto.getNotes());
        investment.setInvestmentDate(dto.getInvestmentDate());

        // Calculate current value if trade has current price
        if (trade.getCurrentPrice() != null) {
            updateInvestmentValue(investment, trade);
        }

        Investment saved = investmentRepository.save(investment);
        
        // Update trade's total position size
        updateTradePositionSize(trade);
        
        return toDTO(saved);
    }

    // Get all investments for a trade
    @Transactional(readOnly = true)
    public List<InvestmentDTO> getInvestmentsByTradeId(Long tradeId) {
        return investmentRepository.findByTradeIdOrderByInvestmentDateDesc(tradeId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Update investment
    public InvestmentDTO updateInvestment(Long id, InvestmentDTO dto) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found with id: " + id));

        investment.setAmount(dto.getAmount());
        investment.setPriceAtInvestment(dto.getPriceAtInvestment());
        investment.setNotes(dto.getNotes());
        investment.setInvestmentDate(dto.getInvestmentDate());

        // Recalculate current value
        Trade trade = investment.getTrade();
        if (trade.getCurrentPrice() != null) {
            updateInvestmentValue(investment, trade);
        }

        Investment saved = investmentRepository.save(investment);
        
        // Update trade's total position size
        updateTradePositionSize(trade);
        
        return toDTO(saved);
    }

    // Delete investment
    public void deleteInvestment(Long id) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found with id: " + id));
        
        Trade trade = investment.getTrade();
        investmentRepository.delete(investment);
        
        // Update trade's total position size
        updateTradePositionSize(trade);
    }

    // Get total invested for a trade
    @Transactional(readOnly = true)
    public BigDecimal getTotalInvested(Long tradeId) {
        return investmentRepository.getTotalInvestedByTradeId(tradeId);
    }

    // Update all investments when trade's current price changes
    public void updateAllInvestmentsForTrade(Trade trade) {
        List<Investment> investments = investmentRepository.findByTradeIdOrderByInvestmentDateDesc(trade.getId());
        for (Investment investment : investments) {
            updateInvestmentValue(investment, trade);
            investmentRepository.save(investment);
        }
    }

    // Helper: Calculate current value and P&L for an investment
    private void updateInvestmentValue(Investment investment, Trade trade) {
        BigDecimal currentPrice = trade.getCurrentPrice();
        BigDecimal entryPrice = investment.getPriceAtInvestment();
        BigDecimal amount = investment.getAmount();
        Integer leverage = trade.getLeverage();

        if (currentPrice != null && entryPrice != null && amount != null) {
            // Calculate price change percentage
            BigDecimal priceChange;
            if (trade.getTradeType().name().equals("LONG")) {
                priceChange = currentPrice.subtract(entryPrice)
                        .divide(entryPrice, 8, RoundingMode.HALF_UP);
            } else {
                priceChange = entryPrice.subtract(currentPrice)
                        .divide(entryPrice, 8, RoundingMode.HALF_UP);
            }

            // Apply leverage
            BigDecimal leveragedChange = priceChange.multiply(BigDecimal.valueOf(leverage));
            
            // Calculate current value
            BigDecimal currentValue = amount.multiply(BigDecimal.ONE.add(leveragedChange));
            investment.setCurrentValue(currentValue.setScale(2, RoundingMode.HALF_UP));
            
            // Calculate P&L
            BigDecimal profitLoss = currentValue.subtract(amount);
            investment.setProfitLoss(profitLoss.setScale(2, RoundingMode.HALF_UP));
        }
    }

    // Helper: Update trade's position size based on total investments
    private void updateTradePositionSize(Trade trade) {
        BigDecimal totalInvested = investmentRepository.getTotalInvestedByTradeId(trade.getId());
        trade.setPositionSize(totalInvested);
        tradeRepository.save(trade);
    }

    // Helper: Convert to DTO
    private InvestmentDTO toDTO(Investment investment) {
        InvestmentDTO dto = new InvestmentDTO();
        dto.setId(investment.getId());
        dto.setTradeId(investment.getTrade().getId());
        dto.setAmount(investment.getAmount());
        dto.setPriceAtInvestment(investment.getPriceAtInvestment());
        dto.setCurrentValue(investment.getCurrentValue());
        dto.setProfitLoss(investment.getProfitLoss());
        dto.setNotes(investment.getNotes());
        dto.setInvestmentDate(investment.getInvestmentDate());
        dto.setCreatedAt(investment.getCreatedAt());
        return dto;
    }
}
