import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { glassTerminal } from '../../styles/terminal';

const ComingSoonContainer = styled.div`
  ${glassTerminal}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
  position: relative;

  #main-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

const ComingSoonContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const ComingSoonTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #fff;
`;

const ComingSoonSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #ccc;
`;

const HomeButton = styled.button`
  background-color: #4a6fa5;
  color: white;
  border: none;
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;

  &:hover {
    background-color: #3a5a8f;
  }
`;

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <ComingSoonContainer id="main-content">
      <ComingSoonContent>
        <ComingSoonTitle>Coming Soon</ComingSoonTitle>
        <ComingSoonSubtitle>
          We're working hard to bring you an amazing experience. Check back soon!
        </ComingSoonSubtitle>
        <HomeButton onClick={handleBackToHome}>Back to Home</HomeButton>
      </ComingSoonContent>
    </ComingSoonContainer>
  );
};

export default ComingSoonPage;