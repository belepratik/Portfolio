package com.portfolio.filter;

import com.portfolio.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;
        
        System.out.println("🔍 JWT Filter - Request: " + request.getMethod() + " " + request.getRequestURI());
        System.out.println("🔍 JWT Filter - Auth Header: " + (authHeader != null ? "Bearer ***" : "null"));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ JWT Filter - No valid auth header, continuing without authentication");
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        username = jwtUtil.extractUsername(jwt);
        
        System.out.println("🔍 JWT Filter - Extracted username: " + username);
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            
            if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                System.out.println("✅ JWT Filter - Token valid for user: " + username);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("✅ JWT Filter - Authentication set successfully");
            } else {
                System.out.println("❌ JWT Filter - Token validation failed");
            }
        } else {
            System.out.println("🔍 JWT Filter - Username null or authentication already exists");
        }
        filterChain.doFilter(request, response);
    }
}
