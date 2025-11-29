package com.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentDTO {
    private Long id;
    private Long tradeId;
    private BigDecimal amount;
    private BigDecimal priceAtInvestment;
    private BigDecimal currentValue;
    private BigDecimal profitLoss;
    private String notes;
    private LocalDateTime investmentDate;
    private LocalDateTime createdAt;
}
