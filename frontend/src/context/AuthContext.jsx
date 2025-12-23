import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    const response = await axios.get('http://localhost:8083/api/auth/validate', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data.username);
                } catch (error) {
                    console.error('Token validation failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        validateToken();
    }, []);

    const login = async (username, password) => {
        const response = await axios.post('http://localhost:8083/api/auth/login', {
            username,
            password
        });
        
        const { token: authToken } = response.data;
        setToken(authToken);
        setUser(username);
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
