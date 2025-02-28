import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const LoginContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: #e0e0e0;
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #e0e0e0;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: #e0e0e0;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 16px;
`;

const SubmitButton = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #357abd;
  }

  &:disabled {
    background-color: #444;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-bottom: 15px;
  padding: 10px;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
`;

const LinkText = styled.div`
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  color: #999;

  a {
    color: #4a90e2;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      
      // Redirect to games page after successful login
      navigate('/games');
    } catch (err) {
      setError(err.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  return (
    <LoginContainer>
      <Title>Login to Your Account</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </FormGroup>
        
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </SubmitButton>
      </Form>
      
      <LinkText>
        Don't have an account? <Link to="/register">Register</Link>
      </LinkText>
    </LoginContainer>
  );
};

export default Login; 