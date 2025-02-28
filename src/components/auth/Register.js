import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const RegisterContainer = styled.div`
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

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const userData = { username, email, password };
      const result = await register(userData);
      
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      
      // Redirect to games page after successful registration
      navigate('/games');
    } catch (err) {
      setError(err.message || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  return (
    <RegisterContainer>
      <Title>Create Account</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
          />
        </FormGroup>
        
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
            placeholder="Create a password"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
          />
        </FormGroup>
        
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </SubmitButton>
      </Form>
      
      <LinkText>
        Already have an account? <Link to="/login">Login</Link>
      </LinkText>
    </RegisterContainer>
  );
};

export default Register; 